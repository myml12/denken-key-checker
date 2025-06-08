import RoomStatus from "@/components/RoomStatus";

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
        部室の鍵と照明の状態を確認できます
      </p>

      <div>
        <RoomStatus roomName="1047" />
        <RoomStatus roomName="1202" />
        1202の照明センサーはダミーデータであり、現在準備中です（近日設置予定）
      </div>
      <div>
        Webアプリと鍵センサーの不具合は水野まで、照明センサーの不具合は浅海まで
      </div>
    </main>
  );
}
