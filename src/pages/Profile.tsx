import { Settings, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_USER = {
  username: "ProGamer123",
  bio: "Professional Fortnite player | Content Creator",
  followers: 1234,
  following: 567,
  posts: 89,
};

const Profile = () => {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="gaming-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-gaming-700" />
            <div>
              <h1 className="text-xl font-bold">{MOCK_USER.username}</h1>
              <p className="text-sm text-muted-foreground">{MOCK_USER.bio}</p>
            </div>
          </div>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{MOCK_USER.posts}</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{MOCK_USER.followers}</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{MOCK_USER.following}</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </div>
        </div>
        
        <div className="mt-6">
          <Button className="w-full gaming-button">
            <Edit className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;