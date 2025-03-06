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
  const bannerFileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [canChangeUsername, setCanChangeUsername] = useState(true)
  const [lastUsernameChange, setLastUsernameChange] = useState<Date | null>(null)
  const [daysUntilNextChange, setDaysUntilNextChange] = useState(0)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)

  const { data: profile, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not found')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        throw error
      }

      if (!data) throw new Error('Profile not found')

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

      const transformedProfile: Profile = {
        id: data.id,
        username: data.username,
        avatar_url: data.avatar_url,
        display_name: data.display_name,
        bio: data.bio,
        website: data.website,
        created_at: data.created_at,
        enable_notifications: data.enable_notifications,
        enable_sounds: data.enable_sounds,
        private_profile: data.private_profile,
        last_username_change: data.last_username_change,
        banner_url: data.banner_url
      }

      return transformedProfile
    },
    enabled: !!user?.id
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

  // Fixed avatar upload function - completely rewritten
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
      
      // Create unique file path to avoid caching issues
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      console.log('Uploading avatar to path:', filePath);
      
      // Direct upload to storage bucket
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '0'
        });
        
      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        toast.error('Failed to upload image: ' + uploadError.message);
        return;
      }
      
      console.log('Avatar uploaded successfully, getting public URL');
      
      // Get public URL without cache
      const { data: publicUrlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
        
      if (!publicUrlData?.publicUrl) {
        toast.error('Failed to get image URL');
        return;
      }
      
      const avatarUrl = publicUrlData.publicUrl + '?t=' + Date.now();
      console.log('Avatar public URL:', avatarUrl);
      
      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Profile update error:', updateError);
        toast.error('Failed to update profile with new image');
        return;
      }
      
      // Success
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
  
  // Fixed banner upload function - completely rewritten
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Banner image must be less than 10MB');
      return;
    }
    
    // Show preview immediately for better user experience
    setBannerPreview(URL.createObjectURL(file));
    
    try {
      setUploading(true);
      toast.loading('Uploading banner image...');
      
      // Create unique file path to avoid caching issues
      const fileExt = file.name.split('.').pop();
      const fileName = `banner_${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;
      
      console.log('Uploading banner to path:', filePath);
      
      // Direct upload to storage bucket
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '0'
        });
        
      if (uploadError) {
        console.error('Banner upload error:', uploadError);
        toast.error('Failed to upload banner: ' + uploadError.message);
        return;
      }
      
      console.log('Banner uploaded successfully, getting public URL');
      
      // Get public URL without cache
      const { data: publicUrlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
        
      if (!publicUrlData?.publicUrl) {
        toast.error('Failed to get banner URL');
        return;
      }
      
      const bannerUrl = publicUrlData.publicUrl + '?t=' + Date.now();
      console.log('Banner public URL:', bannerUrl);
      
      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          banner_url: bannerUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Profile update error for banner:', updateError);
        toast.error('Failed to update profile with new banner');
        return;
      }
      
      // Success
      toast.dismiss();
      toast.success('Banner image updated successfully!');
      
      // Clear and refresh caches
      queryClient.removeQueries({ queryKey: ['profile'] });
      await refetch();
      
    } catch (error: any) {
      console.error('Banner upload/update error:', error);
      toast.error('Error: ' + (error.message || 'Failed to update banner image'));
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
  
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    handleBannerUpload(e);
  };

  // Handle form submission with improved error handling and data saving
  async function onSubmit(values: ProfileFormValues) {
    if (submitting) return;
    
    setSubmitting(true);

    try {
      if (!user) {
        toast.error('You must be logged in to update your profile');
        return;
      }

      // Prepare the update payload
      const updatePayload: Partial<DatabaseProfile> = {
        username: values.username,
        display_name: values.displayName,
        bio: values.bioDescription || null,
        website: values.website || null,
        updated_at: new Date().toISOString()
      };

      console.log('Updating profile with:', updatePayload);

      // Update the profile in Supabase with direct return
      const { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile: ' + error.message);
        return;
      }

      console.log('Profile updated successfully with data:', data);
      
      // Success!
      toast.success('Profile updated successfully!');
      
      // Clear all profile caches
      queryClient.removeQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Wait a brief moment for the database to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force a manual refetch
      await refetch();
      
      // Redirect to profile view
      navigate('/profile');
    } catch (error: any) {
      console.error('Error in profile update:', error);
      toast.error(`Failed to update profile: ${error?.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Profile Images Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Profile Images</h3>
            <p className="text-sm text-muted-foreground">
              Customize how your profile looks to others
            </p>
          </div>
          
          {/* Banner Image Upload */}
          <div className="space-y-2">
            <FormLabel>Banner Image</FormLabel>
            <div 
              className="h-40 rounded-lg overflow-hidden relative cursor-pointer group"
              onClick={() => bannerFileInputRef.current?.click()}
            >
              <div className={`absolute inset-0 flex items-center justify-center bg-black/50 text-white 
                transition-opacity ${bannerPreview || profile?.banner_url ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                <div className="text-center">
                  <Camera className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Click to upload a banner image</p>
                  <p className="text-xs text-gray-300">Recommended: 1200 x 400px</p>
                </div>
              </div>
              
              {bannerPreview ? (
                <img 
                  src={bannerPreview} 
                  alt="Banner preview" 
                  className="w-full h-full object-cover"
                />
              ) : profile?.banner_url ? (
                <img 
                  src={profile.banner_url} 
                  alt="Banner" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30"></div>
              )}
            </div>
            <input
              type="file"
              ref={bannerFileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleBannerFileChange}
              disabled={uploading}
            />
          </div>
          
          {/* Avatar Upload */}
          <div className="space-y-2">
            <FormLabel>Profile Picture</FormLabel>
            <div className="flex items-center gap-4">
              <div 
                className="relative group cursor-pointer"
                onClick={() => avatarFileInputRef.current?.click()}
              >
                <Avatar className="w-24 h-24 border-4 border-background">
                  <AvatarImage src={avatarPreview || profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-purple-600 text-xl">
                    {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Choose a profile picture</p>
                <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 5MB.</p>
              </div>
            </div>
            <input
              type="file"
              ref={avatarFileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarFileChange}
              disabled={uploading}
            />
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
    </Form>
  )
}
