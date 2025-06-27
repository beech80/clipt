  // Format seconds to MM:SS or HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Inject cosmic styles */}
      <style dangerouslySetInnerHTML={{ __html: cosmicStyles }} />
      
      {/* Cosmic background effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {/* Starfield background */}
        <div className="absolute inset-0">
          {Array.from({ length: 100 }).map((_, i) => (
            <div 
              key={i}
              className="cosmic-star"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                '--twinkle-duration': `${3 + Math.random() * 5}s`,
                '--twinkle-delay': `${Math.random() * 5}s`,
                '--star-opacity': `${0.5 + Math.random() * 0.5}`
              } as React.CSSProperties}
            />
          ))}
        </div>
        
        {/* Nebula overlay */}
        <div className="nebula-bg"></div>
        
        {/* Animated cosmic comets */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={`comet-${i}`}
            className="cosmic-comet"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 45}deg)`,
              '--comet-delay': `${i * 5 + Math.random() * 10}s`
            } as React.CSSProperties}
          />
        ))}
      </div>
      
      {/* Main layout structure */}
      <div className="relative z-10">
        {/* Header with nav and buttons */}
        <header className="border-b border-purple-900/30 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sticky top-0 z-30 backdrop-blur-md">
          <div className="container mx-auto flex justify-between items-center">
            {/* Left side - branding */}
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">
                Cosmic Stream
              </Link>
            </div>
            
            {/* Center - Navigation */}
            <div className="hidden md:flex space-x-2 items-center">
              <Button
                variant="ghost"
                size="sm"
                className={`${activeTab === "live" ? 'bg-purple-900/50 text-white' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab("live")}
              >
                <Tv className="h-4 w-4 mr-2" />
                Live Stream
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className={`${activeTab === "analytics" ? 'bg-purple-900/50 text-white' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab("analytics")}
              >
                <BarChart className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className={`${activeTab === "settings" ? 'bg-purple-900/50 text-white' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
            
            {/* Right side - Actions */}
            <div className="flex items-center space-x-2">
              {/* Mobile Go Live Button */}
              <div className="md:hidden">
                <Button
                  size="sm"
                  onClick={toggleLiveStatus}
                  className={`relative ${
                    isLive 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                  }`}
                >
                  {isLive ? (
                    <>
                      <span className="absolute top-0 right-0 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      End Stream
                    </>
                  ) : (
                    <>
                      <Radio className="h-4 w-4 mr-1" />
                      Go Live
                    </>
                  )}
                </Button>
              </div>
              
              {/* Stream Manager Button */}
              <Button
                variant="outline"
                size="sm"
                className="text-white bg-indigo-900/20 border-indigo-800/30 hover:bg-indigo-800/30"
                onClick={toggleStreamManager}
              >
                <Server className="h-4 w-4 mr-2" />
                Stream Manager
              </Button>
                          
              {/* Chat Button */}
              <Button
                variant="outline"
                size="sm"
                className="text-white bg-purple-900/20 border-purple-800/30 hover:bg-purple-800/30"
                onClick={toggleChatViewer}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {showChatViewer ? 'Hide Chat' : 'View Chat'}
              </Button>
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="container mx-auto py-6 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stream preview and stats - left column */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl overflow-hidden border border-indigo-900/20 shadow-[0_0_15px_rgba(138,43,226,0.15)]">
                {/* Stream Preview */}
                <div className="aspect-video bg-gradient-to-br from-slate-950 to-indigo-950/20 relative">
                  {/* Placeholder for stream */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      {isLive ? (
                        <div className="cosmic-pulse">
                          <Badge className="mb-4 bg-red-600">LIVE</Badge>
                          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">
                            Your stream is live
                          </h3>
                          <p className="text-gray-400 text-sm mt-2">
                            {viewerCount} viewers • {formatDuration(streamDuration)} elapsed
                          </p>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">
                            Stream Preview
                          </h3>
                          <p className="text-gray-400 text-sm mt-2">
                            Click Go Live to start streaming
                          </p>
                          {/* Desktop Go Live Button */}
                          <div className="mt-4 hidden md:block">
                            <Button
                              onClick={toggleLiveStatus}
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white cosmic-button"
                            >
                              <Radio className="h-4 w-4 mr-2" />
                              Go Live
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Stream Controls */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-300">
                      {isLive ? "Your Stream" : "Stream Setup"}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      {isLive 
                        ? `Live for ${formatDuration(streamDuration)} with ${viewerCount} viewers` 
                        : "Configure your stream settings and go live"
                      }
                    </p>
                  </div>
                  
                  {isLive && (
                    <Button 
                      variant="destructive"
                      onClick={toggleLiveStatus}
                      className="hidden md:flex items-center space-x-2"
                    >
                      <span className="relative flex h-3 w-3 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      End Stream
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Stream Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {/* Viewers Card */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-indigo-900/20 shadow-[0_0_15px_rgba(138,43,226,0.15)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-indigo-400" />
                        Viewers
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{viewerCount}</div>
                    <div className="flex items-center text-xs text-green-400 mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>+{Math.floor(viewerCount * 0.1)} in last hour</span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Chat Activity */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-indigo-900/20 shadow-[0_0_15px_rgba(138,43,226,0.15)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium">
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2 text-indigo-400" />
                        Chat Messages
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{chatCount}</div>
                    <div className="flex items-center text-xs text-indigo-400 mt-1">
                      <Activity className="h-3 w-3 mr-1" />
                      <span>{Math.max(1, Math.floor(chatCount * 0.1))} messages/min</span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Stream Health */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-indigo-900/20 shadow-[0_0_15px_rgba(138,43,226,0.15)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium">
                      <div className="flex items-center">
                        <Activity className="h-4 w-4 mr-2 text-indigo-400" />
                        Stream Health
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <div className="flex-grow">
                        <Progress value={95} className="h-2 bg-slate-700" indicatorClassName="bg-gradient-to-r from-indigo-500 to-purple-500" />
                      </div>
                      <div className="ml-2 text-sm font-medium text-green-400">
                        Good
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      60fps @ 1080p
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Stream Info - Right column */}
            <div>
              <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-indigo-900/20 shadow-[0_0_15px_rgba(138,43,226,0.15)]">
                <CardHeader>
                  <CardTitle>Stream Info</CardTitle>
                  <CardDescription>Configure your stream settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="title">Stream Title</label>
                    <Input 
                      id="title" 
                      placeholder="Enter your stream title"
                      className="bg-slate-900 border-indigo-900/30 focus:border-indigo-500 focus:ring-indigo-500"
                      value={streamTitle}
                      onChange={(e) => setStreamTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={streamCategory} onValueChange={setStreamCategory}>
                      <SelectTrigger className="bg-slate-900 border-indigo-900/30">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-indigo-900/30">
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="irl">IRL / Just Chatting</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="events">Events</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {streamCategory === 'gaming' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="game">Game Name</label>
                      <Input 
                        id="game" 
                        placeholder="Enter game name"
                        className="bg-slate-900 border-indigo-900/30 focus:border-indigo-500 focus:ring-indigo-500"
                        value={streamGame}
                        onChange={(e) => setStreamGame(e.target.value)}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stream Key</label>
                    <div className="flex items-center space-x-2">
                      <Input
                        disabled
                        type="password"
                        value="rtmp://stream.cosmic/live/xyz123"
                        className="bg-slate-900 border-indigo-900/30"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="flex-shrink-0 border-indigo-900/30 hover:bg-indigo-900/20"
                        onClick={() => copyToClipboard("rtmp://stream.cosmic/live/xyz123", "Stream key")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Use this key in your broadcasting software
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-indigo-900/20 pt-4">
                  <div className="flex justify-between w-full">
                    <Button 
                      variant="outline" 
                      className="border-indigo-900/30 hover:bg-indigo-900/20"
                      onClick={() => copyToClipboard("https://cosmic.stream/u/yourusername", "Stream URL")}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    {!isLive && (
                      <Button 
                        disabled={!streamTitle.trim()}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                        onClick={toggleLiveStatus}
                      >
                        <Radio className="h-4 w-4 mr-2" />
                        Go Live
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </main>
      </div>
