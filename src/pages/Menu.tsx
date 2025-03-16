
import React from 'react';
import AppSidebar from '@/components/AppSidebar';

const Menu = () => {
  return (
    <div className="min-h-screen bg-[#111111] flex flex-col">
      <AppSidebar />
      <div className="flex-1 pl-64">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white mb-4">Menu</h1>
          <p className="text-gray-400">Select an option from the sidebar to navigate.</p>
        </div>
      </div>
    </div>
  );
};

export default Menu;
