import { SEO } from "@/components/SEO";
import { GameChatbot } from "@/components/chatbot/GameChatbot";

export default function GamingAssistant() {
  return (
    <div className="container mx-auto p-6">
      <SEO 
        title="Gaming Assistant | Clip"
        description="Get help with game strategies, lore, achievements and more from our AI gaming assistant"
      />
      <h1 className="text-3xl font-bold mb-6">Gaming Assistant</h1>
      <div className="max-w-3xl mx-auto">
        <GameChatbot />
      </div>
    </div>
  );
}