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
         Webアプリと鍵センサー/照明センサー(1202)の不具合は水野まで、照明センサー(1047)の不具合は浅海まで
      </div>
    </main>
  );
}
