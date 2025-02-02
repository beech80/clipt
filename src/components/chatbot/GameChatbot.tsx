import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Gamepad2, Bot } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

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

      toast.success('Response received!');

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to get response from chatbot');
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  return (
    <Card className="p-4 space-y-4 bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50">
      <div className="flex items-center gap-2 text-xl font-bold mb-4 text-gaming-100">
        <Bot className="w-6 h-6 text-gaming-400" />
        <span>Game Assistant</span>
      </div>
      
      <ScrollArea className="h-[400px] pr-4">
        {conversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gaming-400 space-y-4">
            <Gamepad2 className="w-12 h-12" />
            <p className="text-center">
              Ask me anything about games! I can help with strategies, lore, achievements, and more.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversation.map((item, index) => (
              <div key={index} className="space-y-2 animate-fade-in">
                <div className="bg-gaming-700/50 p-3 rounded-lg">
                  <p className="font-semibold text-gaming-200">You:</p>
                  <p className="text-gaming-100">{item.message}</p>
                </div>
                <div className="bg-gaming-600/30 p-3 rounded-lg">
                  <p className="font-semibold text-gaming-200">Assistant:</p>
                  <p className="text-gaming-100">{item.response}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask me anything about games..."
          disabled={isLoading}
          className="bg-gaming-700/50 border-gaming-600 text-gaming-100 placeholder:text-gaming-400"
        />
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-gaming-600 hover:bg-gaming-500 text-white"
        >
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