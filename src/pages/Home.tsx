import PostForm from "@/components/PostForm";
import PostList from "@/components/PostList";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-8 px-4">
        <div className="max-w-2xl text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-gaming-600 to-gaming-800">
            Welcome to GameShare
          </h1>
          <p className="text-xl text-muted-foreground">
            Share your gaming moments, connect with fellow gamers, and build your gaming community.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/login")}
            className="mt-4"
          >
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl w-full mt-8">
          <img
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e"
            alt="Gaming Setup"
            className="rounded-lg shadow-lg object-cover h-48 w-full"
          />
          <img
            src="https://images.unsplash.com/photo-1511512578047-dfb367046420"
            alt="Gaming Community"
            className="rounded-lg shadow-lg object-cover h-48 w-full"
          />
          <img
            src="https://images.unsplash.com/photo-1493711662062-fa541adb3fc8"
            alt="Gaming Moment"
            className="rounded-lg shadow-lg object-cover h-48 w-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PostForm />
      <PostList />
    </div>
  );
};

export default Home;