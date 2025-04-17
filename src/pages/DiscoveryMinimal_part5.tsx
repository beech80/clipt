// Part 5: Navigation and Controller UI

      {/* Navigation buttons */}
      <button 
        className="absolute top-1/2 left-4 transform -translate-y-1/2 z-20 p-2 rounded-full bg-gray-800 bg-opacity-60 hover:bg-opacity-80 transition-colors"
        onClick={handlePrev}
      >
        <ChevronLeft size={24} />
      </button>

      <button 
        className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20 p-2 rounded-full bg-gray-800 bg-opacity-60 hover:bg-opacity-80 transition-colors"
        onClick={handleNext}
      >
        <ChevronRight size={24} />
      </button>

      {/* Controller at bottom - more compact and less intrusive */}
      <div className="absolute bottom-8 right-8 z-20">
        <div className="flex flex-col gap-4">
          <button 
            className={`w-12 h-12 rounded-full ${showChat ? 'bg-green-700' : 'bg-black bg-opacity-60'} flex items-center justify-center shadow-lg border ${showChat ? 'border-green-400' : 'border-[#107c10]'} hover:scale-110 transition-transform`}
            onClick={handleToggleChat}
          >
            <MessageCircle size={20} className={showChat ? 'text-white' : 'text-[#107c10]'} />
            <span className="absolute bottom-0 right-0 w-4 h-4 flex items-center justify-center bg-black bg-opacity-60 rounded-full text-[10px] font-bold">Y</span>
          </button>
          
          <button 
            className="w-12 h-12 rounded-full bg-black bg-opacity-60 flex items-center justify-center shadow-lg border border-[#f25022] hover:scale-110 transition-transform"
            onClick={() => setShowDonateForm(true)}
          >
            <DollarSign size={20} className="text-[#f25022]" />
            <span className="absolute bottom-0 right-0 w-4 h-4 flex items-center justify-center bg-black bg-opacity-60 rounded-full text-[10px] font-bold">B</span>
          </button>
          
          <button 
            className={`w-12 h-12 rounded-full bg-black bg-opacity-60 flex items-center justify-center shadow-lg border ${isFollowing ? 'border-blue-400' : 'border-[#00a4ef]'} hover:scale-110 transition-transform`}
            onClick={handleFollow}
          >
            <UserPlus size={20} className={isFollowing ? 'text-blue-400' : 'text-[#00a4ef]'} />
            <span className="absolute bottom-0 right-0 w-4 h-4 flex items-center justify-center bg-black bg-opacity-60 rounded-full text-[10px] font-bold">A</span>
          </button>
          
          <button 
            className={`w-12 h-12 rounded-full bg-black bg-opacity-60 flex items-center justify-center shadow-lg border ${isRecording ? 'border-red-500' : 'border-[#ffb900]'} hover:scale-110 transition-transform relative`}
            onClick={handleRecord}
          >
            {isRecording ? (
              <>
                <Clock size={20} className="text-red-500 animate-pulse" />
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 44 44">
                  <circle 
                    className="text-gray-800 opacity-25" 
                    cx="22" 
                    cy="22" 
                    r="20" 
                    strokeWidth="3" 
                    stroke="currentColor" 
                    fill="none"
                  />
                  <circle 
                    className="text-red-500" 
                    cx="22" 
                    cy="22" 
                    r="20" 
                    strokeWidth="3" 
                    stroke="currentColor" 
                    fill="none" 
                    strokeDasharray="125.6" 
                    strokeDashoffset={125.6 * (1 - recordingProgress/100)}
                    transform="rotate(-90 22 22)"
                  />
                </svg>
              </>
            ) : (
              <Scissors size={20} className="text-[#ffb900]" />
            )}
            <span className="absolute bottom-0 right-0 w-4 h-4 flex items-center justify-center bg-black bg-opacity-60 rounded-full text-[10px] font-bold">X</span>
          </button>
        </div>
      </div>
