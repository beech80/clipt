// Part 6: Chat Panel and Donation UI
      
      {/* Chat panel - slides up from bottom */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 h-96 bg-black bg-opacity-90 z-20 backdrop-blur-sm border-t border-gray-800"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="h-full flex flex-col p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-purple-400">
                  Stream Chat
                </h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 mb-3">
                {chatMessages.map((message) => (
                  <div 
                    key={message.id}
                    className={`mb-3 ${message.isCurrentUser ? 'flex justify-end' : ''}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-2 ${message.isCurrentUser 
                        ? 'bg-purple-600 text-white ml-auto' 
                        : 'bg-gray-800 text-white'}`}
                    >
                      {!message.isCurrentUser && (
                        <div className="font-bold text-xs mb-1 text-purple-300">{message.user}</div>
                      )}
                      <div>{message.text}</div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2 rounded-full bg-purple-600 text-white disabled:opacity-50"
                  disabled={!newMessage.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Donation popup with improved styling */}
      <AnimatePresence>
        {showDonateForm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gray-900 rounded-xl border border-gray-700 shadow-xl w-full max-w-md overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-xl text-purple-400">
                  Support {currentStreamer.name}
                </h3>
                <button
                  onClick={() => setShowDonateForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-4 flex items-center gap-3 border-b border-gray-700">
                <div className="relative">
                  <div className="absolute -top-2 -left-2 bg-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 tracking-wide">
                    STREAMING
                  </div>
                  <img 
                    src={currentStreamer.avatar} 
                    alt={currentStreamer.name}
                    className="w-14 h-14 rounded-lg border-2 border-purple-600"
                  />
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full overflow-hidden border-2 border-purple-600">
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
                  <div className="font-bold text-lg text-purple-400">{currentStreamer.name}</div>
                  <div className="text-sm text-purple-300">{currentStreamer.followers.toLocaleString()} followers</div>
                </div>
              </div>
              
              <form onSubmit={handleDonateSubmit} className="p-4">
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {['5', '10', '20', '50'].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className={`p-2 rounded-lg border ${donationAmount === amount 
                        ? 'bg-purple-600 border-purple-500 text-white' 
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'} transition-colors`}
                      onClick={() => setDonationAmount(amount)}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Custom Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                      min="1"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Message (Optional)</label>
                  <textarea
                    value={donationMessage}
                    onChange={(e) => setDonationMessage(e.target.value)}
                    placeholder="Add a message to your donation"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                    rows={3}
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  disabled={!donationAmount}
                >
                  <DollarSign size={18} className="inline-block mr-2" />
                  Complete Donation
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
