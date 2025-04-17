// Part 4: Main UI Rendering

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col">
      {/* Full-screen video/image background simulation */}
      <div className="fixed inset-0 bg-black">
        {/* Overlay with subtle gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 z-10"></div>
        
        {/* This would be an actual video player in production */}
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <img 
            src={currentStreamer.gameBanner || `https://picsum.photos/1920/1080?random=${currentIndex}`} 
            alt="Stream content" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://picsum.photos/1920/1080?random=${currentIndex}`;
            }}
          />
          
          {/* Stream quality indicator */}
          <div className="absolute top-6 right-16 bg-black/60 rounded-full px-2 py-0.5 text-xs font-bold text-purple-400 border border-purple-600">
            HD 1080p
          </div>
        </div>
      </div>

      {/* Search button in top right - no header */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={() => setSearchOpen(true)}
          className="p-3 rounded-full bg-black bg-opacity-40 hover:bg-opacity-60 border border-purple-500 transition-all shadow-lg hover:shadow-purple-600/50 hover:scale-105"
        >
          <Search size={20} className="text-purple-400" />
        </button>
      </div>

      {/* Streamer info with STREAMING indicator */}
      <div className="absolute top-6 left-4 z-20 max-w-xs">
        <div 
          className="bg-black bg-opacity-40 backdrop-blur-sm rounded-lg p-3 border-l-4 border-purple-600 shadow-purple-600/20 shadow-lg group hover:scale-105 transition-transform overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-900/20 to-transparent opacity-50"></div>
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <div className="absolute -top-1 -left-1 bg-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 tracking-wide animate-pulse">
                STREAMING
              </div>
              <img 
                src={currentStreamer.avatar} 
                alt={currentStreamer.name}
                className="w-12 h-12 rounded-md border-2 border-purple-600 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full overflow-hidden border-2 border-purple-600">
                <img 
                  src={currentStreamer.gameCover} 
                  alt={currentStreamer.game}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://picsum.photos/50/50?random=${currentStreamer.id}`;
                  }}
                />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-xl text-purple-400">{currentStreamer.name}</h3>
              <div className="flex items-center text-xs text-purple-300 space-x-3 mt-0.5">
                <span className="font-medium">{currentStreamer.game}</span>
                <span className="flex items-center bg-black bg-opacity-30 px-1.5 py-0.5 rounded-full">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse"></span>
                  <span className="font-medium">{currentStreamer.viewers.toLocaleString()}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
