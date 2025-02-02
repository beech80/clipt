import { SEO } from "@/components/SEO";
import GameBoyControls from "@/components/GameBoyControls";

const Streaming = () => {
  return (
    <div className="container mx-auto p-6 pb-[200px] min-h-screen bg-[#1A1F2C]">
      <SEO 
        title="Streaming | Gaming Platform"
        description="Start streaming your gameplay"
      />
      <div className="gameboy-header">
        <h1 className="gameboy-title">STREAMING</h1>
      </div>
      
      <div className="mt-20 space-y-6">
        <div className="gaming-cartridge p-6 bg-gaming-900/95 border border-gaming-400/30 backdrop-blur-sm rounded-lg">
          <p className="text-gaming-400 text-center">Streaming features coming soon!</p>
        </div>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Streaming;