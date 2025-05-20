import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_at: string;
}

export function GroupChatList() {
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchGroups = async () => {
      const { data, error } = await supabase
        .from('group_chats')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error("Failed to load group chats");
        return;
      }

      setGroups(data);
    };

    fetchGroups();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('group_chats')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'group_chats'
      }, () => {
        fetchGroups();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Group Chats</h2>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Group
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {filteredGroups.map((group) => (
          <div
            key={group.id}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
          >
            <Avatar>
              <AvatarImage src={group.avatar_url || undefined} />
              <AvatarFallback>{group.name[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{group.name}</h3>
              {group.description && (
                <p className="text-sm text-muted-foreground">{group.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}