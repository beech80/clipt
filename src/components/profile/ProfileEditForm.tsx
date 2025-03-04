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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [canChangeUsername, setCanChangeUsername] = useState(true)
  const [lastUsernameChange, setLastUsernameChange] = useState<Date | null>(null)
  const [daysUntilNextChange, setDaysUntilNextChange] = useState(0)
  const queryClient = useQueryClient()

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
        last_username_change: data.last_username_change
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !user?.id) {
        return
      }

      setUploading(true)
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random().toString(36).slice(2)}.${fileExt}`

      // Upload file to storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(`public/${fileName}`, file, { 
          upsert: true,
          contentType: file.type
        })

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        throw new Error('Error uploading file')
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(`public/${fileName}`)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        throw new Error('Error updating profile')
      }

      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      await refetch() // Explicitly refetch to ensure UI updates
      toast.success("Profile picture updated successfully!")
    } catch (error) {
      console.error('Error updating avatar:', error)
      toast.error(error instanceof Error ? error.message : "Error updating profile picture")
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      if (data.username !== profile?.username && !canChangeUsername) {
        toast.error("Username can only be changed once every two months");
        return;
      }

      const updateData: Partial<DatabaseProfile> = {
        username: data.username,
        display_name: data.displayName,
        bio: data.bioDescription,
        website: data.website || null
      }

      // If username is being changed, update the last_username_change field
      if (data.username !== profile?.username) {
        updateData.last_username_change = new Date().toISOString();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      await refetch() // Explicitly refetch the profile data
      toast.success("Profile updated successfully!")
      navigate('/profile')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error("Failed to update profile")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-24 h-24 cursor-pointer hover:opacity-90 transition-opacity" onClick={handleAvatarClick}>
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10">
                {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
              </AvatarFallback>
              <div className="absolute bottom-0 right-0 p-1 bg-primary rounded-full">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </Avatar>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              className="hidden"
              accept="image/*"
              disabled={uploading}
            />
          </div>
          {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
        </div>

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

        <Button type="submit" disabled={uploading}>Update profile</Button>
      </form>
    </Form>
  )
}
