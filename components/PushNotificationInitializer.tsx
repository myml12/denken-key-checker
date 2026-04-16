'use client';

import { useEffect, useState } from 'react';
import { initializePushNotifications } from '@/lib/push';

export default function PushNotificationInitializer() {
  const [message, setMessage] = useState('');
  const [showEnable, setShowEnable] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await initializePushNotifications();
      setMessage(result.message);
      setShowEnable(result.status === 'needs_user_action');
    })().catch((error) => {
      console.error('Push初期化エラー:', error);
      setMessage('通知の初期化に失敗しました。時間を置いて再試行してください。');
      setShowEnable(false);
    });
  }, []);

  const handleEnable = async () => {
    const result = await initializePushNotifications({ requireUserGesture: true });
    setMessage(result.message);
    setShowEnable(result.status === 'needs_user_action');
  };

  if (!message) return null;

  return (
    <div className="dm-pushNotice" role="status">
      <p className="dm-pushNoticeText">{message}</p>
      {showEnable ? (
        <button type="button" className="dm-btn dm-btn--ok dm-pushNoticeBtn" onClick={handleEnable}>
          通知を有効化
        </button>
      ) : null}
    </div>
  );
}
