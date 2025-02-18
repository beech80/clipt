
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import GameBoyControls from '@/components/GameBoyControls';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your gaming AI assistant. I have extensive knowledge about all aspects of gaming including:\n\n" +
        "🎮 Game mechanics, strategies, and meta\n" +
        "📚 Gaming history and development\n" +
        "🏆 Esports and competitive gaming\n" +
        "📖 Game lore and storylines\n" +
        "💻 Technical aspects and hardware\n" +
        "📈 Gaming industry trends\n" +
        "🏃 Speedrunning techniques\n" +
        "🛠️ Game modifications and custom content\n" +
        "🌐 Gaming communities and culture\n\n" +
        "I can also help you grow as a content creator with advice on:\n" +
        "📹 YouTube gaming channel growth\n" +
        "🎥 Streaming best practices\n" +
        "🎬 Video editing and production\n" +
        "📱 Social media presence\n" +
        "💡 Content strategy and planning\n" +
        "🎯 Building your gaming brand\n\n" +
        "How can I assist you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('gaming-ai-chat', {
        body: { message: userMessage, history: messages }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to get response from AI assistant",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#1A1F2C]">
      {/* Header with Back Button */}
      <div className="gameboy-header flex items-center justify-between px-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/')}
          className="text-[#1A1F2C] hover:text-[#1A1F2C]/80"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-[#1A1F2C]" />
          <h1 className="gameboy-title">Gaming AI Assistant</h1>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 gaming-cartridge mx-4 mt-6 mb-2">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  message.role === 'assistant'
                    ? 'gaming-card bg-gaming-800 text-gaming-100'
                    : 'gaming-card bg-gaming-400 text-black'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area - More prominent styling */}
      <div className="px-4 mb-4 mt-2">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-center bg-[#2A2F3C] p-3 rounded-xl border-2 border-purple-500/50 shadow-lg">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the Gaming AI Assistant..."
              className="flex-1 bg-[#2A2F3C] border-none text-white placeholder:text-purple-300 text-lg h-12 focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading}
              className="gaming-button bg-purple-500 hover:bg-purple-600 text-white h-12 px-6 rounded-lg"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>

      <GameBoyControls />
    </div>
  );
}
