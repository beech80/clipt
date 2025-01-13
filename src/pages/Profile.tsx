import { Settings, Edit, Grid, Bookmark, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const MOCK_USER = {
  username: "ProGamer123",
  bio: "Professional Fortnite player | Content Creator",
  followers: 1234,
  following: 567,
  posts: 89,
  avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop",
  banner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop",
};

const MOCK_POSTS = [
  { id: 1, image: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=300&h=300&fit=crop" },
  { id: 2, image: "https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=300&h=300&fit=crop" },
  { id: 3, image: "https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?w=300&h=300&fit=crop" },
];

const Profile = () => {
  const handleEditProfile = () => {
    toast.info("Edit profile coming soon!");
  };

  const handleSettings = () => {
    toast.info("Settings coming soon!");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Banner */}
      <div className="relative h-48 rounded-lg overflow-hidden">
        <img 
          src={MOCK_USER.banner}
          alt="Profile banner"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Profile Info */}
      <div className="gaming-card relative -mt-20 z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 rounded-full bg-gaming-700 ring-4 ring-background overflow-hidden">
              <img 
                src={MOCK_USER.avatar}
                alt={MOCK_USER.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{MOCK_USER.username}</h1>
              <p className="text-sm text-muted-foreground">{MOCK_USER.bio}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEditProfile}>
              <Edit className="h-4 w-4 mr-2" /> Edit Profile
            </Button>
            <Button variant="outline" size="icon" onClick={handleSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center mb-6">
          <div className="gaming-card p-4">
            <div className="text-2xl font-bold">{MOCK_USER.posts}</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </div>
          <div className="gaming-card p-4">
            <div className="text-2xl font-bold">{MOCK_USER.followers}</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </div>
          <div className="gaming-card p-4">
            <div className="text-2xl font-bold">{MOCK_USER.following}</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </div>
        </div>

        <Tabs defaultValue="posts">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="posts">
              <Grid className="h-4 w-4 mr-2" /> Posts
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Bookmark className="h-4 w-4 mr-2" /> Saved
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Trophy className="h-4 w-4 mr-2" /> Achievements
            </TabsTrigger>
            <TabsTrigger value="following">
              <Users className="h-4 w-4 mr-2" /> Following
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <div className="grid grid-cols-3 gap-4">
              {MOCK_POSTS.map((post) => (
                <div key={post.id} className="aspect-square rounded-lg overflow-hidden">
                  <img 
                    src={post.image}
                    alt="Post"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <div className="text-center py-8 text-muted-foreground">
              No saved posts yet
            </div>
          </TabsContent>

          <TabsContent value="achievements">
            <div className="text-center py-8 text-muted-foreground">
              Achievements coming soon
            </div>
          </TabsContent>

          <TabsContent value="following">
            <div className="text-center py-8 text-muted-foreground">
              Following list coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;