import React, { useState } from "react";
import { BackButton } from "@/components/ui/back-button";
import { Trophy } from "lucide-react";

const TopClips = () => {
  const [activeTab, setActiveTab] = useState('trending');

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-black text-white pb-20">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-indigo-950 to-purple-900 backdrop-blur-md border-b border-indigo-800 shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <BackButton />
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">
              <Trophy className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Top Clipts</h1>
          </div>
          <div className="w-10"></div> {/* Empty div for spacing */}
        </div>
      </div>

      {/* Main content with padding for fixed header */}
      <div className="pt-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="bg-indigo-950/30 rounded-lg p-2 mb-6 inline-flex">
          <button 
            className={`px-4 py-1 rounded-md ${activeTab === 'trending' ? 'bg-indigo-700/70 text-white' : 'text-indigo-300'} flex items-center mr-2`}
            onClick={() => setActiveTab('trending')}
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12L7 8M7 8L11 12M7 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 16L17 12M17 12L21 16M17 12V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Trending
          </button>
          <button 
            className={`px-4 py-1 rounded-md ${activeTab === 'this-week' ? 'bg-indigo-700/70 text-white' : 'text-indigo-300'} flex items-center mr-2`}
            onClick={() => setActiveTab('this-week')}
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            This Week
          </button>
          <button 
            className={`px-4 py-1 rounded-md ${activeTab === 'all-time' ? 'bg-indigo-700/70 text-white' : 'text-indigo-300'} flex items-center`}
            onClick={() => setActiveTab('all-time')}
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15L8.5 8L15.5 8L12 15Z" fill="currentColor"/>
              <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 3L19 10H5L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            All-Time
          </button>
        </div>
        
        {/* Empty grid - just the structure without content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Intentionally empty per user request */}
        </div>
      </div>
    </div>
  );
};

export default TopClips;
