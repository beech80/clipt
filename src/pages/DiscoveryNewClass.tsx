import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/discovery-retro.css';

// Define types for component state
interface DiscoveryState {
  activeTab: 'games' | 'streamers' | 'trending';
  searchQuery: string;
  isSearchOpen: boolean;
  games: any[];
  streamers: any[];
  loading: boolean;
}

// Class-based component that doesn't rely on useState hooks
class DiscoveryNewClass extends React.Component<{}, DiscoveryState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      activeTab: 'games',
      searchQuery: '',
      isSearchOpen: false,
      games: [],
      streamers: [],
      loading: false
    };
  }

  componentDidMount() {
    console.log('DiscoveryNewClass mounted');
    // Any initialization logic would go here
  }

  setActiveTab = (tab) => {
    this.setState({ activeTab: tab });
  };

  toggleSearch = () => {
    this.setState(prevState => ({ isSearchOpen: !prevState.isSearchOpen }));
  };

  handleSearchChange = (e) => {
    this.setState({ searchQuery: e.target.value });
  };

  render() {
    const { activeTab, isSearchOpen, searchQuery } = this.state;

    return (
      <div className="discovery-page">
        <div className="discovery-container">
          <header className="discovery-header">
            <h1>Discovery</h1>
            <div className="search-toggle">
              <button onClick={this.toggleSearch}>
                {isSearchOpen ? 'Close Search' : 'Search'}
              </button>
            </div>
          </header>

          {isSearchOpen && (
            <div className="search-container">
              <input
                type="text"
                value={searchQuery}
                onChange={this.handleSearchChange}
                placeholder="Search games, streamers, or clips..."
                className="search-input"
              />
            </div>
          )}

          <div className="tabs-container">
            <div className="tabs">
              <button 
                className={activeTab === 'games' ? 'active' : ''} 
                onClick={() => this.setActiveTab('games')}
              >
                Games
              </button>
              <button 
                className={activeTab === 'streamers' ? 'active' : ''} 
                onClick={() => this.setActiveTab('streamers')}
              >
                Streamers
              </button>
              <button 
                className={activeTab === 'trending' ? 'active' : ''} 
                onClick={() => this.setActiveTab('trending')}
              >
                Trending
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'games' && (
                <div className="games-grid">
                  <div className="game-card">
                    <Link to="/games/1">
                      <h3>Fortnite</h3>
                      <p>Battle Royale</p>
                    </Link>
                  </div>
                  <div className="game-card">
                    <Link to="/games/2">
                      <h3>Call of Duty</h3>
                      <p>FPS</p>
                    </Link>
                  </div>
                  <div className="game-card">
                    <Link to="/games/3">
                      <h3>Minecraft</h3>
                      <p>Sandbox</p>
                    </Link>
                  </div>
                  <div className="game-card">
                    <Link to="/games/4">
                      <h3>League of Legends</h3>
                      <p>MOBA</p>
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === 'streamers' && (
                <div className="streamers-list">
                  <div className="streamer-card">
                    <Link to="/profile/1">
                      <h3>Ninja</h3>
                      <p>Currently Live: Fortnite</p>
                    </Link>
                  </div>
                  <div className="streamer-card">
                    <Link to="/profile/2">
                      <h3>Pokimane</h3>
                      <p>Offline</p>
                    </Link>
                  </div>
                  <div className="streamer-card">
                    <Link to="/profile/3">
                      <h3>Shroud</h3>
                      <p>Currently Live: Valorant</p>
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === 'trending' && (
                <div className="trending-content">
                  <div className="trending-item">
                    <h3>Amazing Play!</h3>
                    <p>Check out this incredible play from the tournament finals</p>
                  </div>
                  <div className="trending-item">
                    <h3>New Game Announcement</h3>
                    <p>The sequel to the popular game has been announced</p>
                  </div>
                  <div className="trending-item">
                    <h3>Event Highlights</h3>
                    <p>The best moments from yesterday's gaming event</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default DiscoveryNewClass;
