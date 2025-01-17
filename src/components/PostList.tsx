import { useInfiniteQuery } from "@tanstack/react-query";
import PostItem from "./PostItem";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

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
  categories: {
    name: string;
    slug: string;
  }[];
}

const PostList = () => {
  const { ref, inView } = useInView();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<{ name: string; slug: string; }[]>([]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('post_categories')
        .select('name, slug')
        .order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['posts', selectedCategory],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          likes:likes (
            count
          ),
          clip_votes:clip_votes (
            count
          ),
          categories:post_category_mappings(
            post_categories(name, slug)
          )
        `)
        .order('created_at', { ascending: false })
        .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1);

      if (selectedCategory) {
        query = query.in('id', 
          supabase
            .from('post_category_mappings')
            .select('post_id')
            .eq('category_id', 
              supabase
                .from('post_categories')
                .select('id')
                .eq('slug', selectedCategory)
            )
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
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
    <div>
      <div className="flex items-center gap-2 mb-4 px-4">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.slug} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="post-container relative h-[calc(100vh-200px)] overflow-y-auto snap-y snap-mandatory scroll-smooth">
        {data.pages.map((page, i) => (
          page.map((post) => (
            <div key={post.id} className="snap-start snap-always h-[calc(100vh-200px)]">
              <PostItem 
                post={{
                  ...post,
                  likes_count: post.likes?.[0]?.count || 0,
                  clip_votes: post.clip_votes || [],
                  categories: post.categories?.map(c => c.post_categories) || []
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
    </div>
  );
};

export default PostList;