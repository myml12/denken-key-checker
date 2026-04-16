import { initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getDatabase } from "firebase-admin/database";
import { onValueUpdated } from "firebase-functions/v2/database";
import { logger } from "firebase-functions";

initializeApp();

type RoomRecord = Record<string, unknown>;

const COMMENT_KEYS = ["comment1", "comment2", "comment3"] as const;

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

function changedComments(before: RoomRecord, after: RoomRecord): string[] {
  const changed: string[] = [];
  for (const key of COMMENT_KEYS) {
    const prev = commentText(before[key]);
    const next = commentText(after[key]);
    if (prev !== next) {
      changed.push(key);
    }
  }
  return changed;
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
    updates[`pushTokens/${token}`] = null;
  }
  await getDatabase().ref().update(updates);
}

function buildNotificationPayload(roomId: string, before: RoomRecord, after: RoomRecord) {
  const beforeLock = toNumber(before.state);
  const afterLock = toNumber(after.state);
  const beforeLight = toNumber(before.lightState);
  const afterLight = toNumber(after.lightState);
  const commentDiffs = changedComments(before, after);

  const events: string[] = [];
  if (beforeLock !== null && afterLock !== null && beforeLock !== afterLock) {
    events.push(afterLock === 0 ? "鍵が施錠されました" : "鍵が解錠されました");
  }
  if (beforeLight !== null && afterLight !== null && beforeLight !== afterLight) {
    events.push(afterLight === 0 ? "照明が点灯しました" : "照明が消灯しました");
  }
  if (commentDiffs.length > 0) {
    events.push(`コメントが更新されました (${commentDiffs.length}件)`);
  }

  if (events.length === 0) return null;

  return {
    notification: {
      title: `部屋 ${roomId} の状態が更新されました`,
      body: events.join(" / "),
    },
    webpush: {
      fcmOptions: {
        link: "/",
      },
      notification: {
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
      },
    },
    data: {
      roomId,
      path: "/",
      events: events.join(","),
    },
  };
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

    const payload = buildNotificationPayload(roomId, before, after);
    if (!payload) {
      return;
    }

    const tokens = await getPushTokens();
    if (tokens.length === 0) {
      logger.info("No push tokens to notify", { roomId });
      return;
    }

    const response = await getMessaging().sendEachForMulticast({
      tokens,
      ...payload,
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((r, index) => {
      if (!r.success) {
        const code = r.error?.code ?? "";
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await removeTokens(invalidTokens);
      logger.info("Removed invalid push tokens", { count: invalidTokens.length });
    }

    logger.info("Push notification sent", {
      roomId,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  },
);
