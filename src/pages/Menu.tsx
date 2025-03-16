
import React from 'react';
import AppSidebar from '@/components/AppSidebar';
import { useNavigate } from 'react-router-dom';

const Menu = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-[#0f0b23] flex flex-col">
      <AppSidebar 
        isVisible={true} 
        onClose={() => navigate(-1)} 
      />
    </div>
  );
};

export default Menu;
