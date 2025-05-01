import React from 'react';
import { Link } from 'react-router-dom';

const PageNavigator = () => {
  const pages = [
    { name: "Discovery", path: "/discover" },
    { name: "Profile", path: "/profile" },
    { name: "Clipts", path: "/clipts" },
    { name: "Squads Clipts", path: "/squads-clipts" },
    { name: "Top Clipts", path: "/top-clipts" },
    { name: "Game Menu", path: "/game-menu" },
    { name: "Notifications", path: "/notifications" },
    { name: "Messages", path: "/messages" },
    { name: "Settings", path: "/settings" }
  ];

  return (
    <div className="fixed top-0 right-0 z-50 p-4 bg-black/80 rounded-bl-lg">
      <h3 className="text-orange-500 font-bold mb-2">Page Navigator</h3>
      <div className="flex flex-col space-y-2">
        {pages.map((page) => (
          <Link 
            key={page.path} 
            to={page.path} 
            className="text-white hover:text-orange-500 transition-colors"
          >
            {page.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PageNavigator;
