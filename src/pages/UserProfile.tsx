import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { User, Settings, Grid, ListVideo, Trophy } from 'lucide-react';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts');

  // Sample user data
  const userData = {
    username: "GamerTag42",
    followers: 1245,
    following: 357,
    bio: "Professional gamer and content creator. I stream daily on Twitch and upload highlights here!",
    isFollowing: false,
    posts: [
      { id: 1, title: "Insane clutch in CS2!", likes: 43, comments: 12 },
      { id: 2, title: "New personal record in Fortnite", likes: 89, comments: 24 },
      { id: 3, title: "Check out this crazy bug", likes: 76, comments: 31 },
      { id: 4, title: "Winning streak continues", likes: 124, comments: 34 },
    ]
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'posts':
        return (
          <div className="grid grid-cols-2 gap-4">
            {userData.posts.map((post) => (
              <div 
                key={post.id} 
                className="bg-black/30 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-purple-500/50 transition-colors"
                onClick={() => navigate(`/post/${post.id}`)}
              >
                <div className="aspect-video bg-gray-800 flex items-center justify-center">
                  <p className="text-gray-400 text-sm">Post Thumbnail</p>
                </div>
                <div className="p-3">
                  <p className="text-white text-sm font-medium truncate">{post.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-gray-400 text-xs">{post.likes} likes</p>
                    <p className="text-gray-400 text-xs">{post.comments} comments</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'clips':
        return (
          <div className="flex items-center justify-center h-40 text-gray-400">
            No clips available
          </div>
        );
      case 'achievements':
        return (
          <div className="flex items-center justify-center h-40 text-gray-400">
            No achievements available
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <User className="text-purple-400" size={24} />
            Profile
          </h1>
          <button className="absolute right-0 text-gray-300 hover:text-white">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
        {/* Profile Header */}
        <div className="bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 shadow-xl mb-6">
          <div className="h-32 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 relative">
            <div className="absolute -bottom-12 left-6">
              <div className="w-24 h-24 rounded-full bg-purple-600 border-4 border-[#0d1b3c] flex items-center justify-center text-white text-2xl font-bold">
                {userData.username.charAt(0)}
              </div>
            </div>
            <div className="absolute top-4 right-4">
              <Button 
                onClick={() => navigate('/profile/edit')} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 bg-[#1a1b4b] border border-white/10 text-white hover:bg-[#272a5b] px-4 py-1 rounded-sm"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Button>
            </div>
          </div>
          
          <div className="pt-14 px-6 pb-6">
            <h2 className="text-xl font-bold text-white">{userData.username}</h2>
            <div className="flex space-x-4 mt-1 text-sm text-gray-400">
              <span>{userData.followers} followers</span>
              <span>{userData.following} following</span>
            </div>
            
            <p className="mt-4 text-gray-300">{userData.bio}</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 shadow-xl">
          <div className="flex border-b border-white/10">
            <button 
              className={`flex-1 py-3 text-center text-sm font-medium ${activeTab === 'posts' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
              onClick={() => setActiveTab('posts')}
            >
              <Grid size={16} className="inline mr-1" />
              Posts
            </button>
            <button 
              className={`flex-1 py-3 text-center text-sm font-medium ${activeTab === 'clips' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
              onClick={() => setActiveTab('clips')}
            >
              <ListVideo size={16} className="inline mr-1" />
              Clips
            </button>
            <button 
              className={`flex-1 py-3 text-center text-sm font-medium ${activeTab === 'achievements' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
              onClick={() => setActiveTab('achievements')}
            >
              <Trophy size={16} className="inline mr-1" />
              Achievements
            </button>
          </div>
          
          <div className="p-4">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
