import React from "react";

const TopClips = () => {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white">
            WEEKLY TOP CLIPS
          </h1>
        </div>
      </div>

      <div className="pt-24 space-y-8">
        <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto px-4">
          {/* Empty state - ready for testing */}
        </div>
      </div>
    </div>
  );
};

export default TopClips;
