import { useInfiniteQuery } from "@tanstack/react-query";
import PostItem from "./PostItem";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";

const POSTS_PER_PAGE = 5;

interface Post {
  id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes: { count: number }[];
  clip_votes: { count: number }[];
}

// Sample data for testing with proper UUIDs
const samplePosts: Post[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    content: 'Just finished an epic gaming session! 🎮 #gaming #streamer',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80',
    video_url: null,
    created_at: new Date().toISOString(),
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    profiles: {
      username: 'gamergirl',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80'
    },
    likes: [{ count: 42 }],
    clip_votes: [{ count: 15 }]
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    content: 'Check out this amazing gameplay! 🏆 #esports #competitive',
    image_url: null,
    video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    created_at: new Date().toISOString(),
    user_id: '123e4567-e89b-12d3-a456-426614174003',
    profiles: {
      username: 'proplayer',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80'
    },
    likes: [{ count: 128 }],
    clip_votes: [{ count: 45 }]
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174004',
    content: 'New gaming setup complete! What do you think? 🖥️ #setup #battlestation',
    image_url: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&q=80',
    video_url: null,
    created_at: new Date().toISOString(),
    user_id: '123e4567-e89b-12d3-a456-426614174005',
    profiles: {
      username: 'techie_gamer',
      avatar_url: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80'
    },
    likes: [{ count: 89 }],
    clip_votes: [{ count: 23 }]
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174006',
    content: 'Late night streaming vibes 🌙 #latenight #twitchstreamer',
    image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80',
    video_url: null,
    created_at: new Date().toISOString(),
    user_id: '123e4567-e89b-12d3-a456-426614174007',
    profiles: {
      username: 'nightowl',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80'
    },
    likes: [{ count: 156 }],
    clip_votes: [{ count: 67 }]
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174008',
    content: 'Epic win in ranked! 🏆 #victory #gaming',
    image_url: null,
    video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    created_at: new Date().toISOString(),
    user_id: '123e4567-e89b-12d3-a456-426614174009',
    profiles: {
      username: 'rankstar',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80'
    },
    likes: [{ count: 234 }],
    clip_votes: [{ count: 89 }]
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174010',
    content: 'New RGB setup looking fire 🔥 #rgb #gaming #setup',
    image_url: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&q=80',
    video_url: null,
    created_at: new Date().toISOString(),
    user_id: '123e4567-e89b-12d3-a456-426614174011',
    profiles: {
      username: 'rgbmaster',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80'
    },
    likes: [{ count: 178 }],
    clip_votes: [{ count: 56 }]
  }
];

const PostList = () => {
  const { ref, inView } = useInView();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: async ({ pageParam = 0 }) => {
      // For testing purposes, return sample data
      return samplePosts;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage || lastPage.length < POSTS_PER_PAGE) return undefined;
      return pages.length;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (status === "pending") {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-gaming-400" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <p className="text-red-500">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="post-container relative h-[calc(100vh-200px)] overflow-y-auto snap-y snap-mandatory scroll-smooth">
      {data.pages.map((page, i) => (
        page.map((post) => (
          <div key={post.id} className="snap-start snap-always h-[calc(100vh-200px)]">
            <PostItem 
              post={{
                ...post,
                likes_count: post.likes?.[0]?.count || 0,
                clip_votes: post.clip_votes || []
              }} 
            />
          </div>
        ))
      ))}
      {hasNextPage && (
        <div
          ref={ref}
          className="flex justify-center p-4"
        >
          {isFetchingNextPage && (
            <Loader2 className="w-6 h-6 animate-spin text-gaming-400" />
          )}
        </div>
      )}
    </div>
  );
};

export default PostList;
