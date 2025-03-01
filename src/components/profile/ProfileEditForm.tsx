
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
import { Camera } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { CustomTheme, Profile, DatabaseProfile } from "@/types/profile"

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

      // Transform database profile to frontend profile with proper typing
      const customTheme = typeof data.custom_theme === 'object' ? data.custom_theme : { primary: "#1EAEDB", secondary: "#000000" }

      const transformedProfile: Profile = {
        id: data.id,
        username: data.username,
        avatar_url: data.avatar_url,
        display_name: data.display_name,
        bio: data.bio,
        website: data.website,
        created_at: data.created_at,
        custom_theme: {
          primary: customTheme.primary || "#1EAEDB",
          secondary: customTheme.secondary || "#000000"
        },
        enable_notifications: data.enable_notifications ?? true,
        enable_sounds: data.enable_sounds ?? true,
        keyboard_shortcuts: data.keyboard_shortcuts ?? true
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
    if (!user?.id) {
      toast.error("You must be logged in to update your profile")
      return
    }

    try {
      const updateData: Partial<DatabaseProfile> = {
        username: data.username,
        display_name: data.displayName,
        bio: data.bioDescription,
        website: data.website || null,
        custom_theme: profile?.custom_theme || {
          primary: "#1EAEDB",
          secondary: "#000000"
        }
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
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
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
