import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Story } from '@/types/story';
import { Card } from '@/components/ui/card';

export function StoriesBar() {
  const { data: stories } = useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          id,
          user_id,
          media_url,
          media_type,
          text_content,
          background_color,
          font_style,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('is_expired', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match the Story type
      return data.map(story => ({
        ...story,
        profiles: story.profiles || { username: '', avatar_url: '' }
      })) as Story[];
    }
  });

  return (
    <div className="flex space-x-4 overflow-x-auto p-4">
      {stories?.map(story => (
        <Card key={story.id} className="flex-shrink-0 w-40">
          <img src={story.media_url} alt={story.text_content || ''} className="w-full h-24 object-cover rounded-md" />
          <div className="p-2">
            <h3 className="text-sm font-semibold">{story.profiles.username}</h3>
            <p className="text-xs text-muted-foreground">{story.text_content}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
