import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BackButton } from '@/components/ui/back-button';
import { Camera, Upload, X, Video, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

const NewPost = () => {
  const navigate = useNavigate();
  const [postDestination, setPostDestination] = useState('home');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate number of files
    if (mediaFiles.length + files.length > 5) {
      toast.error('You can only upload a maximum of 5 files');
      return;
    }
    
    // Validate file types based on destination
    if (postDestination === 'clipts') {
      const invalidFiles = files.filter(file => !file.type.startsWith('video/'));
      if (invalidFiles.length > 0) {
        toast.error('Only video files are allowed for Clipts');
        return;
      }
    }
    
    // Validate file size
    const oversizedFiles = files.filter(file => file.size > 50 * 1024 * 1024); // 50MB
    if (oversizedFiles.length > 0) {
      toast.error('Files must be smaller than 50MB');
      return;
    }
    
    // Create preview URLs for the files
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    
    setMediaFiles(prev => [...prev, ...files]);
    setMediaPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };
  
  const removeFile = (index: number) => {
    URL.revokeObjectURL(mediaPreviewUrls[index]);
    
    setMediaFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
    
    setMediaPreviewUrls(prev => {
      const newUrls = [...prev];
      newUrls.splice(index, 1);
      return newUrls;
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the post
    if (!title.trim()) {
      toast.error('Please add a title');
      return;
    }
    
    if (mediaFiles.length === 0) {
      toast.error('Please upload at least one media file');
      return;
    }
    
    if (postDestination === 'clipts') {
      const nonVideoFiles = mediaFiles.filter(file => !file.type.startsWith('video/'));
      if (nonVideoFiles.length > 0) {
        toast.error('Only video files are allowed for Clipts');
        return;
      }
    }
    
    // TODO: Actually upload the files and create the post
    
    // Mock success for now
    toast.success(`Post created and will appear in ${postDestination === 'home' ? 'Home' : 'Clipts'}`);
    navigate('/');
  };

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
          {/* Post Destination Toggle */}
          <div className="mb-6">
            <p className="text-white text-sm mb-2">Post to:</p>
            <div className="flex space-x-2">
              <Button 
                variant={postDestination === 'home' ? "default" : "outline"}
                className={postDestination === 'home' 
                  ? "bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2" 
                  : "bg-gray-800/50 border-gray-700 text-gray-300 flex items-center gap-2"
                }
                onClick={() => setPostDestination('home')}
              >
                <ImageIcon size={16} />
                Home Feed
              </Button>
              <Button 
                variant={postDestination === 'clipts' ? "default" : "outline"}
                className={postDestination === 'clipts' 
                  ? "bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2" 
                  : "bg-gray-800/50 border-gray-700 text-gray-300 flex items-center gap-2"
                }
                onClick={() => setPostDestination('clipts')}
              >
                <Video size={16} />
                Clipts
              </Button>
            </div>
            {postDestination === 'clipts' && (
              <p className="text-amber-400 text-xs mt-2">Note: Only video content is allowed in Clipts</p>
            )}
          </div>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Input 
                placeholder="Title" 
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            
            <div>
              <Textarea 
                placeholder="Share your gaming moment..." 
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 min-h-[120px]"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            
            {/* Media Preview */}
            {mediaPreviewUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {mediaPreviewUrls.map((url, index) => (
                  <div key={index} className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                    {mediaFiles[index]?.type.startsWith('video/') ? (
                      <video 
                        src={url} 
                        className="w-full h-full object-cover"
                        controls
                      />
                    ) : (
                      <img 
                        src={url} 
                        alt={`Upload preview ${index+1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <button 
                      type="button"
                      className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full"
                      onClick={() => removeFile(index)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {mediaPreviewUrls.length < 5 && (
                  <div 
                    className="aspect-video border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
            )}
            
            {/* Media Upload Area */}
            {mediaPreviewUrls.length === 0 && (
              <div 
                className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-400">
                  Drag and drop your media here, or click to browse
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {postDestination === 'clipts' 
                    ? 'Supports: MP4, WEBM videos (max 50MB)'
                    : 'Supports: JPG, PNG, GIF, MP4 (max 50MB, up to 5 files)'
                  }
                </p>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden"
              accept={postDestination === 'clipts' ? 'video/*' : 'image/*,video/*'}
              onChange={handleFileChange}
              multiple={postDestination === 'home'}
            />
            
            <Button 
              type="submit"
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
