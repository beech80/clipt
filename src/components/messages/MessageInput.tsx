import { useState } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
}

export function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        className="bg-gaming-800/50 border-gaming-600/20 text-white placeholder:text-gaming-400"
      />
      <Button 
        onClick={handleSend}
        className="gaming-button"
        disabled={!message.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}