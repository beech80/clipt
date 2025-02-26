
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
import type { CustomTheme, Profile } from "@/types/profile"

const profileFormSchema = z.object({
  username: z.string().min(3).max(50),
  displayName: z.string().min(2).max(50),
  bioDescription: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileEditForm() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const queryClient = useQueryClient()

  const { data: profile, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error

      // Transform the data to match the Profile type
      const customTheme: CustomTheme = {
        primary: ((data.custom_theme as Record<string, string>)?.primary) || "#1EAEDB",
        secondary: ((data.custom_theme as Record<string, string>)?.secondary) || "#000000"
      }

      return {
        id: data.id,
        username: data.username,
        avatar_url: data.avatar_url,
        display_name: data.display_name,
        bio: data.bio,
        website: data.website,
        created_at: data.created_at,
        custom_theme: customTheme,
        enable_notifications: data.enable_notifications ?? true,
        enable_sounds: data.enable_sounds ?? true,
        keyboard_shortcuts: data.keyboard_shortcuts ?? true,
      } as Profile
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
      if (!event.target.files || event.target.files.length === 0) {
        return
      }
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`

      setUploading(true)

      // First, upload the file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (updateError) throw updateError

      toast.success("Profile picture updated successfully!")
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    } catch (error) {
      console.error('Error updating avatar:', error)
      toast.error("Error updating profile picture")
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(data: ProfileFormValues) {
    try {
      // Prepare the custom theme object
      const customThemeObj: Record<string, string> = {
        primary: profile?.custom_theme?.primary || "#1EAEDB",
        secondary: profile?.custom_theme?.secondary || "#000000"
      }

      const updateData = {
        username: data.username,
        display_name: data.displayName,
        bio: data.bioDescription,
        website: data.website,
        updated_at: new Date().toISOString(),
        custom_theme: customThemeObj
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user?.id)

      if (error) throw error
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] })
      ])

      toast.success("Profile updated successfully!")
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
