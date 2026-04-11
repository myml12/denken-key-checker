'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../lib/firebase';

const COMMENT_KEYS = ['comment1', 'comment2', 'comment3'] as const;
const MAX_LEN = 200;

type CommentKey = (typeof COMMENT_KEYS)[number];

type ParsedComment = { key: CommentKey; text: string; at: number | null };

function formatCommentAt(ts: number): string {
  const d = new Date(ts);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${day} ${h}:${min}`;
}

/** 文字列（従来）または { text, at } に対応 */
function parseSlot(v: unknown): { text: string; at: number | null } | null {
  if (typeof v === 'string') {
    const t = v.trim();
    return t ? { text: t, at: null } : null;
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const text = o.text;
    const at = o.at;
    if (typeof text === 'string' && text.trim()) {
      return {
        text: text.trim(),
        at: typeof at === 'number' && Number.isFinite(at) ? at : null,
      };
    }
  }
  return null;
}

function slotIsEmpty(v: unknown): boolean {
  return parseSlot(v) === null;
}

function nonEmptyComments(data: Record<string, unknown> | null): ParsedComment[] {
  if (!data) return [];
  const out: ParsedComment[] = [];
  for (const k of COMMENT_KEYS) {
    const parsed = parseSlot(data[k]);
    if (parsed) {
      out.push({ key: k, text: parsed.text, at: parsed.at });
    }
  }
  return out;
}

function firstEmptyKey(data: Record<string, unknown> | null): CommentKey | null {
  for (const k of COMMENT_KEYS) {
    if (slotIsEmpty(data?.[k])) return k;
  }
  return null;
}

export default function RoomComments({ roomName }: { roomName: string }) {
  const [roomData, setRoomData] = useState<Record<string, unknown> | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const roomRef = ref(database, `room/${roomName}`);
    return onValue(roomRef, (snap) => {
      setLoaded(true);
      setRoomData(snap.val() ?? null);
    });
  }, [roomName]);

  const comments = nonEmptyComments(roomData);
  const hasEmptySlot = firstEmptyKey(roomData) !== null;

  const add = async () => {
    const slot = firstEmptyKey(roomData);
    const text = draft.slice(0, MAX_LEN).trim();
    if (!slot || !text) return;
    setBusy(true);
    try {
      await update(ref(database, `room/${roomName}`), {
        [slot]: { text, at: Date.now() },
      });
      setDraft('');
      setOpen(false);
    } catch (e) {
      console.error(e);
      alert('コメントの追加に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (key: CommentKey) => {
    setBusy(true);
    try {
      await update(ref(database, `room/${roomName}`), { [key]: null });
    } catch (e) {
      console.error(e);
      alert('削除に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) {
    return (
      <div className="dm-comments">
        <p className="dm-commentsMuted">コメント読み込み中…</p>
      </div>
    );
  }

  return (
    <div className="dm-comments">
      <div className="dm-commentsHead">
        <span className="dm-commentsLabel">コメント</span>
        <button
          type="button"
          className="dm-commentsEditBtn"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? '閉じる' : 'コメントを書く'}
        </button>
      </div>

      {!open ? (
        comments.length > 0 ? (
          <ul className="dm-commentsPreview">
            {comments.map(({ key, text, at }) => (
              <li key={key}>
                {at != null ? (
                  <span className="dm-commentsTime">{formatCommentAt(at)}</span>
                ) : null}
                {text}
              </li>
            ))}
          </ul>
        ) : null
      ) : (
        <>
          {comments.length > 0 ? (
            <ul className="dm-commentsList">
              {comments.map(({ key, text, at }) => (
                <li key={key} className="dm-commentsItem">
                  <div className="dm-commentsItemMain">
                    {at != null ? (
                      <span className="dm-commentsTime">{formatCommentAt(at)}</span>
                    ) : null}
                    <span className="dm-commentsText">{text}</span>
                  </div>
                  <button
                    type="button"
                    className="dm-commentsDel"
                    onClick={() => remove(key)}
                    disabled={busy}
                  >
                    削除する
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {hasEmptySlot ? (
            <div className="dm-commentsForm">
              <input
                type="text"
                className="dm-commentsInput"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={MAX_LEN}
                placeholder={`メッセージ（最大${MAX_LEN}字）`}
                disabled={busy}
                aria-label="コメント入力"
              />
              <button
                type="button"
                className="dm-commentsAdd"
                onClick={add}
                disabled={busy || draft.trim() === ''}
              >
                追加
              </button>
            </div>
          ) : (
            <p className="dm-commentsMuted">コメントは最大3件です</p>
          )}
        </>
      )}
    </div>
  );
}
