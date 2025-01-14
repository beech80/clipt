import PostForm from "@/components/PostForm";
import PostList from "@/components/PostList";

const Home = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PostForm />
      <PostList />
    </div>
  );
};

export default Home;