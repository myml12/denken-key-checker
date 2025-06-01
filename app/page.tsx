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
        fontSize: '2.3rem',
        fontWeight: '900',
        marginBottom: '1rem',
        color: '#bb86fc',
        letterSpacing: 1,
      }}>
       denken key checker 🔑
      </h1>
      <p style={{ marginBottom: '2rem', color: '#aaa', fontSize: '1rem' }}>
        部室の鍵の開閉状況をリアルタイムで確認できます
      </p>

      <div>
        <RoomStatus roomName="1047" />
        <RoomStatus roomName="1202" />
      </div>
    </main>
  );
}
