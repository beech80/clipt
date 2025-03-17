import { useState, useEffect } from "react";
import { GroupChatList } from "@/components/chat/GroupChatList";
import { GroupChatMessages } from "@/components/chat/GroupChatMessages";
import { ChevronLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GroupChat = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [activeDiscussions, setActiveDiscussions] = useState<string[]>([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Simulating active discussions data
    setActiveDiscussions(['general', 'game-updates', 'events']);
  }, []);

  return (
    <div className="min-h-screen bg-gaming-900 text-gaming-100">
      {/* Game Chat Header with retro gaming style */}
      <div className="bg-gaming-800 border-b border-gaming-700 py-4 px-6 flex items-center">
        <button 
          onClick={() => navigate(-1)} 
          className="mr-4 hover:text-blue-400 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-400" />
          Game Chat
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 h-[calc(100vh-4rem)]">
        {/* Left sidebar - Active Discussions */}
        <div className="bg-gaming-800 border-r border-gaming-700 p-4">
          <h2 className="uppercase text-sm font-bold text-gaming-400 mb-4">Active Discussions</h2>
          <div className="space-y-1">
            {activeDiscussions.map(discussion => (
              <div 
                key={discussion} 
                className="px-3 py-2 rounded hover:bg-gaming-700 cursor-pointer"
              >
                {discussion}
              </div>
            ))}
            <div className="h-px bg-gaming-700 my-3"></div>
            <div className="px-3 py-2 text-gaming-400 hover:text-gaming-100 transition-colors cursor-pointer">
              Other discussions
            </div>
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 h-full">
          {/* Chat List */}
          <div className="md:col-span-1 border-r border-gaming-700 overflow-y-auto bg-gaming-800/50">
            <GroupChatList onSelectGroup={setSelectedGroupId} />
          </div>
          
          {/* Chat Messages */}
          <div className="md:col-span-2 flex flex-col bg-gaming-900">
            {selectedGroupId ? (
              <GroupChatMessages groupId={selectedGroupId} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gaming-400 p-6 text-center">
                <div className="w-16 h-16 mb-4 rounded-full border-2 border-gaming-600 flex items-center justify-center">
                  <Users className="h-8 w-8 text-gaming-500" />
                </div>
                <h3 className="text-xl font-medium mb-2">Select a chat</h3>
                <p>Choose a group from the list to start chatting with your gaming community</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;