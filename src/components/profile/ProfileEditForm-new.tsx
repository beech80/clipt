import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Camera, AlertCircle } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Profile } from "@/types/profile"

// Form validation schema
const profileFormSchema = z.object({
  username: z.string().min(3).max(50),
  displayName: z.string().min(2).max(50),
  bioDescription: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
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

  // Get profile data
  const { data: profile, refetch, isLoading: profileLoading, isError: profileError } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not found')
      
      console.log('Fetching profile for user:', user.id);
      
      // First check if profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

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
              created_at: new Date().toISOString()
            };
            
            // Insert new profile
            const { data: newData, error: createError } = await supabase
              .from('profiles')
              .insert(newProfile)
              .select('*')
              .single();
              
            if (createError) {
              console.error('Error creating profile:', createError);
              throw new Error('Could not create profile');
            }
            
            console.log('Created new profile:', newData);
            return newData as Profile;
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
      if (data.last_username_change) {
        const changeDate = new Date(data.last_username_change);
        const today = new Date();
        const diffTime = today.getTime() - changeDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Can only change username once every 60 days
        if (diffDays < 60) {
          setCanChangeUsername(false);
          setLastUsernameChange(changeDate);
          setDaysUntilNextChange(60 - diffDays);
        }
      }
      
      console.log('Profile data loaded:', data);
      return data as Profile;
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
        bioDescription: profile.bio || "",
        website: profile.website || "",
      })
    }
  }, [profile, form])

  // Form submission handler
  const onSubmit = async (values: ProfileFormValues) => {
    if (!user?.id || submitting) return;
    
    try {
      setSubmitting(true);
      
      const updates = {
        id: user.id,
        username: values.username,
        display_name: values.displayName,
        bio: values.bioDescription,
        website: values.website,
        updated_at: new Date().toISOString(),
      };
      
      // Add username change date if username was changed
      if (profile?.username !== values.username) {
        updates['last_username_change'] = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      console.log('Profile updated:', data);
      toast.success('Profile updated successfully');
      
      // Invalidate query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Navigate back to profile
      navigate('/profile');
    } catch (error) {
      console.error('Error in profile update:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Image upload function using Imgur API
  const uploadImageToImgur = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
          Authorization: 'Client-ID 546c25a59c58ad7',
        },
        body: formData,
      });
      
      const data = await response.json();
      if (!data.success) throw new Error('Upload failed');
      
      return data.data.link;
    } catch (error) {
      console.error('Error uploading to Imgur:', error);
      throw new Error('Image upload failed');
    }
  };

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Maximum size is 5MB.');
      return;
    }
    
    // Preview the image
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAvatarPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    
    try {
      setUploading(true);
      
      // Upload to Imgur
      const imageUrl = await uploadImageToImgur(file);
      
      // Update profile with new avatar
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: imageUrl })
        .eq('id', user?.id)
        .select()
        .single();
        
      if (error) throw error;
      
      console.log('Avatar updated:', data);
      toast.success('Profile picture updated');
      
      // Force refetch
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      console.error('Avatar update failed:', error);
      toast.error('Failed to update profile picture');
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
