import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, AlertCircle } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Profile, DatabaseProfile } from "@/types/profile"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const profileFormSchema = z.object({
  username: z.string().min(3).max(50),
  displayName: z.string().min(2).max(50),
  bioDescription: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileEditForm() {
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

      console.log('Profile data retrieved:', data);

      // Check if the user can change their username (not more than once every two months)
      if (data.last_username_change) {
        const lastChange = new Date(data.last_username_change);
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        
        setLastUsernameChange(lastChange);
        const canChange = lastChange < twoMonthsAgo;
        setCanChangeUsername(canChange);
        
        if (!canChange) {
          // Calculate days until next allowed change
          const nextChangeDate = new Date(lastChange);
          nextChangeDate.setMonth(nextChangeDate.getMonth() + 2);
          const daysLeft = Math.ceil((nextChangeDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          setDaysUntilNextChange(daysLeft);
        }
      }

      // Handle any field mapping issues
      const transformedProfile: Profile = {
        id: data.id,
        username: data.username,
        avatar_url: data.avatar_url,
        display_name: data.display_name || data.displayName || data.username,
        bio: data.bio || data.bioDescription || "",
        website: data.website || "",
        created_at: data.created_at,
        enable_notifications: data.enable_notifications,
        enable_sounds: data.enable_sounds,
        private_profile: data.private_profile,
        last_username_change: data.last_username_change,
        banner_url: data.banner_url
      }

      return transformedProfile
    },
    enabled: !!user?.id,
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000 // Cache for 30 seconds
  })

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      displayName: "",
      bioDescription: "",
      website: "",
    },
  })

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

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    
    try {
      setSubmitting(true);
      toast.loading('Updating profile...');
      
      // Simple update with just basic text fields - no images
      const { error } = await supabase
        .from('profiles')
        .update({
          username: values.username,
          display_name: values.displayName,
          bio: values.bioDescription || null,
          website: values.website || null,
        })
        .eq('id', user.id);
        
      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile: ' + error.message);
        return;
      }
      
      toast.dismiss();
      toast.success('Profile updated successfully!');
      
      // Clear and refresh caches
      queryClient.removeQueries({ queryKey: ['profile'] });
      await refetch();
      
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error('Error: ' + (error.message || 'Failed to update profile'));
    } finally {
      setSubmitting(false);
      toast.dismiss();
    }
  };

  // Image upload using Imgur API - reliable and free approach
  const uploadImageToImgur = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
          Authorization: 'Client-ID 546c25a59c58ad7'  // Public Imgur client ID for demo purposes
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.data.error || 'Failed to upload image');
      }
      
      return result.data.link;
    } catch (error: any) {
      console.error('Imgur upload error:', error);
      throw new Error('Image upload failed: ' + (error.message || 'Unknown error'));
    }
  };

  // Simplified avatar upload using Imgur
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    // Show preview immediately for better user experience
    setAvatarPreview(URL.createObjectURL(file));
    
    try {
      setUploading(true);
      toast.loading('Uploading profile picture...');
      
      // Upload to Imgur instead of Supabase
      const imageUrl = await uploadImageToImgur(file);
      
      // Update profile with imgur URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: imageUrl })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Profile update error:', updateError);
        toast.error('Failed to update profile with new image');
        return;
      }
      
      toast.dismiss();
      toast.success('Profile picture updated successfully!');
      
      // Clear and refresh caches
      queryClient.removeQueries({ queryKey: ['profile'] });
      await refetch();
      
    } catch (error: any) {
      console.error('Avatar upload/update error:', error);
      toast.error('Error: ' + (error.message || 'Failed to update profile picture'));
    } finally {
      setUploading(false);
      toast.dismiss();
    }
  };

  // File input handling
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    handleAvatarUpload(e);
  };

  return (
    <Form {...form}>
      {/* Display profile loading state */}
      {profileLoading && (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-blue-800 rounded-full mb-4"></div>
          <p className="text-blue-300 text-sm font-medium">Loading your profile...</p>
        </div>
      )}

      {/* Display profile error with retry button */}
      {profileError && !profileLoading && (
        <Alert variant="destructive" className="mb-6 bg-red-950/40 border-red-800 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading profile</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">There was a problem loading your profile data.</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              className="bg-red-950/60 border-red-800 hover:bg-red-900/60 text-white"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Only show form when profile is loaded */}
      {!profileLoading && !profileError && profile && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-amber-100 dark:bg-amber-900 dark:text-amber-200 p-3 rounded-md mb-4">
            <p className="text-sm font-medium">
              Note: Banner uploads are temporarily disabled while we make improvements. Please just update your basic info and avatar for now.
            </p>
          </div>
        
          {/* Profile Images Section */}
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center sm:flex-row sm:space-x-6">
              {/* Avatar Preview */}
              <div className="relative mb-4 sm:mb-0">
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-purple-500">
                  <img 
                    src={avatarPreview || profile?.avatar_url || 'https://static-cdn.jtvnw.net/user-default-pictures-uv/998f01ae-def8-11e9-b95c-784f43822e80-profile_image-300x300.png'} 
                    alt="Avatar Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button 
                  type="button" 
                  size="sm" 
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                  disabled={uploading}
                  onClick={() => avatarFileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <input 
                  type="file" 
                  ref={avatarFileInputRef}
                  accept="image/*" 
                  onChange={handleAvatarFileChange} 
                  hidden 
                />
              </div>
              
              {/* Avatar Info */}
              <div className="flex-1">
                <h3 className="font-medium text-lg mb-1">Profile Picture</h3>
                <p className="text-muted-foreground text-sm mb-2">
                  Recommended size: 400x400 pixels <br />
                  Maximum size: 5MB
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="text-sm" 
                  disabled={uploading}
                  onClick={() => avatarFileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Upload New Picture
                </Button>
              </div>
            </div>
          </div>
          
          {/* Basic Information Section */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="username" 
                    {...field} 
                    disabled={!canChangeUsername}
                  />
                </FormControl>
                <FormDescription>
                  {canChangeUsername 
                    ? "This is your public display name. You can only change it once every two months."
                    : `You can change your username again in ${daysUntilNextChange} days.`
                  }
                </FormDescription>
                {!canChangeUsername && (
                  <Alert variant="warning" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Username Change Restricted</AlertTitle>
                    <AlertDescription>
                      You can only change your username once every two months. Your last change was on {lastUsernameChange?.toLocaleDateString()}.
                    </AlertDescription>
                  </Alert>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="Display Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bioDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about yourself"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://your-website.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={uploading || submitting}>Update profile</Button>
        </form>
      )}
    </Form>
  )
}
