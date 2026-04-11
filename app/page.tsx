'use client'
import RoomStatus from "@/components/RoomStatus";
import SensorStatus from "@/components/SensorStatus";
import FirebaseAuthProvider from "@/components/FirebaseAuthProvider";

export default function HomePage() {
  return (
    <FirebaseAuthProvider>
      <main style={{
        minHeight: '100vh',
        backgroundColor: '#121212',
        color: '#ddd',
        padding: '2rem',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '900',
          marginBottom: '1rem',
          color: '#00a7db',
        }}>
          denken Monitor
        </h1>
        <p style={{ marginBottom: '2rem', color: '#ddd', fontSize: '1rem' }}>
          部室の鍵と照明、環境センサーのデータを確認できます
        </p>

        <div>
          <h2 style={campusHeadingStyle}>後楽園キャンパス</h2>
          <RoomStatus roomName="1047" />
          <SensorStatus roomName="1047" />
          <RoomStatus roomName="6433" />
          <h2 style={{ ...campusHeadingStyle, marginTop: '2.25rem' }}>多摩キャンパス</h2>
          <RoomStatus roomName="4521" />
          <p style={{ marginTop: '2rem', color: '#777', fontSize: '0.9rem' }}>
            不具合は水野または浅海まで
          </p>
        </div>
      </main>
    </FirebaseAuthProvider>
  );
}

const campusHeadingStyle = {
  fontSize: '1.05rem',
  fontWeight: 600 as const,
  color: '#888',
  marginBottom: '0.35rem',
  marginTop: 0,
  letterSpacing: '0.02em',
};
