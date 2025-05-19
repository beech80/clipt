import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Profile } from "@/types/profile";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Settings, Globe, Rocket, Star, Command, Save, Sparkles } from "lucide-react";
import { CosmicProfileForm } from "@/components/profile/CosmicProfileForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Force refetch on component mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    
    // Trigger animation completion after delay
    const timer = setTimeout(() => setAnimationComplete(true), 1500);
    return () => clearTimeout(timer);
  }, [queryClient]);
  
  // Safe fallback to prevent runtime errors
  if (!authUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#050B1F] to-[#0A1232] text-white p-4">
        <Globe className="w-16 h-16 text-purple-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
        <p className="text-indigo-300 mb-4">Please sign in to edit your profile</p>
        <Button 
          onClick={() => navigate('/login')}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Sign In
        </Button>
      </div>
    );
  }
  
  const { data: profile, isLoading, error } = useQuery<Profile>({
    queryKey: ['profile', authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) {
        throw new Error('Not authenticated');
      }

      try {
        console.log('Fetching profile for user ID:', authUser.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          
          // Create default profile if none exists
          if (error.code === 'PGRST116') { // PostgreSQL error for no rows returned
            console.log('Creating default profile...');
            
            const defaultProfile = {
              id: authUser.id,
              username: authUser.email?.split('@')[0] || `user_${Math.random().toString(36).substring(2, 10)}`,
              display_name: authUser.user_metadata?.name || 'Cosmic Traveler',
              bio: 'Welcome to my cosmic journey!',
              avatar_url: authUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${authUser.id}`,
              created_at: new Date().toISOString(),
              website: '',
              last_username_change: null,
            };
            
            const { data: newData, error: createError } = await supabase
              .from('profiles')
              .insert(defaultProfile)
              .select('*')
              .single();
              
            if (createError) {
              console.error('Error creating profile:', createError);
              throw new Error('Could not create profile');
            }
            
            console.log('New profile created successfully:', newData);
            return {
              ...newData,
              custom_theme: { primary: "#1EAEDB", secondary: "#000000" }
            } as Profile;
          }
          
          throw new Error('Error loading profile: ' + error.message);
        }

        if (!data) {
          console.error('No profile found for user ID:', authUser.id);
          throw new Error('Profile not found');
        }
        
        console.log('Profile data loaded:', data);
        
        return {
          ...data,
          custom_theme: data.custom_theme || { primary: "#1EAEDB", secondary: "#000000" }
        } as Profile;
      } catch (err) {
        console.error('Profile fetch error:', err);
        throw err;
      }
    },
    staleTime: 0, // Always fetch fresh data
    retry: 1,     // Retry once on failure
  });

  const userId = profile?.id || authUser?.id;

  // Handle errors
  if (error) {
    console.error('Profile query error:', error);
    toast.error('Failed to load profile data');
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#050B1F] to-[#0A1232]">
      {/* Animated stars background */}
      <div className="absolute inset-0 z-0">
        {[...Array(150)].map((_, i) => {
          const size = Math.random() * 3 + 1;
          const top = Math.random() * 100;
          const left = Math.random() * 100;
          const animDuration = Math.random() * 3 + 2;
          const delay = Math.random() * 2;
          
          return (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                top: `${top}%`,
                left: `${left}%`,
                opacity: Math.random() * 0.7 + 0.3,
                animation: `twinkle ${animDuration}s infinite ease-in-out ${delay}s`
              }}
            />
          );
        })}
      </div>

      {/* Header Bar */}
      <div className="sticky top-0 z-20 backdrop-blur-sm bg-gradient-to-r from-[#0E1A3D]/80 to-[#1A123E]/80 border-b border-indigo-500/20">
        <div className="px-4 py-4 max-w-7xl mx-auto">
          <div className="text-xl font-bold text-white flex items-center justify-center">
            <Star className="text-yellow-400 mr-2 h-6 w-6" />
            <span className="tracking-wider">COSMIC PROFILE EDITOR</span>
            <Star className="text-yellow-400 ml-2 h-6 w-6" />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="flex justify-center items-center h-[80vh] relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <motion.div 
                animate={{ 
                  rotate: 360,
                  y: [0, -10, 0]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } 
                }}
                className="mb-6"
              >
                <Globe className="w-16 h-16 text-purple-400" />
              </motion.div>
              <div className="text-xl font-bold text-white mb-2">Loading Cosmic Profile</div>
              <div className="text-indigo-300 text-sm">Retrieving data from the outer reaches...</div>
            </motion.div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-[80vh] relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center max-w-md px-4"
            >
              <div className="mb-6 text-red-400">
                <Settings className="w-16 h-16 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Profile Data Error</h2>
              <p className="text-indigo-300 mb-6">
                We encountered an issue while loading your cosmic profile data. Please try again.
              </p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['profile'] })}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Retry
              </Button>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 pt-4 pb-20"
          >
            {/* Header - Profile Info */}
            <div className="max-w-3xl mx-auto px-4 py-6">
              {/* Header Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6 bg-gradient-to-r from-[#0E1A3D]/60 to-[#1A123E]/60 backdrop-blur-sm rounded-xl p-6 border border-indigo-500/20"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center border-2 border-indigo-400">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {profile?.username || 'Cosmic Traveler'}
                    </h2>
                    <p className="text-indigo-300">
                      Customize your presence in the gaming cosmos
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Edit Form Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: animationComplete ? 1 : 0, y: animationComplete ? 0 : 30 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-[#0E1A3D]/40 to-[#1A123E]/40 backdrop-blur-sm rounded-xl border border-indigo-500/20 overflow-hidden"
              >
                {/* Form Header */}
                <div className="px-6 py-4 border-b border-indigo-500/20 flex items-center">
                  <Command className="w-5 h-5 text-purple-400 mr-2" />
                  <h3 className="text-lg font-bold text-white">Profile Configuration</h3>
                </div>
                
                {/* Animated stars around the form */}
                <div className="relative">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={`form-star-${i}`}
                      className="absolute z-0"
                      animate={{
                        x: [0, 10, 0],
                        y: [0, -10, 0],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 3 + i,
                        repeat: Infinity,
                        delay: i * 0.7,
                      }}
                      style={{
                        top: `${20 + i * 15}%`,
                        left: i % 2 === 0 ? '-15px' : 'calc(100% + 5px)',
                      }}
                    >
                      <Star className="w-4 h-4 text-yellow-300" />
                    </motion.div>
                  ))}
                  
                  {/* Form Content */}
                  <div className="px-6 py-5 relative z-10">
                    {userId && <CosmicProfileForm userId={userId} />}
                    {!userId && (
                      <div className="p-4 text-center">
                        <Sparkles className="h-12 w-12 text-indigo-400 mx-auto mb-4 opacity-50" />
                        <div className="text-indigo-300">User profile could not be loaded</div>
                        <Button 
                          onClick={() => queryClient.invalidateQueries({ queryKey: ['profile'] })}
                          className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                        >
                          <Sparkles className="h-4 w-4 mr-2" /> Retry Loading Profile
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Cosmic Border Bottom */}
                <div className="h-2 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-600 opacity-60"></div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add CSS for twinkling stars animation */}
      <style jsx="true">{`
        @keyframes twinkle {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default EditProfile;
