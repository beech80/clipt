import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function GameChatbot() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<{ message: string; response: string; }[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('game-chatbot', {
        body: { message }
      });

      if (error) throw error;

      setConversation(prev => [...prev, { message, response: data.response }]);
      
      // Store conversation in database
      await supabase.from('chatbot_conversations').insert({
        message,
        response: data.response,
        game_context: data.gameContext
      });

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to get response from chatbot');
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="text-xl font-bold mb-4">Game Assistant</div>
      
      <div className="h-[400px] overflow-y-auto space-y-4 mb-4">
        {conversation.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="bg-secondary/50 p-3 rounded-lg">
              <p className="font-semibold">You:</p>
              <p>{item.message}</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg">
              <p className="font-semibold">Assistant:</p>
              <p>{item.response}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask me anything about games..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </Card>
  );
}