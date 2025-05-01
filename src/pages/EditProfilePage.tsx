import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Upload, Trash2, Link as LinkIcon, Gamepad } from 'lucide-react';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for profile data
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [socialLinks, setSocialLinks] = useState<{platform: string, url: string}[]>([
    { platform: 'Twitter', url: '' },
    { platform: 'Twitch', url: '' },
    { platform: 'YouTube', url: '' }
  ]);
  const [games, setGames] = useState<string[]>([]);
  const [newGame, setNewGame] = useState('');
  const [gameSearchResults, setGameSearchResults] = useState<string[]>([]);
  const [showGameSearch, setShowGameSearch] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [canUpdateUsername, setCanUpdateUsername] = useState(true);
  
  // Fetch profile data on mount - optimized for speed
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      // Show loading state immediately
      setLoading(true);
      
      try {          
        // Fetch only needed profile data to improve performance
        const { data, error } = await supabase
          .from('profiles')
          .select('username, display_name, bio, avatar_url, social_links, games, last_username_change')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Profile fetch error:', error);
          toast.error('Could not load your profile. Please try again.');
          return;
        }
        
        if (data) {
          // Process the profile data
          
          // Process text fields
          setUsername(data.username || '');
          setDisplayName(data.display_name || data.username || '');
          setBio(data.bio || '');
          setAvatarUrl(data.avatar_url || '');
          setAvatarPreview(data.avatar_url || '');
          
          // Process JSON fields - with error handling
          try {
            setSocialLinks(typeof data.social_links === 'string' ? 
              JSON.parse(data.social_links || '[]') : 
              data.social_links || []);
              
            setGames(typeof data.games === 'string' ? 
              JSON.parse(data.games || '[]') : 
              data.games || []);
          } catch (jsonError) {
            console.error('Error parsing JSON fields:', jsonError);
            setSocialLinks([]);
            setGames([]);
          }
          
          // Check if user can update username (only once every 3 months)
          const lastUsernameChange = data.last_username_change
            ? new Date(data.last_username_change)
            : null;
            
          if (lastUsernameChange) {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            
            setLastUpdated(lastUsernameChange);
            
            if (lastUsernameChange > threeMonthsAgo) {
              setCanUpdateUsername(false);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProfile();
  }, [user, navigate]);
  
  // Game search functionality
  const searchGames = async (query: string) => {
    if (!query.trim()) {
      setGameSearchResults([]);
      setShowGameSearch(false);
      return;
    }
    
    setShowGameSearch(true);
    
    // Sample list of popular games - in a real app, this would be an API call
    const popularGames = [
      'Fortnite', 'Call of Duty', 'League of Legends', 'Minecraft', 'Apex Legends',
      'Valorant', 'Grand Theft Auto V', 'Counter-Strike', 'Roblox', 'Dota 2',
      'Overwatch', 'Rainbow Six Siege', 'Rocket League', 'World of Warcraft',
      'Genshin Impact', 'Among Us', 'FIFA 23', 'NBA 2K23', 'Destiny 2',
      'Elden Ring', 'Cyberpunk 2077', 'The Witcher 3', 'Red Dead Redemption 2',
      'Assassin\'s Creed Valhalla', 'The Legend of Zelda', 'Halo Infinite',
      'Battlefield 2042', 'Fall Guys', 'Madden NFL 23', 'Rust',
      'Stardew Valley', 'Animal Crossing', 'Final Fantasy XIV', 'Hearthstone'
    ];
    
    // Filter games based on search query
    const results = popularGames.filter(game => 
      game.toLowerCase().includes(query.toLowerCase())
    );
    
    setGameSearchResults(results);
  };
  
  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    setAvatarFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle social link changes
  const handleSocialLinkChange = (index: number, field: 'platform' | 'url', value: string) => {
    const newLinks = [...socialLinks];
    newLinks[index][field] = value;
    setSocialLinks(newLinks);
  };
  
  // Add a new social link
  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: '', url: '' }]);
  };
  
  // Remove a social link
  const removeSocialLink = (index: number) => {
    const newLinks = [...socialLinks];
    newLinks.splice(index, 1);
    setSocialLinks(newLinks);
  };
  
  // Add a new game
  const addGame = () => {
    if (!newGame.trim()) return;
    
    if (!games.includes(newGame)) {
      setGames([...games, newGame]);
      setNewGame('');
    } else {
      toast.error('This game is already in your list');
    }
  };
  
  // Remove a game
  const removeGame = (game: string) => {
    setGames(games.filter(g => g !== game));
  };
  
  // Save profile changes
  const saveProfile = async () => {
    if (!user?.id) {
      toast.error('User ID not found. Please log in again.');
      return;
    }
    
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    
    // Show saving indicator
    setSaving(true);
    toast.loading('Updating your profile...', { id: 'profile-update' });
    
    try {      
      // Upload avatar if changed - only if file is actually provided
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        try {
          const fileExt = avatarFile.name.split('.').pop();
          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile);
            
          if (uploadError) {
            console.error('Avatar upload error:', uploadError);
          } else {
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
              
            newAvatarUrl = publicUrl;
          }
        } catch (uploadErr) {
          console.error('Avatar upload exception:', uploadErr);
          // Continue with profile update even if avatar upload fails
        }
      }
      
      // Directly use a minimal update object
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username,
          bio,
          avatar_url: newAvatarUrl,
          social_links: JSON.stringify(socialLinks),
          games: JSON.stringify(games),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Profile update error:', updateError);
        toast.error('Failed to update profile.', { id: 'profile-update' });
      } else {
        toast.success('Profile updated successfully!', { id: 'profile-update' });
        navigate('/profile'); // Immediate redirect
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.', { id: 'profile-update' });
    } finally {
      setSaving(false);
    }
  };
  
  // Calculate next update date
  const getNextUpdateDate = () => {
    if (!lastUpdated) return 'anytime';
    
    const nextUpdate = new Date(lastUpdated);
    nextUpdate.setMonth(nextUpdate.getMonth() + 3);
    
    return nextUpdate.toLocaleDateString();
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="w-12 h-12 border-4 border-t-orange-500 border-gray-700 rounded-full animate-spin mb-4"></div>
        <p className="text-lg">Loading profile data...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-3xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Edit Profile</h1>
          <div className="flex gap-2">
            <Button 
              variant="ghost"
              onClick={() => navigate('/profile')}
              className="text-gray-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={saveProfile}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </header>
        
        {/* Profile picture */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-3 bg-gray-800 relative">
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt="Avatar preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-orange-500 text-3xl">
                  {displayName?.charAt(0) || username?.charAt(0) || '?'}
                </span>
              </div>
            )}
            
            {!canUpdateUsername && avatarUrl && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs text-center p-2">
                Can update after {getNextUpdateDate()}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <label className={`cursor-pointer py-1 px-3 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-sm flex items-center ${!canUpdateUsername ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Upload size={16} className="mr-1" />
              Change Photo
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarChange}
                disabled={!canUpdateUsername && !!avatarUrl}
              />
            </label>
            
            {avatarUrl && (
              <button 
                className="p-1 text-red-400 hover:text-red-300"
                onClick={() => {
                  setAvatarPreview('');
                  setAvatarFile(null);
                  if (canUpdateUsername || !avatarUrl) {
                    setAvatarUrl('');
                  }
                }}
                disabled={!canUpdateUsername && !!avatarUrl}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          
          {!canUpdateUsername && (
            <p className="text-xs text-orange-400 mt-2 text-center">
              Username and profile picture can only be changed once every 3 months.<br />
              Next change available: {getNextUpdateDate()}
            </p>
          )}
        </div>
        
        {/* Profile info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
            <Input 
              value={displayName}
              placeholder="Your display name"
              className="bg-gray-800 border-gray-700"
              disabled={true}
              readOnly={true}
            />
            <p className="text-xs text-gray-400 mt-1">
              Display name cannot be changed
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <Input 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              className="bg-gray-800 border-gray-700"
              disabled={!canUpdateUsername}
            />
            {!canUpdateUsername && (
              <p className="text-xs text-orange-400 mt-1">
                Username can only be changed once every 3 months.
                Next change available: {getNextUpdateDate()}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
            <Textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself"
              className="bg-gray-800 border-gray-700 min-h-[100px]"
            />
          </div>
          
          {/* Social links */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Social Links</label>
            <div className="space-y-3">
              {socialLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input 
                    value={link.platform}
                    onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                    placeholder="Platform (e.g., Twitter)"
                    className="bg-gray-800 border-gray-700 flex-1"
                  />
                  <div className="flex-[2] flex items-center bg-gray-800 border border-gray-700 rounded-md">
                    <div className="pl-2 text-gray-400">
                      <LinkIcon size={16} />
                    </div>
                    <Input 
                      value={link.url}
                      onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                      placeholder="URL"
                      className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <button 
                    className="p-2 text-red-400 hover:text-red-300"
                    onClick={() => removeSocialLink(index)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-dashed border-gray-600 text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={addSocialLink}
              >
                + Add Social Link
              </Button>
            </div>
          </div>
          
          {/* Games */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Games You Play</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {games.map((game, index) => (
                <div key={index} className="flex items-center bg-gray-800 px-3 py-1 rounded-md">
                  <Gamepad size={14} className="mr-2 text-orange-500" />
                  <span className="text-sm">{game}</span>
                  <button 
                    className="ml-2 text-gray-400 hover:text-white"
                    onClick={() => removeGame(game)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            
            <div className="relative">
              <div className="flex gap-2 mb-1">
                <Input 
                  value={newGame}
                  onChange={(e) => {
                    setNewGame(e.target.value);
                    searchGames(e.target.value);
                  }}
                  placeholder="Search for a game"
                  className="bg-gray-800 border-gray-700"
                  onKeyPress={(e) => e.key === 'Enter' && addGame()}
                  onFocus={() => {
                    if (newGame) searchGames(newGame);
                  }}
                />
                <Button 
                  variant="outline"
                  className="border-orange-500 text-orange-500 hover:bg-orange-500/20"
                  onClick={addGame}
                >
                  Add
                </Button>
              </div>
              
              {/* Game search results */}
              {showGameSearch && gameSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {gameSearchResults.map((game, index) => (
                    <div 
                      key={index}
                      className="flex items-center p-2 hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setNewGame(game);
                        setShowGameSearch(false);
                      }}
                    >
                      <Gamepad size={14} className="mr-2 text-orange-500" />
                      <span>{game}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-gray-400 mt-1">Type to search for games or add your own</p>
            </div>
          </div>
          
          {/* Save button */}
          <Button 
            className="w-full bg-orange-500 hover:bg-orange-600 mt-6"
            onClick={saveProfile}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
}
