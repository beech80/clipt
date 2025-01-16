import { useEmotes } from "@/contexts/EmoteContext";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";

interface EmoteSelectorProps {
  onSelect: (emoteName: string) => void;
}

export function EmoteSelector({ onSelect }: EmoteSelectorProps) {
  const { emotes } = useEmotes();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid grid-cols-6 gap-2">
          {emotes.map((emote) => (
            <button
              key={emote.id}
              className="p-1 hover:bg-accent rounded"
              onClick={() => onSelect(emote.name)}
            >
              <img
                src={emote.url}
                alt={emote.name}
                className="w-8 h-8"
                title={emote.name}
              />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}