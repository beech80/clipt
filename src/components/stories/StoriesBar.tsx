import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StoryCreator } from "./StoryCreator";
import { StoryViewer } from "./StoryViewer";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  text_content?: string;
  background_color?: string;
  font_style?: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

interface StoryGroup {
  user_id: string;
  username: string;
  avatar_url: string;
  stories: Story[];
}

export const StoriesBar = () => {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StoryGroup | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const { user } = useAuth();

  const fetchStories = async () => {
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
        profiles (
          username,
          avatar_url
        )
      `)
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stories:', error);
      return;
    }

    // Group stories by user
    const groups = data.reduce<StoryGroup[]>((acc, story) => {
      const existingGroup = acc.find(g => g.user_id === story.user_id);
      if (existingGroup) {
        existingGroup.stories.push(story as Story);
      } else {
        acc.push({
          user_id: story.user_id,
          username: story.profiles.username,
          avatar_url: story.profiles.avatar_url,
          stories: [story as Story]
        });
      }
      return acc;
    }, []);

    setStoryGroups(groups);
  };

  useEffect(() => {
    fetchStories();

    // Subscribe to new stories
    const channel = supabase
      .channel('stories_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'stories' },
        fetchStories
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="py-4">
      <ScrollArea className="w-full">
        <div className="flex gap-4 px-4">
          {user && (
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="w-16 h-16 ring-2 ring-offset-2 ring-primary">
                  <AvatarImage src={user.user_metadata.avatar_url} />
                  <AvatarFallback>
                    {user.user_metadata.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <StoryCreator onSuccess={fetchStories} />
                </div>
              </div>
              <span className="mt-4 text-sm">Your Story</span>
            </div>
          )}

          {storyGroups.map((group) => (
            <button
              key={group.user_id}
              className="flex flex-col items-center"
              onClick={() => {
                setSelectedGroup(group);
                setCurrentStoryIndex(0);
              }}
            >
              <Avatar className="w-16 h-16 ring-2 ring-offset-2 ring-primary">
                <AvatarImage src={group.avatar_url} />
                <AvatarFallback>{group.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="mt-2 text-sm">{group.username}</span>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {selectedGroup && (
        <StoryViewer
          stories={selectedGroup.stories}
          currentIndex={currentStoryIndex}
          onIndexChange={setCurrentStoryIndex}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
};