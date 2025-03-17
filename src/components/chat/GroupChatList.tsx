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

interface GroupChatListProps {
  onSelectGroup?: (groupId: string) => void;
}

export function GroupChatList({ onSelectGroup }: GroupChatListProps) {
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
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gaming-100">Chats</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gaming-400" />
        <Input
          className="pl-9 bg-gaming-800 border-gaming-600 focus:border-blue-500 text-gaming-200"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        {filteredGroups.map((group) => (
          <div
            key={group.id}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gaming-700 cursor-pointer border border-transparent hover:border-gaming-600 transition-all"
            onClick={() => onSelectGroup?.(group.id)}
          >
            <Avatar className="border border-gaming-600">
              <AvatarImage src={group.avatar_url || undefined} />
              <AvatarFallback className="bg-gaming-700 text-blue-400">{group.name[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gaming-100 truncate">{group.name}</h3>
              {group.description && (
                <p className="text-sm text-gaming-400 truncate">{group.description}</p>
              )}
            </div>
          </div>
        ))}
        
        {filteredGroups.length === 0 && (
          <div className="py-8 text-center text-gaming-400">
            <p>No chat groups found</p>
          </div>
        )}
      </div>
    </div>
  );
}