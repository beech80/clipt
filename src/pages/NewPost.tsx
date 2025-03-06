import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BackButton } from '@/components/ui/back-button';
import { Camera, Upload } from 'lucide-react';

const NewPost = () => {
  const navigate = useNavigate();
  const [postType, setPostType] = useState('clipts');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Camera className="text-purple-400" size={24} />
            New Post
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-xl">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-xl">
          <div className="flex space-x-2 mb-6">
            <Button 
              variant={postType === 'clipts' ? "default" : "outline"}
              className={postType === 'clipts' 
                ? "bg-purple-600 hover:bg-purple-700 text-white" 
                : "bg-gray-800/50 border-gray-700 text-gray-300"
              }
              onClick={() => setPostType('clipts')}
            >
              Clipt
            </Button>
            <Button 
              variant={postType === 'discussions' ? "default" : "outline"}
              className={postType === 'discussions' 
                ? "bg-purple-600 hover:bg-purple-700 text-white" 
                : "bg-gray-800/50 border-gray-700 text-gray-300"
              }
              onClick={() => setPostType('discussions')}
            >
              Discussion
            </Button>
          </div>
          
          <form className="space-y-4">
            <div>
              <Input 
                placeholder="Title" 
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400"
              />
            </div>
            
            <div>
              <Textarea 
                placeholder="Share your gaming moment..." 
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 min-h-[120px]"
              />
            </div>
            
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-400">
                Drag and drop your media here, or click to browse
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supports: JPG, PNG, GIF, MP4 (max 50MB)
              </p>
            </div>
            
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Post
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewPost;
