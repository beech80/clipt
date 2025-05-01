import React, { useState } from 'react';
import { toast } from 'sonner';
import { Gamepad, User, ArrowLeft, Send } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: any;
  username?: string;
}

export function ShareModal({ isOpen, onClose, post, username = 'username' }: ShareModalProps) {
  const [shareMessage, setShareMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  if (!isOpen || !post) return null;

  const handleSend = () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }
    
    toast.success(`Shared with ${selectedUsers.length} user(s)!`);
    setShareMessage('');
    setSelectedUsers([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg overflow-hidden relative p-4">
        <button 
          className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full"
          onClick={onClose}
        >
          <ArrowLeft size={20} />
        </button>
        
        <h3 className="text-xl font-bold mb-4 text-white">Share Post</h3>
        
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-14 h-14 bg-gray-800 rounded overflow-hidden">
            {post.image_url ? (
              <img 
                src={post.image_url} 
                alt={post.title} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gamepad size={24} className="text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-white">{post.title}</p>
            <p className="text-xs text-gray-400">by @{username}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-white mb-1">Message</label>
          <textarea 
            className="w-full bg-gray-800 text-white text-sm rounded p-3 focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder-gray-500"
            placeholder="Add a message..."
            rows={3}
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-white mb-1">Send to</label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {['User1', 'GamingBuddy', 'TeamPlayer', 'ProStreamer', 'SoloGrinder'].map((user, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="checkbox"
                  id={`user-${index}`}
                  className="mr-2 h-4 w-4 rounded border-gray-600 text-gray-400 focus:ring-offset-gray-900"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(prev => [...prev, user]);
                    } else {
                      setSelectedUsers(prev => prev.filter(u => u !== user));
                    }
                  }}
                />
                <label htmlFor={`user-${index}`} className="flex items-center cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-gray-800 mr-2 flex items-center justify-center">
                    <User size={14} className="text-white" />
                  </div>
                  <span className="text-sm text-white">{user}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-3 mt-4">
          <button
            className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md flex items-center justify-center"
            onClick={handleSend}
          >
            <Send size={16} className="mr-2" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
