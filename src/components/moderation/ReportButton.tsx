import React, { useState } from 'react';
import { Flag, Share2, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportUserModal } from './ReportUserModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReportButtonProps {
  userId: string;
  username: string;
  variant?: 'default' | 'subtle' | 'icon' | 'dropdown';
  size?: 'sm' | 'default' | 'lg';
  postId?: string;
}

export const ReportButton = ({ 
  userId, 
  username, 
  variant = 'subtle', 
  size = 'sm',
  postId
}: ReportButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleShare = () => {
    // Share functionality would go here
    if (navigator.share && postId) {
      navigator.share({
        title: `${username}'s Clipt`,
        text: `Check out this awesome clip from ${username} on Clipt!`,
        url: `${window.location.origin}/clipt/${postId}`,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback copy to clipboard
      const shareUrl = postId ? `${window.location.origin}/clipt/${postId}` : window.location.href;
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  // If we're in dropdown mode, render a dropdown menu with share and report options
  if (variant === 'dropdown') {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-black/90 border-purple-800/50 text-purple-100">
            <DropdownMenuLabel>Post Actions</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-purple-800/30" />
            <DropdownMenuItem 
              onClick={handleShare}
              className="flex items-center cursor-pointer hover:bg-purple-900/40"
            >
              <Share2 className="h-4 w-4 mr-2 text-blue-400" />
              <span>Share</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setIsModalOpen(true)} 
              className="flex items-center cursor-pointer hover:bg-purple-900/40 text-red-400 hover:text-red-300"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span>Report User</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      
        <ReportUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          reportedUserId={userId}
          reportedUsername={username}
        />
      </>
    );
  }
  
  // Standard button display
  return (
    <>
      <Button
        variant={variant === 'icon' ? 'ghost' : variant === 'subtle' ? 'secondary' : 'default'}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className="text-muted-foreground hover:text-destructive transition-colors"
      >
        <Flag className="h-4 w-4 mr-2" />
        {variant !== 'icon' && 'Report'}
      </Button>
      
      <ReportUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reportedUserId={userId}
        reportedUsername={username}
      />
    </>
  );
};

export default ReportButton;
