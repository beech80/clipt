import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, UserCheck, Shield } from 'lucide-react';
import { toast } from 'sonner';

// Production-ready CosmicSquadChat component for subscribers only
const CosmicSquadChat = () => {
  const { streamerId } = useParams();
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(true); // Default to true for testing
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
    // In production, verify subscription status here
    // Example: checkSubscriptionStatus(streamerId, userId)
  }, [messages]);
  
  // Handle back button
  const handleBack = () => {
    navigate(-1);
  };

  // Message change handler
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };
  
  // Enhanced send message function 
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    setIsLoading(true);
    
    // Create message object
    const newMsg = {
      id: Date.now(),
      userId: 'current-user', // Would be actual userId in production
      username: 'You',
      content: newMessage,
      timestamp: new Date().toISOString(),
      avatar: 'https://i.pravatar.cc/150?img=33'
    };
    
    // In production, would send to backend here
    // api.sendChatMessage(streamerId, newMsg)
    
    // Add to local messages
    setMessages(prev => [...prev, newMsg]);
    
    // Show success notification
    toast.success('Message sent to the squad!');
    
    // Clear input and finish loading
    setNewMessage('');
    setIsLoading(false);
  };
  
  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Animation variants for cosmic objects
  const cosmicObjects = [
    { type: 'star', top: '10%', left: '15%', size: '3px', opacity: 0.7 },
    { type: 'star', top: '25%', left: '80%', size: '2px', opacity: 0.5 },
    { type: 'planet', top: '15%', left: '75%', size: '30px', opacity: 0.9 },
    { type: 'comet', top: '30%', left: '0%', width: '50px', height: '2px', opacity: 0.8 }
  ];
  
  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-b from-purple-950/20 to-indigo-950/30 overflow-hidden">
      {/* Floating space objects */}
      {cosmicObjects.map((obj, i) => (
        <div key={i}
          className={`absolute rounded-full ${obj.type === 'comet' ? 'animate-comet' : 'animate-twinkle'}`}
          style={{
            top: obj.top,
            left: obj.left,
            width: obj.size || obj.width || '2px',
            height: obj.size || obj.height || '2px',
            opacity: obj.opacity,
            background: obj.type === 'star' ? 'white' : 
                      obj.type === 'planet' ? 'radial-gradient(circle, rgba(176,108,235,1) 0%, rgba(91,33,182,1) 100%)' :
                      'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)'
          }}
        />
      ))}
      
      {/* Header - centered title */}
      <div className="relative z-10 p-4 flex items-center justify-between border-b border-purple-900">
        <button
          onClick={handleBack}
          className="p-2 text-white hover:text-purple-300 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white text-xl font-bold text-center flex-grow">Squad Chat</h1>
        <div className="w-10"></div> {/* Spacer for balance */}
      </div>
      
      {/* Messages container with conditional display */}
      <div 
        ref={chatContainerRef}
        className="relative z-10 flex-grow p-4 overflow-y-auto"
        style={{
          background: 'linear-gradient(to bottom, rgba(9, 0, 20, 0.2), rgba(9, 0, 20, 0.6))',
          backdropFilter: 'blur(5px)'
        }}
      >
        {messages.length === 0 ? (
          /* Welcome message when no messages */
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-purple-300 p-8 max-w-md">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-purple-400 opacity-80" />
              </div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300 mb-3">Welcome to Squad Chat</h2>
              <p className="text-purple-200 opacity-80">This exclusive space is for subscribers only. Share your thoughts with the cosmic community.</p>
              <div className="mt-6 flex items-center justify-center text-sm text-purple-300">
                <UserCheck className="mr-2 h-4 w-4" />
                <span>Subscriber verified</span>
              </div>
            </div>
          </div>
        ) : (
          /* Display messages when available */
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="group flex items-start gap-3 hover:bg-purple-900/10 p-2 rounded-lg transition-colors">
                <img
                  src={message.avatar}
                  alt={message.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                
                <div className="flex-grow">
                  <div className="flex items-baseline">
                    <span className="font-bold text-white">{message.username}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="mt-1 text-white break-words">{message.content}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
      </div>
      
      {/* Input area - enhanced with subscriber verification */}
      <div className="relative z-10 px-4 pb-6 pt-3 bg-transparent backdrop-blur-sm border-t border-purple-900">
        {isSubscribed ? (
          <>
            <div className="text-xs text-purple-300 flex justify-between items-center px-2 mb-3">
              <div className="flex items-center">
                <UserCheck className="h-3 w-3 mr-1" />
                <span>Subscriber Access</span>
              </div>
              <div>{new Date().toLocaleDateString()} • Cosmic Squad</div>
            </div>
            
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <textarea
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Share your thoughts with the squad..."
                  className="flex-grow p-4 bg-purple-900/20 border border-purple-700 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  style={{ 
                    boxShadow: '0 0 15px rgba(147, 51, 234, 0.15)',
                    backgroundImage: 'radial-gradient(circle at top right, rgba(147, 51, 234, 0.05), transparent 70%)',
                    minHeight: '60px',
                    resize: 'vertical',
                    maxHeight: '150px'
                  }}
                  disabled={isLoading}
                  autoFocus={true}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isLoading}
                  className="h-14 px-5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={18} />
                      <span className="ml-2 font-medium">Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4 text-center">
            <Shield className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <p className="text-purple-200 font-medium">This chat is for subscribers only</p>
            <p className="text-purple-300 text-sm mt-1">Subscribe to the channel to join the conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CosmicSquadChat;
