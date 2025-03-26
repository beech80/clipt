import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { Copy, Mail, Share2, Users } from 'lucide-react';

const InviteFriends: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // The referral link includes the current user's ID as the referrer
  const inviteLink = `${window.location.origin}/signup?ref=${user?.id || ''}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        toast.success("Invite link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy link. Please try again.");
      });
  };
  
  const handleEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, you would send this to your backend
      // For demo purposes, we'll just simulate a successful invite
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Invitation sent to ${email}`);
      setEmail('');
    } catch (error) {
      toast.error("Failed to send invitation. Please try again.");
      console.error("Error sending invitation:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleShareButton = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on CLIPT!',
          text: 'Check out this awesome gaming social platform!',
          url: inviteLink,
        });
        toast.success("Shared successfully!");
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      handleCopyLink();
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card className="gaming-card p-6 mb-6">
        <div className="text-center mb-6">
          <div className="mb-4 flex justify-center">
            <Users className="h-12 w-12 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-gaming-100 mb-2">Invite Friends</h1>
          <p className="text-gaming-300">Share CLIPT with your friends and game together</p>
        </div>
        
        <div className="mb-6">
          <h2 className="text-gaming-100 font-semibold mb-2">Share Your Invite Link</h2>
          <div className="flex items-center gap-2 mb-4">
            <Input 
              value={inviteLink} 
              readOnly 
              className="bg-gaming-800 border-gaming-600"
            />
            <Button variant="outline" onClick={handleCopyLink} className="shrink-0">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            variant="default" 
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            onClick={handleShareButton}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Invite Link
          </Button>
        </div>
        
        <div>
          <h2 className="text-gaming-100 font-semibold mb-2">Email Invitation</h2>
          <form onSubmit={handleEmailInvite} className="space-y-4">
            <Input
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gaming-800 border-gaming-600"
            />
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {isLoading ? (
                "Sending..."
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </form>
        </div>
      </Card>
      
      <div className="text-center">
        <p className="text-gaming-400 text-sm mb-4">
          When friends join using your link, they'll automatically follow you!
        </p>
        <Button variant="outline" onClick={() => navigate('/profile')} className="text-gaming-200">
          Back to Profile
        </Button>
      </div>
    </div>
  );
};

export default InviteFriends;
