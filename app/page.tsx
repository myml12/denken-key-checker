'use client'
import RoomStatus from "@/components/RoomStatus";
import SensorStatus from "@/components/SensorStatus";

export default function HomePage() {
  return (
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
        <RoomStatus roomName="1047" />
        <SensorStatus roomName="1047" />
        <RoomStatus roomName="6433" />
        <p style={{ marginTop: '2rem', color: '#777', fontSize: '0.9rem' }}>
          不具合は水野または浅海まで
        </p>
      </div>
    </main>
  );
}
