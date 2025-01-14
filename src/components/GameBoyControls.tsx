import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ThumbsUp, Share2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const GameBoyControls = () => {
  const handleAction = (action: string) => {
    toast.success(`${action} action triggered!`);
  };

  return (
    <div className="gameboy-container">
      {/* D-Pad */}
      <div className="gameboy-dpad">
        <button 
          className="dpad-button"
          style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }}
          onClick={() => handleAction('Up')}
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <button 
          className="dpad-button"
          style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}
          onClick={() => handleAction('Down')}
        >
          <ArrowDown className="w-6 h-6" />
        </button>
        <button 
          className="dpad-button"
          style={{ left: 0, top: '50%', transform: 'translateY(-50%)' }}
          onClick={() => handleAction('Left')}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button 
          className="dpad-button"
          style={{ right: 0, top: '50%', transform: 'translateY(-50%)' }}
          onClick={() => handleAction('Right')}
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons-container">
        <button 
          className="action-button"
          onClick={() => handleAction('Like')}
        >
          <ThumbsUp className="w-6 h-6" />
        </button>
        <button 
          className="action-button"
          onClick={() => handleAction('Share')}
        >
          <Share2 className="w-6 h-6" />
        </button>
        <button 
          className="action-button"
          onClick={() => handleAction('Comment')}
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default GameBoyControls;