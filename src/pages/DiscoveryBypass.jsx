// DiscoveryBypass.jsx - A component that completely bypasses the AuthProvider
import React from 'react';

class DiscoveryBypass extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'games',
      searchOpen: false
    };
  }
  
  render() {
    const { activeTab, searchOpen } = this.state;
    
    return (
      <div className="discovery-bypass" style={{
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        color: 'white',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          fontSize: '28px', 
          fontWeight: 'bold', 
          marginBottom: '24px',
          background: 'linear-gradient(90deg, #7c3aed, #db2777)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          padding: '10px'
        }}>
          CLIPT Discovery
        </h1>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '12px', 
          marginBottom: '32px',
          position: 'relative'
        }}>
          <button onClick={() => this.setState({ activeTab: 'games' })} style={{
            background: activeTab === 'games' ? '#7c3aed' : '#1f2937',
            color: 'white',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'games' ? '0 0 15px rgba(124, 58, 237, 0.5)' : 'none'
          }}>
            Games
          </button>
          <button onClick={() => this.setState({ activeTab: 'streamers' })} style={{
            background: activeTab === 'streamers' ? '#7c3aed' : '#1f2937',
            color: 'white',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'streamers' ? '0 0 15px rgba(124, 58, 237, 0.5)' : 'none'
          }}>
            Streamers
          </button>
          <button onClick={() => this.setState({ activeTab: 'trending' })} style={{
            background: activeTab === 'trending' ? '#7c3aed' : '#1f2937',
            color: 'white',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'trending' ? '0 0 15px rgba(124, 58, 237, 0.5)' : 'none'
          }}>
            Trending
          </button>
          
          <button onClick={() => this.setState({ searchOpen: !searchOpen })} style={{
            position: 'absolute',
            right: '10px',
            background: '#1f2937',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            {searchOpen ? 'Close' : 'Search'}
          </button>
        </div>
        
        {searchOpen && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            background: '#1f2937',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}>
            <input type="text" placeholder="Search games, streamers, or clips..." style={{
              width: '100%',
              padding: '10px 15px',
              borderRadius: '8px',
              background: '#374151',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              outline: 'none'
            }} />
            <div style={{ marginTop: '15px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
              Try searching for your favorite games or streamers
            </div>
          </div>
        )}
        
        {activeTab === 'games' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {['Fortnite', 'Call of Duty', 'Minecraft', 'League of Legends', 'Valorant', 'GTA V'].map((game, index) => (
              <div key={index} style={{
                background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                borderRadius: '12px',
                padding: '16px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                border: '1px solid #374151',
                overflow: 'hidden',
                position: 'relative',
                zIndex: '1'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  background: index % 2 === 0 ? '#7c3aed20' : '#db277720',
                  borderRadius: '8px',
                  height: '140px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '14px',
                  border: `1px solid ${index % 2 === 0 ? '#7c3aed40' : '#db277740'}`
                }}>
                  Game Cover
                </div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  marginBottom: '6px',
                  color: 'white'
                }}>
                  {game}
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '10px' }}>
                  {index * 125 + 350}K active players
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '10px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#d1d5db',
                    background: '#374151',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}>
                    {index + 5} live streams
                  </span>
                  <button style={{
                    background: 'none',
                    border: '1px solid #7c3aed',
                    borderRadius: '4px',
                    padding: '4px 12px',
                    color: '#7c3aed',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>View</button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'streamers' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {['Ninja', 'Pokimane', 'Shroud', 'TimTheTatman', 'DrLupo', 'Valkyrae'].map((streamer, index) => (
              <div key={index} style={{
                display: 'flex',
                padding: '15px',
                background: '#1f2937',
                borderRadius: '12px',
                alignItems: 'center',
                gap: '15px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                border: '1px solid #374151'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.background = '#293548';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1f2937';
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '20px',
                  color: '#e5e7eb',
                  border: '2px solid #7c3aed'
                }}>
                  {streamer[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{streamer}</h3>
                    {index % 2 === 0 && (
                      <span style={{
                        background: '#ef4444',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>LIVE</span>
                    )}
                  </div>
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                    {index % 2 === 0 ? 
                      `Currently streaming ${['Fortnite', 'Call of Duty', 'Valorant'][index % 3]}` : 
                      'Offline'}
                  </p>
                </div>
                <button style={{
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}>
                  View
                </button>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'trending' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {[
              'Amazing Fortnite trick shot compilation',
              'How I reached Challenger in 30 days',
              'This Valorant strategy is breaking the meta',
              'Minecraft build that took 2 years to complete',
              'Unexpected ending to championship match'
            ].map((title, index) => (
              <div key={index} style={{
                background: '#1f2937',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #374151'
              }}>
                <div style={{
                  height: '200px',
                  background: `linear-gradient(45deg, #1f2937 0%, #111827 100%)`,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '14px'
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    12:34
                  </div>
                  Trending Clip Preview
                </div>
                <div style={{ padding: '15px' }}>
                  <h3 style={{ 
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '10px'
                  }}>{title}</h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: '#374151',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span style={{ fontSize: '14px' }}>
                      {['ProGamer', 'GamingWizard', 'StreamKing', 'GameMaster', 'CliptChamp'][index]}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #374151',
                    paddingTop: '15px'
                  }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', color: '#9ca3af' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        {index * 125 + 789}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', color: '#9ca3af' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                        {index * 13 + 42}
                      </span>
                    </div>
                    <button style={{
                      background: 'none',
                      border: '1px solid #7c3aed',
                      borderRadius: '4px',
                      padding: '4px 12px',
                      color: '#7c3aed',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}>Watch</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default DiscoveryBypass;
