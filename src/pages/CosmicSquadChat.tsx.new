import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, ArrowLeft } from 'lucide-react';

// Type definitions for cosmic objects
type CosmicObject = {
  type: string;
  top: string;
  left: string;
  size?: string;
  width?: string;
  height?: string;
  opacity: number;
};

const CosmicSquadChat = () => {
  const navigate = useNavigate();

  // Animation variants for cosmic objects
  const cosmicObjects: CosmicObject[] = [
    { type: 'star', top: '10%', left: '15%', size: '3px', opacity: 0.7 },
    { type: 'star', top: '25%', left: '80%', size: '2px', opacity: 0.5 },
    { type: 'star', top: '40%', left: '35%', size: '4px', opacity: 0.9 },
    { type: 'star', top: '70%', left: '65%', size: '3px', opacity: 0.6 },
    { type: 'star', top: '85%', left: '25%', size: '2px', opacity: 0.7 },
    { type: 'planet', top: '15%', left: '75%', size: '30px', opacity: 0.9 },
    { type: 'planet', top: '75%', left: '10%', size: '20px', opacity: 0.8 },
    { type: 'comet', top: '30%', left: '0%', width: '50px', height: '2px', opacity: 0.8 }
  ];

  // Handle back button
  const handleBack = () => {
    navigate(-1);
  };

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
      
      {/* Header */}
      <div className="relative z-10 p-4 flex items-center border-b border-purple-900">
        <button
          onClick={handleBack}
          className="mr-3 p-2 text-white hover:text-purple-300 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white text-xl font-bold">Squad Chat</h1>
      </div>
      
      {/* Messages container - Completely empty, only showing background */}
      <div
        className="relative z-10 flex-grow p-4 overflow-y-auto space-y-4"
        style={{
          background: 'linear-gradient(to bottom, rgba(9, 0, 20, 0.2), rgba(9, 0, 20, 0.6))',
          backdropFilter: 'blur(5px)'
        }}
      >
        {/* Welcome message only */}
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-purple-300 p-8 max-w-md">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300 mb-3">Welcome to Squad Chat</h2>
            <p className="text-purple-200 opacity-80">This exclusive space is for subscribers only. Share your thoughts with the cosmic community.</p>
          </div>
        </div>
      </div>
      
      {/* Input area */}
      <div className="relative z-10 px-4 pb-4 pt-2 bg-transparent backdrop-blur-sm border-t border-purple-900">
        <div className="mt-1 text-xs text-gray-500 flex justify-between items-center px-2 mb-3">
          <div>Press Enter to send</div>
          <div>{new Date().toLocaleDateString()} • Cosmic Space Chat</div>
        </div>
        
        {/* Simple text area for messages - no tokens functionality */}
        <div className="mt-3">
          <div className="relative">
            <textarea 
              placeholder="Share your thoughts with the squad..." 
              className="w-full p-3 bg-purple-900/20 border border-purple-700 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              style={{ boxShadow: '0 0 15px rgba(147, 51, 234, 0.15)', minHeight: '80px', resize: 'vertical' }}
            />
          </div>
          <div className="mt-2 flex justify-end">
            <button className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-md hover:from-purple-600 hover:to-indigo-600 transition-all flex items-center gap-2">
              <Send size={16} />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CosmicSquadChat;
