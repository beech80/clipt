import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Eye, MessageSquare } from "lucide-react";

interface PostStatsProps {
  postId: string;
}

const PostStats = ({ postId }: PostStatsProps) => {
  const { data: stats } = useQuery({
    queryKey: ['post-stats', postId],
    queryFn: async () => {
      const [viewsResponse, commentsResponse] = await Promise.all([
        supabase
          .from('post_views')
          .select('count', { count: 'exact' })
          .eq('post_id', postId),
        supabase
          .from('comments')
          .select('count', { count: 'exact' })
          .eq('post_id', postId)
      ]);

      return {
        views: viewsResponse.count || 0,
        comments: commentsResponse.count || 0
      };
    }
  });

  return (
    <div className="flex gap-4 text-sm text-white/70">
      <div className="flex items-center gap-1">
        <Eye className="w-4 h-4" />
        <span>{stats?.views || 0}</span>
      </div>
      <div className="flex items-center gap-1">
        <MessageSquare className="w-4 h-4" />
        <span>{stats?.comments || 0}</span>
      </div>
    </div>
  );
};

export default PostStats;