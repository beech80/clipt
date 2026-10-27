import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from 'sonner';

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sending && !disabled) {
      const draft = message;
      setSending(true);
      try {
        await onSendMessage(draft.trim());
        setMessage(current => current === draft ? '' : current);
      } catch (cause) {
        toast.error(cause instanceof Error ? cause.message : 'Message was not sent. Your draft is saved.');
      } finally { setSending(false); }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Send a message..."
          aria-label="Chat message"
          maxLength={2000}
          disabled={disabled}
          className="flex-1"
        />
        <Button type="submit" size="icon" aria-label="Send message" disabled={disabled || sending || !message.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
