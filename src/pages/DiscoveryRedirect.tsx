import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DiscoveryRedirect: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Navigate to the Discovery page immediately
    navigate('/discover');
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Discovery Page...</h1>
        <p>If you're not redirected automatically, <button 
          onClick={() => navigate('/discover')}
          className="text-orange-500 underline"
        >
          click here
        </button></p>
      </div>
    </div>
  );
};

export default DiscoveryRedirect;
