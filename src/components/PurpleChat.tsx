import { useState, useEffect, useRef } from "react";
import { ArrowLeft, MoreVertical, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import "../styles/purple-chat.css";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
  chat_id: string;
}

interface ChatUser {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

interface PurpleChatProps {
  chatId: string;
  recipientId: string;
  onBack: () => void;
}

const PurpleChat = ({ chatId, recipientId, onBack }: PurpleChatProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipient, setRecipient] = useState<ChatUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch recipient details
  useEffect(() => {
    const fetchRecipient = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .eq("id", recipientId)
          .single();

        if (error) {
          console.error("Error fetching recipient:", error);
          return;
        }

        setRecipient(data);
      } catch (error) {
        console.error("Error fetching recipient:", error);
      }
    };

    fetchRecipient();
  }, [recipientId]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching messages:", error);
          return;
        }

        setMessages(data || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((current) => [...current, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [chatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const message = {
        chat_id: chatId,
        sender_id: user.id,
        recipient_id: recipientId,
        message: newMessage.trim(),
      };

      const { error } = await supabase.from("messages").insert([message]);

      if (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
        return;
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="purple-chat-container">
      {/* Chat Header */}
      <div className="purple-chat-header">
        <button onClick={onBack} className="purple-back-button">
          <ArrowLeft size={20} />
        </button>
        <div className="purple-chat-title">
          {recipient?.display_name || recipient?.username || "Chat"}
        </div>
        <button className="purple-back-button">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="purple-messages-container">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/70">
            <p>No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={
                msg.sender_id === user?.id
                  ? "message-bubble-sent"
                  : "message-bubble-received"
              }
            >
              {msg.sender_id !== user?.id && (
                <div className="purple-avatar">
                  <Avatar>
                    <AvatarImage
                      src={
                        recipient?.avatar_url ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${
                          recipient?.username || "?"
                        }`
                      }
                      alt={recipient?.username || "User"}
                    />
                    <AvatarFallback className="purple-avatar-fallback">
                      {(recipient?.username || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              <div>
                <p className="message-content">{msg.message}</p>
                <p className="message-time">{formatTime(msg.created_at)}</p>
              </div>

              {msg.sender_id === user?.id && (
                <div className="purple-avatar">
                  <Avatar>
                    <AvatarImage
                      src={
                        user?.user_metadata?.avatar_url ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${
                          user?.email || "?"
                        }`
                      }
                      alt="You"
                    />
                    <AvatarFallback className="purple-avatar-fallback">
                      {(user?.email || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="purple-input-container">
        <textarea
          className="purple-message-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="purple-send-button"
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default PurpleChat;
