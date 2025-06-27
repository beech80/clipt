import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Camera, AlertCircle, Check, Loader2, User, Globe, Edit3, RefreshCw, Star, ArrowLeft, ImageIcon, AtSign, Save, Trophy, Flame, Beaker, Eye } from "lucide-react"
import UserTitle from "../common/UserTitle"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Profile } from "@/types/profile"
import { motion, AnimatePresence } from "framer-motion"

// Form validation schema with cosmic-themed error messages
const profileFormSchema = z.object({
  username: z.string()
    .min(3, "Star navigator name must be at least 3 characters long")
    .max(50, "Star navigator name cannot exceed 50 light-years")
    .regex(/^[a-zA-Z0-9_]+$/, "Only use alphanumeric characters and underscores for cosmic identification"),
  displayName: z.string()
    .min(2, "Cosmic identity must span at least 2 characters")
    .max(50, "Cosmic identity cannot exceed 50 characters in this galaxy"),
  selectedTitle: z.string().optional(),
  bioDescription: z.string()
    .max(500, "Your cosmic story must be under 500 characters")
    .optional(),
  website: z.string()
    .url("Please enter a valid URL to your space station (include https://)")
    .optional()
    .or(z.literal(""))
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileEditForm({ userId }: { userId?: string }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const avatarFileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [canChangeUsername, setCanChangeUsername] = useState(true)
  const [lastUsernameChange, setLastUsernameChange] = useState<Date | null>(null)
  const [daysUntilNextChange, setDaysUntilNextChange] = useState(0)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [formInitialized, setFormInitialized] = useState(false)
  const [starAnimation, setStarAnimation] = useState(false)
  
  // Star animation effect when submitting form
  useEffect(() => {
    if (submitting || uploading) {
      setStarAnimation(true);
    } else {
      setTimeout(() => setStarAnimation(false), 1000);
    }
  }, [submitting, uploading]);

  // Progressive loading effect for better UX
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (uploading || submitting) {
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          const increment = Math.random() * 15;
          return Math.min(prev + increment, 95); // Cap at 95% until completion
        });
      }, 300);
    } else {
      setLoadingProgress(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [uploading, submitting]);

  // Get profile data
  const { data: profile, refetch, isLoading: profileLoading, isError: profileError } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not found')
      
      console.log('Fetching profile for user:', user.id);
      
      try {
        // First check if profile exists
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          
          // If the profile doesn't exist, try to create one
          if (error.code === 'PGRST116') { // PostgreSQL error for no rows returned
            console.log('Profile not found, attempting to create one');
            
            try {
              // Create a default profile
              const username = user.email 
                ? user.email.split('@')[0] 
                : `user_${Math.random().toString(36).substring(2, 10)}`;
              
              const newProfile = {
                id: user.id,
                username,
                display_name: user.user_metadata?.name || username,
                bio: 'Welcome to my Clipt profile!',
                avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`,
                created_at: new Date().toISOString(),
                level: 0,
                xp: 0,
                prestige: 0,
                tokens: 0
              };
              
              // Insert new profile
              const { data: newData, error: createError } = await supabase
                .from('profiles')
                .insert([newProfile])
                .select('*')
                .single();
              
              if (createError) {
                console.error('Error creating profile:', createError);
                throw new Error('Could not create profile');
              }
              
              console.log('Created new profile:', newData);
              return newData as unknown as Profile;
            } catch (createErr) {
              console.error('Error in profile creation process:', createErr);
              throw new Error('Failed to create profile');
            }
          }
          
          throw new Error('Could not load profile data');
        }

        if (!data) {
          console.error('Profile not found for user:', user.id);
          throw new Error('Profile not found');
        }
        
        // Check username change date if it exists
        if (data) {
          const lastUsernameChangeField = data.last_username_change || data.username_last_changed;
          if (lastUsernameChangeField) {
            try {
              const changeDate = new Date(lastUsernameChangeField);
              const today = new Date();
              const diffTime = today.getTime() - changeDate.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              // Can only change username once every 60 days
              if (diffDays < 60) {
                setCanChangeUsername(false);
                setLastUsernameChange(changeDate);
                setDaysUntilNextChange(60 - diffDays);
              }
            } catch (error) {
              console.error('Error parsing username change date:', error);
            }
          }
        }
        
        console.log('Profile data loaded:', data);
        return data as unknown as Profile;
      } catch (err) {
        console.error('Error in profile data loading:', err);
        throw new Error('Failed to load profile data');
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // Setup form with values from profile
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      displayName: "",
      selectedTitle: "",
      bioDescription: "",
      website: "",
    },
  })

  // Update form when profile is loaded
  useEffect(() => {
    if (profile) {
      form.reset({
        username: profile.username || "",
        displayName: profile.display_name || "",
        selectedTitle: profile.selected_title || "",
        bioDescription: profile.bio || "",
        website: profile.website || "",
      })
    }
  }, [profile, form])

  // Enhanced form submission handler with optimistic updates and cosmic animations
  const onSubmit = async (values: ProfileFormValues) => {
    if (!user?.id) {
      toast.error('User ID not found. Please log in again.');
      return;
    }
    
    setSubmitting(true);
    console.log('Submitting profile update with values:', values);
    
    try {
      // Store current profile data for rollback if needed
      const previousProfileData = queryClient.getQueryData(['profile', user.id]);
      console.log('Previous profile data:', previousProfileData);
      
      // Prepare update payload - removing updated_at which doesn't exist in your table
      const updatePayload: any = {
        username: values.username.trim(),
        display_name: values.displayName.trim(),
        bio: values.bioDescription?.trim() || '',
        website: values.website?.trim() || '',
        selected_title: values.selectedTitle || null
        // Removed updated_at field as it doesn't exist in your profiles table
      };
      console.log('Update payload prepared:', updatePayload);
      
      // Add avatar if changed
      if (avatarPreview && avatarPreview !== profile?.avatar_url) {
        try {
          console.log('Avatar changed, processing new image...');
          // Optimize avatar before uploading if it's a new one
          if (avatarFileInputRef.current?.files?.length) {
            const file = avatarFileInputRef.current.files[0];
            console.log('Processing file:', file.name, 'size:', file.size);
            const imageUrl = await uploadProfileImage(file);
            if (imageUrl) {
              console.log('Image processed successfully, length:', imageUrl.length);
              updatePayload.avatar_url = imageUrl;
            }
          }
        } catch (imageError) {
          console.error('Error processing image:', imageError);
          toast.error(`Image processing failed: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
        }
      }
      
      // Log the final payload size (could be an issue if too large)
      const payloadSize = JSON.stringify(updatePayload).length;
      console.log(`Final payload size: ${payloadSize} bytes`);
      
      // Check if payload is too large (Supabase has limits)
      if (payloadSize > 1024 * 1024) { // 1MB limit
        console.warn('Payload is very large, may exceed database limits');
        toast.warning('Image may be too large, try a smaller one');
      }
      
      // Simpler direct approach first - try to update without optimistic updates
      console.log(`Updating profile for user ID: ${user.id}`);
      const { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)
        .select();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('Profile updated successfully:', data);
      toast.success('✨ Your cosmic profile has been updated!');
      
      // Invalidate query to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      
      // Redirect after a slight delay to ensure toast is seen
      setTimeout(() => {
        navigate('/profile');
      }, 1000);
    } catch (error) {
      console.error('Error in profile update process:', error);
      // Detailed error message for better troubleshooting
      toast.error(`Profile update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Advanced image processing with compression for profile uploads
  const uploadProfileImage = async (file: File): Promise<string> => {
    try {
      // First check if file is too large
      if (file.size > 2 * 1024 * 1024) { // 2MB
        console.warn('File too large, needs compression', file.size);
        // We'll handle this with compression below
      }
      
      // For smaller files, use direct conversion
      if (file.size < 500 * 1024) { // Under 500KB
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (!event.target || typeof event.target.result !== 'string') {
              reject(new Error('Failed to read file'));
              return;
            }
            resolve(event.target.result);
          };
          reader.onerror = () => reject(new Error('Error reading file'));
          reader.readAsDataURL(file);
        });
      }
      
      // For larger files, we'll use the canvas to compress
      return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = () => {
          // Calculate new dimensions (max 600px width/height)
          let width = img.width;
          let height = img.height;
          const maxSize = 600;
          
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
          
          // Set canvas size and draw resized image
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with reduced quality
          const quality = 0.7; // 70% quality - good balance
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          console.log(`Compressed image from ${file.size} to ~${Math.round(compressedBase64.length / 1.37)} bytes`);
          
          resolve(compressedBase64);
        };
        
        img.onerror = () => reject(new Error('Error loading image for compression'));
        
        // Create object URL from file for the image source
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error('Error in image processing:', error);
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Enhanced Avatar upload handler with optimized base64 handling
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    
    // Validate file size (2MB max for base64 efficiency)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large. Maximum size is 2MB for optimal performance.');
      return;
    }
    
    try {
      setUploading(true);
      toast.info('Processing image...', {duration: 2000});
      
      // Convert and display preview immediately
      setAvatarPreview(URL.createObjectURL(file));
      
      // Get base64 string
      const base64Image = await uploadProfileImage(file);
      
      // Update profile with new avatar using base64 string
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: base64Image })
        .eq('id', user?.id)
        .select()
        .single();
        
      if (error) {
        console.error('Profile update error:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }
      
      console.log('Avatar updated successfully');
      toast.success('✨ Your cosmic portrait has been updated!');
      
      // Force refetch to get fresh data
      await queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    } catch (error) {
      console.error('Avatar update process failed:', error);
      toast.error(`Cosmic interference: ${error instanceof Error ? error.message : 'Failed to update profile picture'}`);
      // Reset preview on error
      if (profile?.avatar_url) {
        setAvatarPreview(profile.avatar_url);
      }
    } finally {
      setUploading(false);
    }
  };

  // File input change handler
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploading) return;
    handleAvatarUpload(e);
  };

  if (profileLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px'
      }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '50%', 
          border: '3px solid #333', 
          borderTopColor: '#FF5500', 
          animation: 'spin 1s linear infinite' 
        }} />
      </div>
    );
  }

  if (profileError) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#1A0F08',
        borderRadius: '8px',
        color: '#e0e0e0'
      }}>
        <p>Could not load profile information. Please try again later.</p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Avatar Section */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        alignItems: 'center', 
        marginBottom: '24px', 
        padding: '16px', 
        backgroundColor: '#121212', 
        borderRadius: '8px'
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '40px', border: '2px solid #FF5500', overflow: 'hidden', position: 'relative' }}>
            <img 
              src={avatarPreview || profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`} 
              alt="Profile" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <button
            type="button"
            style={{ 
              position: 'absolute', 
              bottom: '0', 
              right: '0', 
              height: '24px', 
              width: '24px', 
              borderRadius: '50%', 
              backgroundColor: '#FF5500', 
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onClick={() => avatarFileInputRef.current?.click()}
          >
            <Camera size={14} color="white" />
          </button>
          <input 
            type="file" 
            ref={avatarFileInputRef}
            accept="image/*" 
            onChange={handleAvatarFileChange} 
            hidden 
          />
        </div>
        
        {/* Avatar Info */}
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 500, fontSize: '1.125rem', marginBottom: '4px', color: 'white' }}>Profile Picture</h3>
          <p style={{ color: '#9e9e9e', fontSize: '0.875rem', marginBottom: '8px' }}>
            Recommended size: 400x400 pixels <br />
            Maximum size: 5MB
          </p>
          <button 
            type="button" 
            style={{ 
              backgroundColor: 'transparent',
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              color: '#e0e0e0',
              cursor: uploading ? 'default' : 'pointer',
              opacity: uploading ? 0.6 : 1
            }}
            disabled={uploading}
            onClick={() => avatarFileInputRef.current?.click()}
          >
            <Camera size={16} style={{ marginRight: '8px' }} />
            Upload New Picture
          </button>
        </div>
      </div>
      
      {/* Basic Information Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#e0e0e0', marginBottom: '6px' }}>Username</label>
          <input 
            type="text" 
            placeholder="username" 
            {...form.register('username')}
            disabled={!canChangeUsername}
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              backgroundColor: '#121212', 
              border: '1px solid #333', 
              borderRadius: '4px', 
              color: 'white',
              opacity: !canChangeUsername ? 0.6 : 1
            }}
          />
          <p style={{ fontSize: '0.75rem', color: '#9e9e9e', marginTop: '4px' }}>
            {canChangeUsername 
              ? "This is your public display name. You can only change it once every two months."
              : `You can change your username again in ${daysUntilNextChange} days.`
            }
          </p>
          {!canChangeUsername && (
            <div style={{ 
              marginTop: '8px', 
              padding: '12px', 
              backgroundColor: 'rgba(255, 170, 0, 0.1)', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <AlertCircle size={16} color="#FFAA00" />
              <div>
                <div style={{ fontWeight: 500, marginBottom: '2px', color: '#FFAA00' }}>Username Change Restricted</div>
                <div style={{ fontSize: '0.875rem', color: '#e0e0e0' }}>
                  You can only change your username once every two months. Your last change was on {lastUsernameChange?.toLocaleDateString()}.
                </div>
              </div>
            </div>
          )}
          {form.formState.errors.username && (
            <p style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '4px' }}>
              {form.formState.errors.username.message}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#e0e0e0', marginBottom: '6px' }}>Display Name</label>
          <input 
            type="text" 
            placeholder="Display Name" 
            {...form.register('displayName')}
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              backgroundColor: '#121212', 
              border: '1px solid #333', 
              borderRadius: '4px', 
              color: 'white'
            }}
          />
          {form.formState.errors.displayName && (
            <p style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '4px' }}>
              {form.formState.errors.displayName.message}
            </p>
          )}
        </div>
        
        {/* Title Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#e0e0e0', marginBottom: '6px' }}>
            Profile Title
            {(!profile || !profile.level || profile.level < 30) && (
              <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: '#FF5500', fontWeight: 'normal' }}>
                (Unlocks at Level 30)
              </span>
            )}
          </label>
          <select
            disabled={!profile || !profile.level || profile.level < 30}
            {...form.register('selectedTitle')}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#121212',
              border: '1px solid #333',
              borderRadius: '4px',
              color: 'white',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 fill=%27none%27 stroke=%27%23888%27 viewBox=%270 0 12 12%27%3E%3Cpath d=%27M2 4l4 4 4-4%27/%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              opacity: (!profile || !profile.level || profile.level < 30) ? 0.6 : 1,
              cursor: (!profile || !profile.level || profile.level < 30) ? 'not-allowed' : 'pointer',
            }}
          >
            <option value="">No Title</option>
            <option value="clipt-legend" style={{ padding: '8px' }}>🏆 Clipt Legend</option>
            <option value="timeline-terror" style={{ padding: '8px' }}>🔥 Timeline Terror</option>
            <option value="the-architect" style={{ padding: '8px' }}>🌎 The Architect</option>
            <option value="meta-maker" style={{ padding: '8px' }}>⚗️ Meta Maker</option>
            <option value="shadow-mode" style={{ padding: '8px' }}>👁️ Shadow Mode</option>
          </select>
          
          {(!profile || !profile.level || profile.level < 30) && (
            <p style={{ fontSize: '0.75rem', color: '#9e9e9e', marginTop: '4px' }}>
              Reach level 30 to unlock profile titles! You are currently level {profile?.level || 0}.
            </p>
          )}
          
          {form.watch('selectedTitle') && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#121212', borderRadius: '4px', border: '1px solid #333' }}>
              <div style={{ marginBottom: '8px', color: '#9e9e9e', fontSize: '0.85rem' }}>Title Preview:</div>
              <UserTitle titleId={form.watch('selectedTitle')} size="large" />
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#e0e0e0', marginBottom: '6px' }}>Bio</label>
          <textarea
            placeholder="Tell us about yourself"
            {...form.register('bioDescription')}
            style={{ 
              width: '100%', 
              height: '120px',
              padding: '8px 12px', 
              backgroundColor: '#121212', 
              border: '1px solid #333', 
              borderRadius: '4px', 
              color: 'white',
              resize: 'none',
              fontFamily: 'inherit'
            }}
          />
          {form.formState.errors.bioDescription && (
            <p style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '4px' }}>
              {form.formState.errors.bioDescription.message}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#e0e0e0', marginBottom: '6px' }}>Website</label>
          <input 
            type="text" 
            placeholder="https://your-website.com" 
            {...form.register('website')}
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              backgroundColor: '#121212', 
              border: '1px solid #333', 
              borderRadius: '4px', 
              color: 'white'
            }}
          />
          {form.formState.errors.website && (
            <p style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '4px' }}>
              {form.formState.errors.website.message}
            </p>
          )}
        </div>
      </div>

      <button 
        type="submit" 
        disabled={uploading || submitting}
        style={{ 
          backgroundColor: '#FF5500',
          color: 'white',
          fontWeight: 'bold',
          padding: '10px 16px',
          borderRadius: '4px',
          border: 'none',
          cursor: (uploading || submitting) ? 'default' : 'pointer',
          opacity: (uploading || submitting) ? 0.6 : 1
        }}
      >
        {submitting ? 'Updating...' : 'Update profile'}
      </button>
    </form>
  );
}
