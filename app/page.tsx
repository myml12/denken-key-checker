'use client';

import RoomStatus from '@/components/RoomStatus';
import SensorStatus from '@/components/SensorStatus';
import FirebaseAuthProvider from '@/components/FirebaseAuthProvider';
import PushNotificationInitializer from '@/components/PushNotificationInitializer';

export default function HomePage() {
  return (
    <FirebaseAuthProvider>
      <PushNotificationInitializer />
      <main className="dm-main">
        <h1 className="dm-h1">denken Monitor</h1>
        <p className="dm-lede">部室の鍵と照明、環境センサーのデータを確認できます</p>

        <div>
          <RoomStatus roomName="1047" />
          <SensorStatus roomName="1047" />
          <RoomStatus roomName="6433" />
          <RoomStatus roomName="4521" />
          <p className="dm-footerNote">不具合の報告は水野/浅海まで</p>
        </div>
      </main>
    </FirebaseAuthProvider>
  );
}
