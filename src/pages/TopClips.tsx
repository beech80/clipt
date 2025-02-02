import { SEO } from "@/components/SEO";
import GameBoyControls from "@/components/GameBoyControls";

const TopClips = () => {
  return (
    <div className="container mx-auto p-6 pb-[200px] min-h-screen bg-[#1A1F2C]">
      <SEO 
        title="Top Clips | Gaming Platform"
        description="View the most popular gaming clips"
      />
      <div className="gameboy-header">
        <h1 className="gameboy-title">TOP CLIPS</h1>
      </div>
      
      <div className="mt-20 space-y-6">
        <div className="gaming-cartridge p-6 bg-gaming-900/95 border border-gaming-400/30 backdrop-blur-sm rounded-lg">
          <p className="text-gaming-400 text-center">Top clips coming soon!</p>
        </div>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default TopClips;
