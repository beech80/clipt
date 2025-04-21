import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Profile } from "@/types/profile";
import { useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Clock, Medal, MessageSquare } from "lucide-react";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";

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
            paddingTop: '60px'
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              {/* Back button and title removed */}
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

          {/* Bottom Navigation Removed */}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditProfile;
