import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Profile } from "@/types/profile";
import { useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Clock, Medal, MessageSquare } from "lucide-react";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm-new";

const EditProfile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Force refetch on component mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  }, [queryClient]);
  
  const { data: profile, isLoading, error } = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      console.log('Profile data loaded:', data);
      
      return {
        ...data,
        custom_theme: data.custom_theme || { primary: "#1EAEDB", secondary: "#000000" }
      } as Profile;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Handle errors
  if (error) {
    console.error('Profile query error:', error);
    toast.error('Failed to load profile. Please try again.');
  }

  const userId = profile?.id;

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          background: '#121212' 
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            border: '4px solid #333', 
            borderTopColor: '#FF5500', 
            animation: 'spin 1s linear infinite' 
          }} />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ 
            backgroundColor: '#121212',
            color: 'white',
            minHeight: '100vh',
            paddingTop: '60px',
            paddingBottom: '70px'
          }}
        >
          {/* Top Navigation Bar */}
          <div style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            padding: '8px 16px',
            backgroundColor: '#1A0F08', 
            borderBottom: '1px solid #FF5500'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button 
                style={{ 
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onClick={() => navigate('/profile')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ 
                margin: 0, 
                marginLeft: '8px',
                fontSize: '1.25rem',
                fontWeight: 'bold'
              }}>Edit Profile</h1>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto', 
            padding: '16px'
          }}>
            <div style={{ 
              backgroundColor: '#1A0F08', 
              borderRadius: '8px', 
              padding: '20px',
              marginBottom: '16px'
            }}>
              <ProfileEditForm userId={userId} />
            </div>
          </div>

          {/* Bottom Navigation Bar */}
          <div style={{ 
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '8px 4px',
            backgroundColor: '#1A0F08', 
            borderTop: '1px solid #FF5500',
            zIndex: 50
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <button 
                style={{
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '6px',
                  color: '#9e9e9e',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/clipts')}
              >
                <User size={20} />
                <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Clipts</span>
              </button>
              
              <button 
                style={{
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '6px',
                  color: '#9e9e9e',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/trophies')}
              >
                <Medal size={20} />
                <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Trophies</span>
              </button>
              
              <button 
                style={{
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '6px',
                  color: '#9e9e9e',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/discovery')}
              >
                <Clock size={20} />
                <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Discover</span>
              </button>
              
              <button 
                style={{
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '6px',
                  color: '#FF5500',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => navigate('/profile')}
              >
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  width: '20px',
                  height: '2px',
                  backgroundColor: '#FF5500'
                }} />
                <User size={20} />
                <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Profile</span>
              </button>
              
              <button 
                style={{
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '6px',
                  color: '#9e9e9e',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/messages')}
              >
                <MessageSquare size={20} />
                <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Chat</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditProfile;
