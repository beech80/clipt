
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const gamingPhotos = [
  {
    id: 1,
    url: '/lovable-uploads/de4393f2-b28b-408e-b6b1-db014cbc978e.png',
    title: 'Gaming Setup',
    description: 'Professional gaming station'
  },
  {
    id: 2,
    url: '/lovable-uploads/de4393f2-b28b-408e-b6b1-db014cbc978e.png',
    title: 'Esports Arena',
    description: 'Competitive gaming environment'
  },
  {
    id: 3,
    url: '/lovable-uploads/de4393f2-b28b-408e-b6b1-db014cbc978e.png',
    title: 'Gaming Community',
    description: 'Players united in gaming'
  }
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1A1F2C] bg-gradient-to-b from-gaming-900/50 to-gaming-800/30">
      <div className="container mx-auto px-4 py-8">
        {!user ? (
          <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
            <h1 className="text-4xl font-bold gaming-gradient">Welcome to Clipt</h1>
            <p className="text-xl text-muted-foreground text-center max-w-lg">
              Your ultimate gaming community platform. Share, discover, and celebrate gaming moments.
            </p>
            <Button onClick={() => navigate('/login')} className="gaming-button">
              Join the Community
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold gaming-gradient text-center">
              Gaming Community Highlights
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gamingPhotos.map((photo) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="group relative overflow-hidden rounded-lg gaming-card"
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-xl font-bold text-white">{photo.title}</h3>
                      <p className="text-sm text-gray-300">{photo.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center mt-8">
              <Button 
                onClick={() => navigate('/clipts')} 
                className="gaming-button text-lg"
              >
                View Gaming Clipts
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
