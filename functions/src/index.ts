import { initializeApp } from "firebase-admin/app";
import { getMessaging, type BatchResponse } from "firebase-admin/messaging";
import { getDatabase } from "firebase-admin/database";
import { onValueUpdated } from "firebase-functions/v2/database";
import { logger } from "firebase-functions";

initializeApp();

type RoomRecord = Record<string, unknown>;

const COMMENT_KEYS = ["comment1", "comment2", "comment3"] as const;
type PushPayload = {
  notification: { title: string; body: string };
  webpush: {
    headers: { Urgency: string; TTL: string };
    fcmOptions: { link: string };
    notification: { icon: string; badge: string };
  };
  data: { roomId: string; path: string; eventType: string };
};

function asRoomRecord(value: unknown): RoomRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as RoomRecord;
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function commentText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const text = (value as Record<string, unknown>).text;
    if (typeof text === "string") {
      return text.trim();
    }
  }
  return "";
}

async function getPushTokens(): Promise<string[]> {
  const snapshot = await getDatabase().ref("pushTokens").get();
  const raw = snapshot.val();
  if (!raw || typeof raw !== "object") {
    return [];
  }
  return Object.values(raw as Record<string, unknown>)
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return "";
      const token = (item as Record<string, unknown>).token;
      return typeof token === "string" ? token : "";
    })
    .filter((token) => token.length > 0);
}

async function removeTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;

  const updates: Record<string, null> = {};
  for (const token of tokens) {
    updates[`pushTokens/${encodeURIComponent(token)}`] = null;
  }
  await getDatabase().ref().update(updates);
}

function basePayload(roomId: string, eventType: string, title: string, body = "\u200B"): PushPayload {
  return {
    notification: { title, body },
    webpush: {
      headers: {
        Urgency: "high",
        TTL: "2419200",
      },
      fcmOptions: { link: "/" },
      notification: {
        icon: "/web-app-manifest-192x192.png",
        badge: "/web-app-manifest-192x192.png",
      },
    },
    data: {
      roomId,
      path: "/",
      eventType,
    },
  };
}

function buildNotificationPayloads(roomId: string, before: RoomRecord, after: RoomRecord): PushPayload[] {
  const beforeLock = toNumber(before.state);
  const afterLock = toNumber(after.state);
  const beforeLight = toNumber(before.lightState);
  const afterLight = toNumber(after.lightState);
  const payloads: PushPayload[] = [];

  if (beforeLock !== null && afterLock !== null && beforeLock !== afterLock) {
    const title =
      afterLock === 1
        ? `${roomId}号室が施錠されました🔐`
        : `${roomId}号室が解錠されました🔓`;
    payloads.push(basePayload(roomId, "lock", title));
  }

  if (beforeLight !== null && afterLight !== null && beforeLight !== afterLight) {
    const title =
      afterLight === 1
        ? `${roomId}号室の照明が点灯しました💡`
        : `${roomId}号室の照明が消灯しました🌃`;
    payloads.push(basePayload(roomId, "light", title));
  }

  for (const key of COMMENT_KEYS) {
    const prev = commentText(before[key]);
    const next = commentText(after[key]);
    if (prev !== next && next.length > 0) {
      payloads.push(
        basePayload(roomId, "comment", `${roomId}号室にコメントが追加されました`, next),
      );
    }
  }

  return payloads;
}

function invalidTokensFromResponse(
  tokens: string[],
  response: BatchResponse,
): string[] {
  const invalid: string[] = [];
  response.responses.forEach((r, index) => {
    if (!r.success) {
      const code = r.error?.code ?? "";
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        invalid.push(tokens[index]);
      }
    }
  });
  return invalid;
}

async function sendNotifications(tokens: string[], payloads: PushPayload[], roomId: string) {
  const invalidTokens = new Set<string>();
  let successCount = 0;
  let failureCount = 0;

  for (const payload of payloads) {
    const response = await getMessaging().sendEachForMulticast({
      tokens,
      ...payload,
    });
    successCount += response.successCount;
    failureCount += response.failureCount;

    for (const token of invalidTokensFromResponse(tokens, response)) {
      invalidTokens.add(token);
    }
  }

  if (invalidTokens.size > 0) {
    await removeTokens([...invalidTokens]);
    logger.info("Removed invalid push tokens", { count: invalidTokens.size });
  }

  logger.info("Push notification sent", {
    roomId,
    eventCount: payloads.length,
    successCount,
    failureCount,
  });
}

export const notifyRoomUpdates = onValueUpdated(
  {
    ref: "/room/{roomId}",
    region: "asia-southeast1",
  },
  async (event) => {
    const roomId = event.params.roomId as string;
    const before = asRoomRecord(event.data.before.val());
    const after = asRoomRecord(event.data.after.val());

    const payloads = buildNotificationPayloads(roomId, before, after);
    if (payloads.length === 0) {
      return;
    }

    const tokens = await getPushTokens();
    if (tokens.length === 0) {
      logger.info("No push tokens to notify", { roomId });
      return;
    }

    await sendNotifications(tokens, payloads, roomId);
  },
);
