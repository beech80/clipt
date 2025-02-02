import { SEO } from "@/components/SEO";
import { GameChatbot } from "@/components/chatbot/GameChatbot";
import GameBoyControls from "@/components/GameBoyControls";

export default function GamingAssistant() {
  return (
    <div className="container mx-auto p-6 pb-[200px]">
      <SEO 
        title="Gaming Assistant | Clip"
        description="Get help with game strategies, lore, achievements and more from our AI gaming assistant"
      />
      <div className="gameboy-header">
        <h1 className="gameboy-title">GAMING ASSISTANT</h1>
      </div>
      
      <div className="max-w-3xl mx-auto mt-20">
        <div className="gaming-cartridge p-4">
          <GameChatbot />
        </div>
      </div>

      <GameBoyControls />
    </div>
  );
}