import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface HashtagSuggestionsProps {
  searchTerm: string;
  onSelect: (hashtag: string) => void;
}

const HashtagSuggestions = ({ searchTerm, onSelect }: HashtagSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<{ name: string }[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchTerm) {
        setSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('hashtags')
        .select('name')
        .ilike('name', `${searchTerm}%`)
        .limit(5);

      if (error) {
        console.error('Error fetching hashtag suggestions:', error);
        return;
      }

      setSuggestions(data || []);
    };

    fetchSuggestions();
  }, [searchTerm]);

  if (!searchTerm || suggestions.length === 0) return null;

  return (
    <div className="absolute z-10 w-full max-w-md bg-background border border-border rounded-md shadow-lg mt-1">
      <ul className="py-1">
        {suggestions.map((hashtag) => (
          <li
            key={hashtag.name}
            className="px-4 py-2 hover:bg-accent cursor-pointer text-sm"
            onClick={() => onSelect(hashtag.name)}
          >
            #{hashtag.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HashtagSuggestions;