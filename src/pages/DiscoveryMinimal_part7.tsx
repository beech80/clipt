// Part 7: Search Panel and Final Structure
      
      {/* Enhanced Search panel with game library */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-purple-400">Game Search</h2>
              <button 
                onClick={() => setSearchOpen(false)}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-800">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search games..."
                  className="w-full bg-gray-900 rounded-lg border border-gray-700 py-3 px-4 pl-10 text-white focus:outline-none focus:border-purple-500"
                  autoFocus
                />
                <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
                {isLoading && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-purple-500 border-r-2 border-b-2 border-gray-800"></div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-auto">
              {searchQuery ? (
                <div>
                  <h3 className="font-bold mb-4 text-xl">Search Results</h3>
                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                      {searchResults.map((game) => (
                        <div 
                          key={game.id} 
                          className="bg-black bg-opacity-60 rounded-lg overflow-hidden border border-gray-800 hover:border-purple-500 transition-all cursor-pointer"
                          onClick={() => {
                            setSelectedGame(game);
                            setSearchOpen(false);
                            toast.success(`Selected ${game.name}`);
                          }}
                        >
                          <div className="h-40 overflow-hidden">
                            <img 
                              src={game.cover || `https://picsum.photos/200/300?random=${game.id}`} 
                              alt={game.name}
                              className="w-full h-full object-cover transition-transform hover:scale-110"
                              onError={(e) => {
                                e.currentTarget.src = `https://picsum.photos/200/300?random=${game.id}`;
                              }}
                            />
                          </div>
                          <div className="p-3">
                            <p className="font-bold text-purple-400">{game.name}</p>
                            <div className="text-xs text-purple-300 mt-1 flex items-center">
                              <Gamepad size={12} className="mr-1" />
                              {game.platforms ? game.platforms.join(', ') : 'All Platforms'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-purple-400">No games found matching "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="font-bold mb-4 text-xl text-purple-400">Trending Games</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {gameLibrary.slice(0, 8).map((game) => (
                      <div
                        key={game.id} 
                        className="rounded-lg overflow-hidden bg-gray-900 hover:bg-gray-800 border border-gray-800 transform hover:scale-105 transition-all cursor-pointer shadow-lg hover:shadow-purple-500/20"
                        onClick={() => handleGameSelect(game)}
                      >
                        <div className="aspect-video bg-gray-800 relative overflow-hidden">
                          <img 
                            src={game.coverUrl} 
                            alt={game.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-80"></div>
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-purple-400">{game.name}</p>
                          <p className="text-sm text-purple-400 flex items-center">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mr-1"></span>
                            {game.viewerCount.toLocaleString()} viewers
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <NavigationBar />
    </div>
  );
};

export default DiscoveryMinimal;
