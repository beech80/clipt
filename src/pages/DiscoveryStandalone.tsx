import * as React from 'react';

/**
 * A standalone Discovery component that doesn't rely on AuthContext or other providers
 * This helps bypass React hook initialization issues
 */
class DiscoveryStandalone extends React.Component {
  render() {
    return (
      <div className="container mx-auto p-4 min-h-screen" style={{color: 'white'}}>
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold mb-6">Discovery</h1>
          
          <div className="flex justify-center gap-4 mb-8">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition">
              Games
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
              Streamers
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
              Trending
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-800 p-6 rounded-xl">
                <div className="aspect-video bg-gray-700 rounded-lg mb-4"></div>
                <h3 className="text-xl font-semibold mb-2">Featured Game {i}</h3>
                <p className="text-gray-400">Click to explore this game and see top streamers</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

export default DiscoveryStandalone;
