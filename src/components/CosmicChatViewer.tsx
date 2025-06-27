import React from 'react';
import { MessageCircle, Eye, Server, Star, Settings, ChevronLeft, GiftIcon } from "lucide-react";

// Cosmic Chat Viewer Component
const CosmicChatViewer: React.FC = () => {
  return (
    <div className="w-full mb-8 mt-4">
      <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: '#FFAA00' }}>Space-Themed Chat Viewer</h2>
      
      <div className="rounded-2xl shadow-[0_0_35px_rgba(138,43,226,0.3)]" 
        style={{ 
          background: 'radial-gradient(circle at center, rgba(25, 25, 40, 0.9) 0%, rgba(10, 10, 20, 0.95) 70%, rgba(5, 5, 15, 0.98) 100%)', 
          boxShadow: '0 0 40px rgba(138, 43, 226, 0.4), inset 0 0 20px rgba(88, 28, 135, 0.3)', 
          borderImage: 'linear-gradient(135deg, rgba(125, 39, 255, 0.8), rgba(65, 20, 138, 0.2), rgba(125, 39, 255, 0.8)) 1', 
          borderWidth: '1px', 
          borderStyle: 'solid',
          height: '480px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Animated star background */}
        <div className="absolute inset-0 overflow-hidden">
          {Array(100).fill(0).map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full animate-twinkle"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                backgroundColor: `rgba(255, 255, 255, ${Math.random() * 0.7 + 0.3})`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}
        </div>

        {/* Nebula overlay */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 30% 70%, rgba(161, 102, 255, 0.15), transparent 40%), radial-gradient(circle at 70% 30%, rgba(80, 200, 255, 0.15), transparent 40%)',
          pointerEvents: 'none',
        }}></div>

        {/* Modal content */}
        <div className="relative z-10 p-6 h-full flex flex-col">
          {/* Header with live indicators */}
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-purple-900/30">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
              <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">LIVE</span>
            </div>
            
            <div className="text-white font-semibold px-3 py-1 rounded-full bg-purple-900/50 backdrop-blur-sm flex items-center space-x-2 text-sm">
              <Eye className="h-3 w-3 text-purple-400" />
              <span>2.4k Viewers</span>
            </div>

            <div className="flex space-x-2">
              <button className="h-8 w-8 rounded-full bg-purple-900/50 backdrop-blur-sm flex items-center justify-center text-purple-400 hover:text-white hover:bg-purple-800 transition-colors">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* System Performance */}
          <div className="mb-4 bg-black/30 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-xs uppercase tracking-wider text-purple-300 mb-2 flex items-center">
              <Server className="h-3 w-3 mr-1" /> System Telemetry
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-gray-400 mb-1">Server Load</div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-green-300 w-1/3 animate-pulse" style={{ animationDuration: '3s' }}></div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Stream Health</div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-300 w-4/5 animate-pulse" style={{ animationDuration: '4s' }}></div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Latency</div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 w-1/5 animate-pulse" style={{ animationDuration: '2.5s' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Comments */}
          <div className="flex-1 overflow-auto mb-3">
            <div className="text-xs uppercase tracking-wider text-purple-300 mb-2 flex items-center">
              <MessageCircle className="h-3 w-3 mr-1" /> Top Comments
            </div>
            <div className="space-y-3 max-h-[180px] overflow-auto pr-2">
              {[
                { name: 'CosmicExplorer', message: 'This stream is out of this world! 🚀', time: '2m ago', isPremium: true },
                { name: 'StarGazer42', message: 'The effects look amazing today', time: '4m ago', isPremium: false },
                { name: 'NebulaWanderer', message: 'Can you show us that cosmic backdrop again?', time: '5m ago', isPremium: true },
              ].map((comment, i) => (
                <div key={i} className="flex items-start space-x-2 p-2 rounded-lg bg-purple-900/10 backdrop-blur-sm">
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-purple-500 flex-shrink-0" style={{
                    background: comment.isPremium 
                      ? 'linear-gradient(45deg, #7e22ce, #3b0764)'
                      : 'linear-gradient(45deg, #4c1d95, #2e1065)',
                    boxShadow: comment.isPremium ? '0 0 10px rgba(126, 34, 206, 0.6)' : 'none',
                  }}>
                    <div className="flex items-center justify-center h-full text-white font-bold">
                      {comment.name[0].toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className={`font-semibold text-sm ${comment.isPremium ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400' : 'text-purple-300'}`}>{comment.name}</span>
                        {comment.isPremium && <Star className="h-3 w-3 text-yellow-400 ml-1" />}
                      </div>
                      <span className="text-xs text-gray-500">{comment.time}</span>
                    </div>
                    <p className="text-sm text-white">{comment.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Donation Messages */}
          <div>
            <div className="text-xs uppercase tracking-wider text-purple-300 mb-2 flex items-center">
              <GiftIcon className="h-3 w-3 mr-1" /> Donation Messages
            </div>
            <div className="space-y-2">
              <div className="flex items-center p-2 rounded-lg bg-gradient-to-r from-yellow-900/30 to-yellow-600/20 backdrop-blur-sm border border-yellow-600/30">
                <div className="h-6 w-6 rounded-full overflow-hidden border-2 border-yellow-500 mr-2 flex items-center justify-center bg-yellow-900/70 text-yellow-300 text-xs font-bold animate-pulse">SG</div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300 text-sm font-semibold">StarGuardian</span>
                    <span className="text-yellow-400 font-bold">$50.00</span>
                  </div>
                  <p className="text-xs text-yellow-200">Keep exploring those cosmic realms!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nav buttons */}
          <div className="mt-3 pt-2 flex justify-between items-center border-t border-purple-900/30">
            <button className="text-xs text-gray-400 flex items-center hover:text-white transition-colors">
              <ChevronLeft className="h-4 w-4 mr-1" /> Return to Stream
            </button>
            
            <div className="flex space-x-2">
              <button className="py-1 px-2 rounded text-xs bg-purple-900/50 text-purple-300 hover:bg-purple-800 hover:text-white transition-colors">
                Show All Messages
              </button>
            </div>
          </div>
        </div>
        
        {/* Animated comet effect */}
        <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden pointer-events-none">
          <div className="absolute h-1 w-20 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-comet" style={{ top: '20%', left: '-20px', animationDuration: '8s' }}></div>
          <div className="absolute h-1 w-20 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-comet" style={{ top: '70%', left: '-20px', animationDuration: '12s', animationDelay: '3s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default CosmicChatViewer;
