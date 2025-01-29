import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface UserSearchProps {
  onSelect: (userId: string) => void;
  onRemove: (userId: string) => void;
  selectedUsers: string[];
}

export function UserSearch({ onSelect, onRemove, selectedUsers }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSelectedUsers = async () => {
      if (selectedUsers.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', selectedUsers);
        
        if (data) {
          setSelectedUserDetails(data);
        }
      }
    };

    fetchSelectedUsers();
  }, [selectedUsers]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${query}%`)
      .neq('id', user?.id)
      .limit(5);

    if (error) {
      console.error('Error searching users:', error);
      return;
    }

    setSearchResults(data || []);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedUserDetails.map((user) => (
          <Badge 
            key={user.id}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            {user.username}
            <button
              onClick={() => onRemove(user.id)}
              className="ml-1 hover:text-destructive"
            >
              ×
            </button>
          </Badge>
        ))}
      </div>
      <Input
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {searchResults.length > 0 && (
        <div className="border rounded-md shadow-sm">
          {searchResults.map((result) => (
            <button
              key={result.id}
              className="w-full flex items-center gap-2 p-2 hover:bg-accent transition-colors"
              onClick={() => {
                onSelect(result.id);
                setSearchQuery("");
                setSearchResults([]);
              }}
              disabled={selectedUsers.includes(result.id)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={result.avatar_url || undefined} />
                <AvatarFallback>{result.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>{result.username}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}