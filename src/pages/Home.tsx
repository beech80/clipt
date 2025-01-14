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
          <h1 className="text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-purple-800 animate-pulse">
            CLIP
          </h1>
          <p className="text-xl text-purple-300">
            Share your gaming moments
          </p>
          <button 
            onClick={() => navigate("/login")}
            className="mt-8 px-8 py-4 text-xl bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 animate-glow"
          >
            Get Started <ArrowRight className="inline-block ml-2 h-6 w-6" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[500px] mx-auto h-[calc(100vh-80px)] relative">
      <PostForm />
      <div className="mt-4 snap-y snap-mandatory overflow-y-auto h-full">
        <PostList />
      </div>
    </div>
  );
};

export default Home;