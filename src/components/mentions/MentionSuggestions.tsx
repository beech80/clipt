import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { searchUsers } from "@/utils/mentionUtils";

interface MentionSuggestionsProps {
  searchTerm: string;
  onSelect: (username: string) => void;
}

const MentionSuggestions = ({ searchTerm, onSelect }: MentionSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length > 0) {
        const users = await searchUsers(searchTerm);
        setSuggestions(users);
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [searchTerm]);

  if (suggestions.length === 0) return null;

  return (
    <div className="absolute z-10 mt-1 w-64 bg-gaming-800 rounded-lg shadow-lg border border-gaming-700">
      {suggestions.map((user) => (
        <button
          key={user.id}
          className="w-full flex items-center gap-2 p-2 hover:bg-gaming-700 transition-colors"
          onClick={() => onSelect(user.username)}
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-gaming-100">@{user.username}</span>
        </button>
      ))}
    </div>
  );
};

export default MentionSuggestions;