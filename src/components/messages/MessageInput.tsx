import { useState, useEffect } from "react";
import { Send, Smile, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmoteSelector } from "@/components/streaming/EmoteSelector";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  receiverId?: string;
}

export function MessageInput({ onSendMessage, receiverId }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout>();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !receiverId) return;

    const channel = supabase.channel(`typing:${receiverId}`);
    
    // Subscribe to typing indicators
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Typing state:', state);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User started typing:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User stopped typing:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        
        const presenceTrackStatus = await channel.track({
          user_id: user.id,
          typing: false
        });
        console.log(presenceTrackStatus);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, receiverId]);

  const handleTyping = () => {
    if (!user || !receiverId) return;

    setIsTyping(true);
    
    // Update typing status
    const channel = supabase.channel(`typing:${receiverId}`);
    channel.track({
      user_id: user.id,
      typing: true
    });

    // Clear previous timeout
    if (typingTimeout) clearTimeout(typingTimeout);

    // Set new timeout
    const timeout = setTimeout(() => {
      setIsTyping(false);
      channel.track({
        user_id: user.id,
        typing: false
      });
    }, 2000);

    setTypingTimeout(timeout);
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
      setIsTyping(false);
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    }
  };

  const handleEmoteSelect = (emoteName: string) => {
    setMessage(prev => `${prev} :${emoteName}: `);
  };

  const handleAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(filePath);

      onSendMessage(`[Attachment](${publicUrl})`);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  return (
    <div className="p-4 border-t">
      <div className="flex gap-2">
        <EmoteSelector onSelect={handleEmoteSelect} />
        <label className="cursor-pointer">
          <Paperclip className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          <input
            type="file"
            className="hidden"
            onChange={handleAttachment}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          />
        </label>
        <Input
          placeholder="Type a message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1"
        />
        <Button onClick={handleSend} size="icon" variant="default">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}