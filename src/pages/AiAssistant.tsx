import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your gaming AI assistant. How can I help you today?"
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
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      console.log('Sending message to AI:', userMessage);
      
      const { data, error } = await supabase.functions.invoke('gaming-ai-chat', {
        body: { 
          message: userMessage,
          history: messages.slice(-5) // Send last 5 messages for context
        }
      });

      console.log('AI Response:', data);
      console.log('Error if any:', error);

      if (error) {
        throw new Error(error.message || 'Failed to get response from AI');
      }

      if (!data?.response) {
        throw new Error('No response received from AI');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response from AI assistant",
        variant: "destructive"
      });
      
      // Add error message to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I encountered an error. Please try again or contact support if the issue persists." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#1A1F2C]">
      {/* Header */}
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
      <ScrollArea className="flex-1 p-4 gaming-cartridge mx-4 mt-6 mb-[250px] sm:mb-[270px]">
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

      {/* Input Area */}
      <div className="fixed bottom-[220px] sm:bottom-[240px] left-0 right-0 px-4 py-4 bg-[#1A1F2C] border-t border-purple-500/50">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? "AI is thinking..." : "Type your message here..."}
              className="flex-1 bg-[#2A2F3C] border-2 border-purple-500 text-white placeholder:text-purple-300 text-lg h-12 focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-purple-500 hover:bg-purple-600 text-white h-12 px-6 rounded-lg flex items-center gap-2"
            >
              {isLoading ? 'Thinking...' : 'Send'}
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-8">
            {/* Add your content here */}
          </div>
        </div>
      </div>
      
    </div>
  );
}
