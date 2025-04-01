import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1C50] to-[#0F1033] text-white overflow-hidden">
      {/* Header */}
      <div className="pt-8 pb-4">
        <h1 className="text-center text-3xl font-bold text-purple-300">
          Squads Clipts
        </h1>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full text-center py-12 px-4">
          <p className="text-xl font-semibold text-purple-300 mb-6">Welcome to Clipts</p>
          <p className="text-gray-400 mb-8">Share your gaming moments with your squad!</p>
          
          <button 
            onClick={() => navigate('/squads')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 rounded-lg font-medium text-white shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            View Squad Content
          </button>
        </div>
      </div>

      {/* Game Controls */}
      <div className="fixed bottom-0 left-0 right-0 p-4">
        <div className="flex items-center justify-between">
          {/* D-Pad */}
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-green-900/50 border border-green-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
          
          {/* Center Button */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">CLIPT</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="relative w-24 h-24">
            <div className="absolute top-1/4 right-1/4 w-10 h-10 rounded-full bg-blue-900 border border-blue-400 flex items-center justify-center">
              <span className="text-xs">D</span>
            </div>
            <div className="absolute bottom-1/4 right-1/4 w-10 h-10 rounded-full bg-red-900 border border-red-400 flex items-center justify-center">
              <span className="text-xs">B</span>
            </div>
            <div className="absolute bottom-1/4 left-1/4 w-10 h-10 rounded-full bg-yellow-900 border border-yellow-400 flex items-center justify-center">
              <span className="text-xs">Y</span>
            </div>
            <div className="absolute top-1/4 left-1/4 w-10 h-10 rounded-full bg-purple-900 border border-purple-400 flex items-center justify-center">
              <span className="text-xs">X</span>
            </div>
          </div>
        </div>
        
        {/* Menu Buttons */}
        <div className="flex justify-center mt-2 space-x-8">
          <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
            <span className="text-sm">≡</span>
          </button>
          <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
            <span className="text-sm">◎</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
