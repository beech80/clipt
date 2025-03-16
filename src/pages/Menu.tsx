
import React from 'react';
import AppSidebar from '@/components/AppSidebar';

const Menu = () => {
  return (
    <div className="min-h-screen bg-[#0f0b23] flex flex-col">
      <AppSidebar isVisible={true} />
      <div className="flex-1 p-6 flex items-center justify-center">
        <h1 className="text-2xl font-bold text-white mb-4">Select an option from the menu</h1>
      </div>
    </div>
  );
};

export default Menu;
