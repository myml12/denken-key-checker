import { initializeApp } from "firebase-admin/app";
import { getMessaging, type BatchResponse } from "firebase-admin/messaging";
import { getDatabase } from "firebase-admin/database";
import { onValueUpdated } from "firebase-functions/v2/database";
import { logger } from "firebase-functions";

initializeApp();

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

async function notify(roomId: string, payload: PushPayload): Promise<void> {
  const tokens = await getPushTokens();
  if (tokens.length === 0) {
    logger.info("No push tokens to notify", { roomId });
    return;
  }
  await sendNotifications(tokens, [payload], roomId);
}

export const notifyRoomLockUpdated = onValueUpdated(
  {
    ref: "/room/{roomId}/state",
    region: "asia-southeast1",
  },
  async (event) => {
    const roomId = event.params.roomId as string;
    const before = toNumber(event.data.before.val());
    const after = toNumber(event.data.after.val());
    if (before === null || after === null || before === after) {
      return;
    }

    const title =
      after === 1
        ? `${roomId}号室が施錠されました🔐`
        : `${roomId}号室が解錠されました🔓`;
    await notify(roomId, basePayload(roomId, "lock", title));
  },
);

export const notifyRoomLightUpdated = onValueUpdated(
  {
    ref: "/room/{roomId}/lightState",
    region: "asia-southeast1",
  },
  async (event) => {
    const roomId = event.params.roomId as string;
    const before = toNumber(event.data.before.val());
    const after = toNumber(event.data.after.val());
    if (before === null || after === null || before === after) {
      return;
    }

    const title =
      after === 1
        ? `${roomId}号室の照明が点灯しました💡`
        : `${roomId}号室の照明が消灯しました🌃`;
    await notify(roomId, basePayload(roomId, "light", title));
  },
);

function makeCommentNotifier(commentKey: (typeof COMMENT_KEYS)[number]) {
  return onValueUpdated(
    {
      ref: `/room/{roomId}/${commentKey}`,
      region: "asia-southeast1",
    },
    async (event) => {
      const roomId = event.params.roomId as string;
      const prev = commentText(event.data.before.val());
      const next = commentText(event.data.after.val());
      if (prev === next || next.length === 0) {
        return;
      }

      await notify(
        roomId,
        basePayload(roomId, "comment", `${roomId}号室にコメントが追加されました`, next),
      );
    },
  );
}

export const notifyRoomComment1Updated = makeCommentNotifier("comment1");
export const notifyRoomComment2Updated = makeCommentNotifier("comment2");
export const notifyRoomComment3Updated = makeCommentNotifier("comment3");
