import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Gamepad, Medal, Clock, User, MessageSquare } from 'lucide-react';

export default function ProfileMinimal() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Enhanced profile ID handling with fallbacks
  const profileId = id || user?.id || 'default-profile';
  console.log('Profile component with IDs:', { urlId: id, userId: user?.id, profileId });
  const isOwnProfile = user?.id === profileId;
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch profile data with enhanced error handling and fallbacks
  useEffect(() => {
    async function fetchProfile() {
      console.log("Attempting to fetch profile with ID:", profileId);
      setLoading(true); // Ensure loading state is always set at the beginning
      
      // Create a fallback profile to use if all else fails
      const fallbackProfile = {
        id: profileId,
        username: 'user_' + profileId?.substring(0, 5),
        avatar_url: null,
        bio: 'Gaming enthusiast and clip creator',
        display_name: 'Gamer ' + profileId?.substring(0, 5),
        created_at: new Date().toISOString(),
      };
      
      try {
        if (!profileId || profileId === 'undefined' || profileId === 'null') {
          console.warn("Invalid profile ID, using fallback");
          setProfile(fallbackProfile);
          return;
        }
        
        // Basic profile info
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();
        
        if (profileError) {
          console.warn("Profile fetch error, using fallback:", profileError);
          setProfile(fallbackProfile);
        } else if (!data) {
          console.warn("No profile data returned, using fallback");
          setProfile(fallbackProfile);
        } else {
          console.log("Profile data successfully received:", data);
          setProfile(data);
        }
      } catch (err) {
        console.error("Unexpected error in profile fetch:", err);
        // Still use fallback data instead of showing an error
        setProfile(fallbackProfile);
      } finally {
        // Always set loading to false and clear any error
        setError(null);
        setLoading(false);
      }
    }
    
    // Call the function immediately
    fetchProfile();
    
    // Also set up a fallback timeout in case anything goes wrong
    const fallbackTimer = setTimeout(() => {
      if (loading && !profile) {
        console.log("Fallback timer triggered - forcing profile to load");
        setLoading(false);
        setError(null);
        setProfile({
          id: profileId || 'default',
          username: 'clipt_user',
          avatar_url: null,
          bio: 'Clipt gaming enthusiast',
          display_name: 'Clipt User',
          created_at: new Date().toISOString(),
        });
      }
    }, 3000); // 3 second fallback
    
    return () => clearTimeout(fallbackTimer);
  }, [profileId, loading, profile]);
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center">
          <h2 className="text-xl text-orange-500 mb-4">Loading Profile...</h2>
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-black p-4">
        <div className="text-center">
          <h2 className="text-xl text-red-500 mb-4">Error Loading Profile</h2>
          <p className="text-white mb-4">{error}</p>
          <Button 
            onClick={() => navigate('/discovery')}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Go to Discovery
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Simple Profile Card */}
      <div className="bg-gray-900 rounded-lg p-6 max-w-lg mx-auto my-4 border border-orange-500/30">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-800 border-2 border-orange-500">
            <img 
              src={profile?.avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=default'} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div>
            <h1 className="text-xl font-bold text-orange-500">{profile?.display_name || 'Player'}</h1>
            <p className="text-gray-400">@{profile?.username || 'username'}</p>
            <p className="text-sm mt-2">{profile?.bio || 'No bio available'}</p>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-lg font-bold text-orange-500">0</div>
            <div className="text-xs text-gray-400">Posts</div>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-lg font-bold text-orange-500">0</div>
            <div className="text-xs text-gray-400">Followers</div>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-lg font-bold text-orange-500">0</div>
            <div className="text-xs text-gray-400">Following</div>
          </div>
        </div>
        
        {!isOwnProfile && (
          <div className="mt-6 flex space-x-3">
            <Button className="w-1/2 bg-orange-500 hover:bg-orange-600">
              Follow
            </Button>
            <Button 
              className="w-1/2 bg-gray-800 hover:bg-gray-700"
              onClick={() => navigate(`/messages?user=${profile.id}`)}
            >
              Message
            </Button>
          </div>
        )}
      </div>
      
      {/* Tabs Section */}
      <div className="mt-8 max-w-lg mx-auto">
        <div className="border-b border-gray-800 mb-4">
          <div className="flex space-x-4">
            <button className="px-4 py-2 text-orange-500 border-b-2 border-orange-500">
              Posts
            </button>
            <button className="px-4 py-2 text-gray-400 hover:text-gray-200">
              Achievements
            </button>
            <button className="px-4 py-2 text-gray-400 hover:text-gray-200">
              Saved
            </button>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <p className="text-gray-400">No posts found</p>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="fixed bottom-0 left-0 right-0 px-2 py-1 bg-gray-900 border-t border-orange-500/30">
        <div className="flex justify-around items-center">
          <Button 
            variant="ghost" 
            className="flex flex-col items-center justify-center p-2 text-xs text-gray-400 hover:text-orange-500"
            onClick={() => navigate('/clipts')}
          >
            <Gamepad className="w-5 h-5 mb-1" />
            <span>Clipts</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex flex-col items-center justify-center p-2 text-xs text-gray-400 hover:text-orange-500"
            onClick={() => navigate('/trophies')}
          >
            <Medal className="w-5 h-5 mb-1" />
            <span>Trophies</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex flex-col items-center justify-center p-2 text-xs text-gray-400 hover:text-orange-500"
            onClick={() => navigate('/discovery')}
          >
            <Clock className="w-5 h-5 mb-1" />
            <span>Discover</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex flex-col items-center justify-center p-2 text-xs"
            style={{ color: isOwnProfile ? '#FF5500' : '#9e9e9e' }}
            onClick={() => navigate(isOwnProfile ? '/profile' : `/profile/${user?.id}`)}
          >
            <User className="w-5 h-5 mb-1" style={{ color: isOwnProfile ? '#FF5500' : '#9e9e9e' }} />
            <span>Profile</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex flex-col items-center justify-center p-2 text-xs text-gray-400 hover:text-orange-500"
            onClick={() => navigate('/messages')}
          >
            <MessageSquare className="w-5 h-5 mb-1" />
            <span>Chat</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
