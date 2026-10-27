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
import type { Profile } from "@/types/profile"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { prepareAvatar } from '@/lib/avatar-upload'

const profileFormSchema = z.object({
  username: z.string().regex(/^[A-Za-z0-9_]{3,50}$/, 'Use 3-50 letters, numbers, or underscores'),
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
  const uploadInProgress = useRef(false)
  const saveInProgress = useRef(false)

  useEffect(() => () => {
    if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview])

  const { data: profile, refetch, isLoading: profileLoading, isError: profileError } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not found')

      console.log('Fetching profile for user:', user.id);
      
      // First check if profile exists
      const { data, error } = await supabase
        .rpc('get_own_profile')
        .single()

      if (error) {
        console.error('Error fetching profile:', error);
        
        throw new Error('Could not load profile data');
      }

      if (!data) {
        console.error('Profile not found for user:', user.id);
        throw new Error('Profile not found');
      }


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
        display_name: data.display_name || data.username,
        bio: data.bio || data.bio_description || "",
        website: data.website || "",
        created_at: data.created_at,
        enable_notifications: data.enable_notifications,
        enable_sounds: data.enable_sounds,
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
    if (!user || saveInProgress.current || uploadInProgress.current) return;
    saveInProgress.current = true;
    
    try {
      setSubmitting(true);
      toast.loading('Updating profile...');
      
      // Simple update with just basic text fields - no images
      const { data: savedProfile, error } = await supabase
        .from('profiles')
        .update({
          username: values.username,
          display_name: values.displayName,
          bio: values.bioDescription || null,
          website: values.website || null,
        })
        .eq('id', user.id)
        .select('id')
        .single();
        
      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile: ' + error.message);
        return;
      }
      if (!savedProfile) throw new Error('Profile update was not confirmed.');
      
      toast.dismiss();
      toast.success('Profile updated successfully!');
      
      // Clear and refresh caches
      queryClient.removeQueries({ queryKey: ['profile'] });
      await refetch();
      
    } catch (error: unknown) {
      console.error('Profile update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      saveInProgress.current = false;
      setSubmitting(false);
      toast.dismiss();
    }
  };

  // Upload only to the app-owned, owner-scoped avatar bucket.
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user || uploadInProgress.current) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    uploadInProgress.current = true;
    let uploadedPath: string | null = null;
    try {
      setUploading(true);
      toast.loading('Uploading profile picture...');
      
      const avatar = await prepareAvatar(file);
      const path = `${user.id}/${crypto.randomUUID()}.webp`;
      const { error: uploadError } = await supabase.storage.from('clipt-avatars').upload(path, avatar, {
        contentType: 'image/webp', upsert: false, cacheControl: '3600',
      });
      if (uploadError) throw uploadError;
      uploadedPath = path;
      const { data: { publicUrl: imageUrl } } = supabase.storage.from('clipt-avatars').getPublicUrl(path);
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: imageUrl })
        .eq('id', user.id)
        .select('id')
        .single();
        
      if (updateError) {
        throw updateError;
      }
      if (!updatedProfile) throw new Error('Profile update was not confirmed.');
      uploadedPath = null;
      setAvatarPreview(imageUrl);
      
      toast.dismiss();
      toast.success('Profile picture updated successfully!');
      
      // Clear and refresh caches
      queryClient.removeQueries({ queryKey: ['profile'] });
      await refetch();
      
    } catch (error: unknown) {
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage.from('clipt-avatars').remove([uploadedPath]);
        if (cleanupError) toast.error('The unused image could not be removed. Contact support for cleanup.');
      }
      console.error('Avatar upload/update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile picture');
    } finally {
      uploadInProgress.current = false;
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
        
          {/* Profile Images Section */}
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center sm:flex-row sm:space-x-6">
              {/* Avatar Preview */}
              <div className="relative mb-4 sm:mb-0">
                <Avatar className="w-28 h-28 border-2 border-purple-500">
                  <AvatarImage src={avatarPreview || profile.avatar_url || undefined} alt="Your profile picture" className="object-cover" />
                  <AvatarFallback className="bg-purple-950 text-purple-100 text-2xl">{(profile.username || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button 
                  type="button" 
                  size="sm" 
                  className="absolute bottom-0 right-0 rounded-full w-11 h-11 p-0"
                  aria-label="Upload profile picture"
                  disabled={uploading || submitting}
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
                  disabled={uploading || submitting}
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
                    disabled={!canChangeUsername || submitting || uploading}
                  />
                </FormControl>
                <FormDescription>
                  {canChangeUsername 
                    ? "This is your public display name. You can only change it once every two months."
                    : `You can change your username again in ${daysUntilNextChange} days.`
                  }
                </FormDescription>
                {!canChangeUsername && (
                  <Alert className="mt-2">
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
                  <Input placeholder="Display Name" disabled={submitting || uploading} {...field} />
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
                    disabled={submitting || uploading}
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
                  <Input placeholder="https://your-website.com" disabled={submitting || uploading} {...field} />
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
