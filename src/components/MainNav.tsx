
import { Link } from "react-router-dom";
import { Home, MessageSquare, LineChart, Video, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function MainNav() {
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="container mx-auto px-4">
        <div className="flex justify-around py-2">
          <Link to="/" className="flex flex-col items-center p-2 hover:text-primary">
            <Home className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>

          {user && (
            <>
              <Link to="/messages" className="flex flex-col items-center p-2 hover:text-primary">
                <MessageSquare className="w-6 h-6" />
                <span className="text-xs">Messages</span>
              </Link>

              <Link to="/progress" className="flex flex-col items-center p-2 hover:text-primary">
                <LineChart className="w-6 h-6" />
                <span className="text-xs">Progress</span>
              </Link>

              <Link to="/posts" className="flex flex-col items-center p-2 hover:text-primary">
                <Video className="w-6 h-6" />
                <span className="text-xs">Posts</span>
              </Link>

              <Link to="/profile" className="flex flex-col items-center p-2 hover:text-primary">
                <User className="w-6 h-6" />
                <span className="text-xs">Profile</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
