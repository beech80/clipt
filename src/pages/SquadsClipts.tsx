import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Users, ChevronLeft } from 'lucide-react';

const SquadsClipts = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f112a] text-white pt-16">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-[#141644] border-b-4 border-[#4a4dff] shadow-[0_4px_0_0_#000]">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-[#252968]"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-white flex items-center pixel-font retro-text-shadow">
            <Users className="h-5 w-5 mr-2 text-purple-400" />
            SQUADS CLIPTS
          </h1>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8 pb-32">
        <div className="retro-border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-purple-400 pixel-font retro-text-shadow">YOUR SQUAD'S CONTENT</h2>
          <p className="text-gray-300 mb-4">View and manage clipts from your gaming squad members.</p>
          
          {/* Placeholder content - would be replaced with actual squad clipts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="retro-menu-item p-4 border-2 border-[#4a4dff] bg-[#1a1d45]">
                <div className="bg-gray-800 h-32 w-full mb-2 flex items-center justify-center">
                  <span className="text-gray-500">Squad Clipt #{item}</span>
                </div>
                <h3 className="text-lg font-bold pixel-font">Squad Moment #{item}</h3>
                <p className="text-gray-400 text-sm">From Squad Member #{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SquadsClipts;
