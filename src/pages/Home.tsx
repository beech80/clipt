import PostForm from "@/components/PostForm";
import PostList from "@/components/PostList";
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
          <h1 className="text-6xl font-bold tracking-tight gaming-gradient animate-pulse">
            CLIP
          </h1>
          <p className="text-xl text-purple-300">
            Share your gaming moments
          </p>
          <button 
            onClick={() => navigate("/login")}
            className="mt-8 px-8 py-4 text-xl gaming-button hover:bg-purple-700 transition-all duration-300 animate-glow"
          >
            Get Started <ArrowRight className="inline-block ml-2 h-6 w-6" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-200px)] relative">
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4">
        <div className="flex justify-center items-center gap-4">
          <span className="text-purple-300 font-medium">Following</span>
          <span className="text-white/60">|</span>
          <span className="text-white font-medium">For You</span>
        </div>
      </div>
      <PostForm />
      <div className="snap-y snap-mandatory overflow-y-auto h-full">
        <PostList />
      </div>
    </div>
  );
};

export default Home;