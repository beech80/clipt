/**
 * The most minimal possible Discovery component
 * No TypeScript, no hooks, no imports, just plain React
 */
function DiscoveryMinimal() {
  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      color: 'white',
      minHeight: '100vh'
    }}>
      <h1 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
        Discovery
      </h1>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
        <button style={{
          background: '#7c3aed',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          Games
        </button>
        <button style={{
          background: '#374151',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          Streamers
        </button>
        <button style={{
          background: '#374151',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          Trending
        </button>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{
            background: '#1f2937',
            borderRadius: '12px',
            padding: '16px',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}>
            <div style={{
              background: '#111827',
              borderRadius: '8px',
              height: '160px',
              marginBottom: '12px'
            }} />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Featured Game {i}
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              A popular game with many active streamers
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Using module.exports for maximum compatibility
module.exports = DiscoveryMinimal;
