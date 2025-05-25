import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Camera, AlertCircle, Check, Loader2, User, Globe, Edit3, RefreshCw, Star } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Profile } from "@/types/profile"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"

// Improved form validation schema with specific error messages
const profileFormSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  displayName: z.string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name cannot exceed 50 characters"),
  bioDescription: z.string()
    .max(500, "Bio cannot exceed 500 characters")
    .optional(),
  website: z.string()
    .url("Please enter a valid URL including https://")
    .optional()
    .or(z.literal("")),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function CosmicProfileForm({ userId }: { userId?: string }) {
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

  // Initialize form with react-hook-form and zod validation
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      displayName: "",
      bioDescription: "",
      website: "",
    },
    mode: "onChange", // Validate as user types
  })

  // Enhanced error handling and retry logic for profile fetching
  const { 
    data: profile, 
    refetch, 
    isLoading: profileLoading, 
    isError: profileError,
    error: fetchError
  } = useQuery({
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
          .single()

        if (error) {
          console.error('Error fetching profile:', error);
          
          // If the profile doesn't exist, try to create one
          if (error.code === 'PGRST116') { // PostgreSQL error for no rows returned
            console.log('Profile not found, attempting to create one');
            
            // Create a default profile with cosmic theme
            const username = user.email 
              ? user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') 
              : `cosmic_${Math.random().toString(36).substring(2, 10)}`;
            
            const newProfile = {
              id: user.id,
              username,
              display_name: user.user_metadata?.name || "Cosmic Explorer",
              bio: '✨ Embarking on a cosmic journey through the Clipt universe! ✨',
              avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`,
              created_at: new Date().toISOString(),
              last_username_change: null,
              website: '',
              custom_theme: {
                primary: "#6366F1", 
                secondary: "#0F172A",
                accent: "#FF5500"
              }
            };
            
            // Insert new profile with retry logic
            const maxRetries = 3;
            let retryCount = 0;
            let insertError = null;
            let insertedData = null;
            
            while (retryCount < maxRetries && !insertedData) {
              try {
                const { data: newData, error: createError } = await supabase
                  .from('profiles')
                  .insert(newProfile)
                  .select('*')
                  .single();
                  
                if (createError) {
                  console.error(`Error creating profile (attempt ${retryCount + 1}):`, createError);
                  insertError = createError;
                  retryCount++;
                  await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
                } else {
                  insertedData = newData;
                  break;
                }
              } catch (err) {
                console.error(`Exception during profile creation (attempt ${retryCount + 1}):`, err);
                insertError = err;
                retryCount++;
                await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
              }
            }
            
            if (!insertedData) {
              throw new Error(`Failed to create profile after ${maxRetries} attempts: ${insertError?.message || 'Unknown error'}`);
            }
            
            console.log('Created new profile:', insertedData);
            return insertedData as Profile;
          }
          
          throw new Error(`Could not load profile data: ${error.message}`);
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
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          // 60 day cooldown for username changes
          if (diffDays < 60) {
            setCanChangeUsername(false);
            setLastUsernameChange(changeDate);
            setDaysUntilNextChange(60 - diffDays);
          } else {
            setCanChangeUsername(true);
            setLastUsernameChange(changeDate);
            setDaysUntilNextChange(0);
          }
        } else {
          setCanChangeUsername(true);
          setLastUsernameChange(null);
          setDaysUntilNextChange(0);
        }
        
        return data as Profile;
      } catch (err: any) {
        console.error('Exception in profile query:', err);
        throw new Error(err.message || 'Failed to load profile data');
      }
    },
    retry: 3,
    retryDelay: (attempt) => Math.min(attempt * 1000, 3000),
  })

  // Set form values when profile data is loaded
  useEffect(() => {
    if (profile && !formInitialized) {
      form.reset({
        username: profile.username || "",
        displayName: profile.display_name || "",
        bioDescription: profile.bio || "",
        website: profile.website || "",
      });
      
      // Set avatar preview
      if (profile.avatar_url) {
        setAvatarPreview(profile.avatar_url);
      }
      
      setFormInitialized(true);
    }
  }, [profile, form, formInitialized]);

  // Improved form submission handler with optimistic updates
  async function onSubmit(values: ProfileFormValues) {
    if (!user?.id) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Optimistic update of the username check parameters
      if (values.username !== profile?.username && canChangeUsername) {
        setCanChangeUsername(false);
        setLastUsernameChange(new Date());
        setDaysUntilNextChange(60);
      }
      
      // Check if username already exists (but not if it's the current user's username)
      if (values.username !== profile?.username) {
        const { data: existingUsers, error: lookupError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', values.username);
          
        if (lookupError) {
          console.error('Error checking username availability:', lookupError);
          toast.error("Failed to check username availability");
          setSubmitting(false);
          return;
        }
        
        if (existingUsers && existingUsers.length > 0) {
          toast.error("This username is already taken. Please choose another one.");
          setSubmitting(false);
          return;
        }
      }
      
      // Prepare the update data
      const updateData: Record<string, any> = {
        display_name: values.displayName,
        bio: values.bioDescription || null,
        website: values.website || null,
        updated_at: new Date().toISOString(),
      };
      
      // Only update username if it has changed and user can change it
      if (values.username !== profile?.username && canChangeUsername) {
        updateData.username = values.username;
        updateData.last_username_change = new Date().toISOString();
      }
      
      // Update avatar if needed
      if (avatarPreview && avatarPreview !== profile?.avatar_url) {
        updateData.avatar_url = avatarPreview;
      }
      
      // Perform the update
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select('*')
        .single();
        
      if (error) {
        console.error('Error updating profile:', error);
        toast.error("Failed to update profile: " + error.message);
        setSubmitting(false);
        return;
      }
      
      // Update local data
      queryClient.setQueryData(['profile', user.id], data);
      
      setLoadingProgress(100);
      
      // Show enhanced success message with cosmic theme
      toast.success("Profile updated successfully", {
        description: "Redirecting you to your cosmic profile...",
        icon: <Star className="w-5 h-5 text-yellow-300" />
      });
      
      // Redirect to profile page immediately after successful update
      navigate(`/profile/${values.username}`);
      
    } catch (error: any) {
      console.error('Exception updating profile:', error);
      toast.error("An unexpected error occurred: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Enhanced image upload with progress handling and error recovery
  async function uploadImageToImgur(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      // Simulate the Imgur API for now (in a real app, you would use actual Imgur API)
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload time
      
      // Create object URL to preview the image
      return URL.createObjectURL(file);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error("Failed to upload image. Please try again.");
      throw error;
    }
  }

  // Avatar upload handler with preview
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Validate file size and type
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Image size must be less than 5MB");
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error("File must be an image");
      return;
    }
    
    setUploading(true);
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          setAvatarPreview(e.target.result as string);
        }
      };
      
      reader.readAsDataURL(file);
      
      // In production, upload to a real service
      // const imageUrl = await uploadImageToImgur(file);
      // setAvatarPreview(imageUrl);
      
      toast.success("Avatar uploaded successfully");
    } catch (error: any) {
      console.error('Error handling avatar upload:', error);
      toast.error("Failed to upload avatar: " + error.message);
    } finally {
      setUploading(false);
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.value = "";
      }
    }
  }

  // Event handler for avatar file input
  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleAvatarUpload(e);
  }

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="relative h-12 w-12 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30"></div>
          <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
        </div>
        <p className="text-indigo-300 animate-pulse">Loading your cosmic profile data...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-gradient-to-br from-red-900/20 to-red-900/10 border border-red-900/50">
        <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
        <h3 className="text-lg font-semibold text-white mb-1">Profile Load Error</h3>
        <p className="text-red-300 text-center mb-4">
          {fetchError instanceof Error ? fetchError.message : "Failed to load profile data"}
        </p>
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={() => refetch()}
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Try Again
        </Button>
      </div>
    );
  }

  // Main form with cosmic theme and animations
  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        <motion.div
          key="profile-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Avatar section with cosmic theme */}
              <div className="flex flex-col items-center justify-center mb-8">
                <div className="relative group">
                  <motion.div
                    className="absolute -inset-0.5 rounded-full opacity-75 group-hover:opacity-100 transition duration-300"
                    style={{
                      background: "linear-gradient(45deg, #5D3FD3, #FF5733, #FF2E63, #5D3FD3)",
                      filter: "blur(8px)",
                    }}
                    animate={{
                      backgroundPosition: ["0% 0%", "100% 100%"],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  />
                  
                  <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-900 to-purple-900 border-2 border-indigo-500/50 flex items-center justify-center">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar Preview" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-indigo-300" />
                    )}
                    
                    {/* Overlay when hovering */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  
                  {/* Floating stars around avatar */}
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={`avatar-star-${i}`}
                      className="absolute z-0"
                      animate={{
                        rotate: [0, 360],
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        duration: 3 + i,
                        repeat: Infinity,
                        delay: i * 0.5,
                      }}
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                      }}
                    >
                      <Star className="w-3 h-3 text-yellow-300" />
                    </motion.div>
                  ))}
                </div>
                
                {/* Upload button */}
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 text-indigo-300 border-indigo-500/50 hover:bg-indigo-900/20"
                  onClick={() => avatarFileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Change Avatar
                    </>
                  )}
                </Button>
              </div>
              
              {/* Form fields with cosmic styling */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-indigo-300">Username</FormLabel>
                        {!canChangeUsername && (
                          <span className="text-xs text-amber-400/80 flex items-center">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Cooldown Active
                          </span>
                        )}
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="cosmic_explorer"
                            {...field}
                            disabled={!canChangeUsername}
                            className={`bg-black/40 border-indigo-500/30 text-white focus:border-indigo-500 ${!canChangeUsername ? 'opacity-70' : ''}`}
                          />
                          {!canChangeUsername && (
                            <motion.div 
                              className="absolute inset-x-0 bottom-0 h-1 bg-amber-900/30 rounded-b-sm overflow-hidden"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              <motion.div 
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-400" 
                                style={{ width: `${Math.min(100, (60-daysUntilNextChange)/60*100)}%` }}
                              />
                            </motion.div>
                          )}
                        </div>
                      </FormControl>
                      {!canChangeUsername && (
                        <div className="flex justify-between text-xs text-amber-400/80 mt-1.5">
                          <span>Changed: {lastUsernameChange?.toLocaleDateString()}</span>
                          <span>Available in: {daysUntilNextChange} days</span>
                        </div>
                      )}
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-indigo-300">Display Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Cosmic Explorer"
                          {...field}
                          className="bg-black/40 border-indigo-500/30 text-white focus:border-indigo-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bioDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-indigo-300">Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell the cosmos about yourself..."
                          {...field}
                          className="bg-black/40 border-indigo-500/30 text-white focus:border-indigo-500 min-h-[120px] resize-none"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-indigo-300 flex items-center">
                        <Globe className="h-4 w-4 mr-1" /> Website
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://your-website.com"
                          {...field}
                          className="bg-black/40 border-indigo-500/30 text-white focus:border-indigo-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Submit button with loading state */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={uploading || submitting || !form.formState.isDirty}
                  className={`w-full relative overflow-hidden ${
                    form.formState.isDirty ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500' : 'bg-gray-700'
                  }`}
                >
                  {(uploading || submitting) && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500/80 to-purple-500/80"
                      initial={{ x: '-100%' }}
                      animate={{ x: `${loadingProgress - 100}%` }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    />
                  )}
                  
                  <span className="relative flex items-center justify-center">
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        {form.formState.isDirty ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        ) : (
                          "No Changes"
                        )}
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
