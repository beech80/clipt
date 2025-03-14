import React from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { CommentsProvider } from '@/contexts/CommentContext';
import '@/index.css';
import './components/GameBoyControls.css';

// Simple component for testing rendering
const MinimalApp = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Clipt</h1>
      <p className="mb-6">Your gaming moments, captured.</p>
      
      {/* GameBoy Controller UI */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-4">
        {/* Joystick on the left */}
        <div className="joystick-container">
          <div className="joystick">
            <div className="d-pad-up"></div>
            <div className="d-pad-right"></div>
            <div className="d-pad-down"></div>
            <div className="d-pad-left"></div>
            <div className="d-pad-center"></div>
          </div>
        </div>
        
        {/* Center section with CLIPT button, POST and hamburger menu */}
        <div className="flex flex-col items-center">
          {/* CLIPT button with blue-purple gradient outline */}
          <button className="clipt-button-container mb-2">
            <div className="clipt-button pulse-glow">
              <span className="text-white font-bold">CLIPT</span>
            </div>
          </button>
          
          {/* POST and hamburger buttons */}
          <div className="flex space-x-3">
            <button className="post-button text-xs bg-gray-800 px-3 py-1 rounded-md flex items-center">
              <span className="mr-1">+</span>
              <span>POST</span>
            </button>
            <button className="menu-button text-xs bg-gray-800 px-3 py-1 rounded-md">
              <span>☰</span>
            </button>
          </div>
        </div>
        
        {/* 4 Action buttons on the right in diamond formation */}
        <div className="action-buttons">
          <div className="diamond-buttons">
            <button className="action-button action-button-top">
              <div className="w-full h-full rounded-full bg-gray-800 border border-red-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
            </button>
            <button className="action-button action-button-right">
              <div className="w-full h-full rounded-full bg-gray-800 border border-blue-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
              </div>
            </button>
            <button className="action-button action-button-bottom">
              <div className="w-full h-full rounded-full bg-gray-800 border border-purple-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </button>
            <button className="action-button action-button-left">
              <div className="w-full h-full rounded-full bg-gray-800 border border-green-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MessagesProvider>
        <CommentsProvider>
          <MinimalApp />
          <Toaster 
            position="top-center" 
            richColors 
            toastOptions={{
              style: {
                background: '#111',
                color: '#fff',
                border: '1px solid #222',
              },
              className: 'retro-toast',
            }} 
          />
        </CommentsProvider>
      </MessagesProvider>
    </AuthProvider>
  );
}

export default App;
