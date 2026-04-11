'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../lib/firebase';

interface RoomStatusProps {
  roomName: string;
}

interface DialogState {
  show: boolean;
  type: 'lock' | 'light' | null;
  newState: string;
}

const MANUAL_EDIT_ROOMS = new Set(['6433', '4521']);

export default function RoomStatus({ roomName }: RoomStatusProps) {
  const [state, setState] = useState<boolean | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [lightState, setLightState] = useState<boolean | null>(null);
  const [lookedAt, setLookedAt] = useState<number | null>(null);
  const [dialog, setDialog] = useState<DialogState>({
    show: false,
    type: null,
    newState: '',
  });
  const [rawData, setRawData] = useState<Record<string, unknown> | null>(null);

  const isEditable = MANUAL_EDIT_ROOMS.has(roomName);

  useEffect(() => {
    const roomRef = ref(database, `room/${roomName}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRawData(data);
        setState(data.state === 0);
        setTimestamp(data.timestamp);
        setLightState(data.lightState === 0);
        setLookedAt(data.lookedAt);
      }
    });
    return () => unsubscribe();
  }, [roomName]);

  const formatTime = (ts: number | null) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString();
  };

  const handleToggle = (type: 'lock' | 'light') => {
    if (!isEditable || !rawData) return;

    if (type === 'lock') {
      const newLockState = rawData.state === 0 ? '施錠中' : '解錠中';
      setDialog({ show: true, type: 'lock', newState: newLockState });
    } else {
      const newLightState = rawData.lightState === 0 ? '点灯中' : '消灯中';
      setDialog({ show: true, type: 'light', newState: newLightState });
    }
  };

  const handleConfirm = () => {
    if (!rawData || !dialog.type) {
      setDialog({ show: false, type: null, newState: '' });
      return;
    }

    const dialogType = dialog.type;
    const currentRawData = { ...rawData };
    setDialog({ show: false, type: null, newState: '' });

    (async () => {
      const roomRef = ref(database, `room/${roomName}`);
      const updates: Record<string, unknown> = { ...currentRawData };

      if (dialogType === 'lock') {
        updates.state = currentRawData.state === 0 ? 1 : 0;
        updates.timestamp = Date.now();
      } else {
        updates.lightState = currentRawData.lightState === 0 ? 1 : 0;
        updates.lookedAt = Date.now();
      }

      try {
        await set(roomRef, updates);
      } catch (error) {
        console.error('更新エラー:', error);
        alert('更新に失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
      }
    })();
  };

  const handleCancel = () => {
    setDialog({ show: false, type: null, newState: '' });
  };

  const lockClass =
    state === null
      ? 'dm-stateLine--muted'
      : state
        ? 'dm-stateLine--ok'
        : 'dm-stateLine--alert';

  const lightClass =
    lightState === null
      ? 'dm-stateLine--muted'
      : lightState
        ? 'dm-stateLine--alert'
        : 'dm-stateLine--ok';

  return (
    <>
      <div className="dm-card">
        <h2 className="dm-cardTitle">
          {roomName}
          {isEditable ? <span className="dm-cardTitleSuffix">（手動）</span> : null}
        </h2>
        <p
          className={`dm-stateLine ${lockClass}${isEditable ? ' dm-stateLine--clickable' : ''}`}
          onClick={() => isEditable && state !== null && handleToggle('lock')}
        >
          {state === null
            ? '読み込み中...'
            : state
              ? '🔓 解錠中 OPEN'
              : '🔐 施錠中 CLOSE'}
        </p>
        <p
          className={`dm-stateLine ${lightClass}${isEditable ? ' dm-stateLine--clickable' : ''}`}
          onClick={() => isEditable && lightState !== null && handleToggle('light')}
        >
          {lightState === null
            ? '読み込み中...'
            : lightState
              ? '🌃 消灯中 OFF'
              : '💡 点灯中 ON'}
        </p>
        <p className="dm-ts">Key checked at {formatTime(timestamp)}</p>
        <p className="dm-ts">Light checked at {formatTime(lookedAt)}</p>
      </div>

      {dialog.show ? (
        <div className="dm-dialogOverlay" onClick={handleCancel} role="presentation">
          <div className="dm-dialog" onClick={(e) => e.stopPropagation()} role="dialog">
            <h3 className="dm-dialogTitle">{dialog.newState}に変更しますか？</h3>
            <div className="dm-dialogActions">
              <button type="button" className="dm-btn dm-btn--cancel" onClick={handleCancel}>
                キャンセル
              </button>
              <button type="button" className="dm-btn dm-btn--ok" onClick={handleConfirm}>
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
