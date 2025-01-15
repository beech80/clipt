import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const EditProfile = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      // Set initial values
      setUsername(data.username || "");
      setDisplayName(data.display_name || "");
      setBio(data.bio || "");
      setWebsite(data.website || "");
      setAvatarUrl(data.avatar_url || "");
      
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        display_name: displayName,
        bio,
        website,
        avatar_url: avatarUrl,
      })
      .eq('id', user.id);

    if (error) {
      toast.error("Failed to update profile");
      return;
    }

    toast.success("Profile updated successfully");
    navigate('/profile');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="gaming-card">
        <h1 className="text-2xl font-bold gaming-gradient mb-6">Edit Profile</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="gaming-input"
              placeholder="Your username"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="gaming-input"
              placeholder="Your display name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="gaming-input min-h-[100px]"
              placeholder="Tell us about yourself"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Website</label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="gaming-input"
              placeholder="Your website URL"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Avatar URL</label>
            <Input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="gaming-input"
              placeholder="URL to your avatar image"
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              className="gaming-button w-full"
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gaming-button-secondary w-full"
              onClick={() => navigate('/profile')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;