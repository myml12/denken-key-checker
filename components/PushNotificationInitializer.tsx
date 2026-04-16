'use client';

import { useEffect, useState } from 'react';
import { initializePushNotifications } from '@/lib/push';

export default function PushNotificationInitializer() {
  const [statusText, setStatusText] = useState('確認中');
  const [showEnable, setShowEnable] = useState(false);

  const toStatusText = (status: string): string => {
    switch (status) {
      case 'enabled':
        return '有効';
      case 'blocked':
        return 'ブロック中';
      case 'needs_home_screen':
        return 'ホーム画面追加が必要';
      case 'needs_user_action':
        return '未許可';
      case 'unsupported':
        return '非対応';
      default:
        return 'エラー';
    }
  };

  useEffect(() => {
    (async () => {
      const result = await initializePushNotifications();
      setStatusText(toStatusText(result.status));
      setShowEnable(result.status === 'needs_user_action');
    })().catch((error) => {
      console.error('Push初期化エラー:', error);
      setStatusText('エラー');
      setShowEnable(false);
    });
  }, []);

  const handleEnable = async () => {
    const result = await initializePushNotifications({ requireUserGesture: true });
    setStatusText(toStatusText(result.status));
    setShowEnable(result.status === 'needs_user_action');
  };

  return (
    <div className="dm-pushNotice" role="status">
      <p className="dm-pushNoticeText">通知状態: {statusText}</p>
      {showEnable ? (
        <button type="button" className="dm-pushNoticeBtn" onClick={handleEnable}>
          有効化
        </button>
      ) : null}
    </div>
  );
}
