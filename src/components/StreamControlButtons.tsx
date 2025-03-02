import React from 'react';
import { Heart, MessageSquare, UserPlus, Trophy, Camera } from 'lucide-react';
import { toast } from "sonner";

interface StreamControlButtonsProps {
  currentStreamId?: string;
}

const StreamControlButtons = ({ currentStreamId }: StreamControlButtonsProps) => {
  // Actions for the stream control buttons
  const handleAction = (action: string) => {
    switch(action) {
      case 'like':
        toast.success("Liked the stream!");
        break;
      case 'comment':
        toast.success("Comment feature opened!");
        break;
      case 'follow':
        toast.success("Now following this streamer!");
        break;
      case 'rank':
        toast.success("Stream ranked!");
        break;
      case 'post':
        toast.success("Creating a new post from this stream!");
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Diamond formation buttons */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-start-2">
          <button 
            className="rounded-full bg-red-600 hover:bg-red-700 p-3 transition-colors"
            onClick={() => handleAction('like')}
          >
            <Heart className="w-6 h-6" />
          </button>
        </div>
        <div className="col-start-1 row-start-2">
          <button 
            className="rounded-full bg-blue-600 hover:bg-blue-700 p-3 transition-colors"
            onClick={() => handleAction('comment')}
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>
        <div className="col-start-3 row-start-2">
          <button 
            className="rounded-full bg-green-600 hover:bg-green-700 p-3 transition-colors"
            onClick={() => handleAction('follow')}
          >
            <UserPlus className="w-6 h-6" />
          </button>
        </div>
        <div className="col-start-2 row-start-3">
          <button 
            className="rounded-full bg-yellow-600 hover:bg-yellow-700 p-3 transition-colors"
            onClick={() => handleAction('rank')}
          >
            <Trophy className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Post button below */}
      <div className="mt-4">
        <button 
          className="rounded-full bg-purple-600 hover:bg-purple-700 p-4 transition-colors"
          onClick={() => handleAction('post')}
        >
          <Camera className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};

export default StreamControlButtons;
