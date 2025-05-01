import * as React from 'react';

/**
 * Ultra-basic Discovery component with no hooks or dependencies
 * to fix the React initialization issue
 */
class DiscoveryUltraBasic extends React.Component {
  render() {
    return (
      <div className="discovery-ultra-basic" style={{ 
        padding: '20px',
        maxWidth: '800px', 
        margin: '0 auto',
        color: 'white'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
          Discovery
        </h1>
        
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <button style={{
            padding: '8px 16px',
            background: '#222',
            color: 'white',
            border: '1px solid #444',
            borderRadius: '4px'
          }}>
            Games
          </button>
          <button style={{
            padding: '8px 16px',
            background: '#222',
            color: 'white',
            border: '1px solid #444',
            borderRadius: '4px'
          }}>
            Streamers
          </button>
          <button style={{
            padding: '8px 16px',
            background: '#222',
            color: 'white',
            border: '1px solid #444',
            borderRadius: '4px'
          }}>
            Trending
          </button>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px'
        }}>
          {[1, 2, 3, 4].map(item => (
            <div key={item} style={{
              background: '#222',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #444'
            }}>
              <h3 style={{ marginBottom: '8px' }}>Game Title {item}</h3>
              <p style={{ color: '#aaa', fontSize: '14px' }}>
                This is a placeholder for game content
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default DiscoveryUltraBasic;
