
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
import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera } from "lucide-react"

const profileFormSchema = z.object({
  username: z.string().min(3).max(50),
  displayName: z.string().min(2).max(50),
  bioDescription: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
  socialLinks: z.object({
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
  }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileEditForm() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [canChangeUsername, setCanChangeUsername] = useState(true)
  const [lastUsernameChange, setLastUsernameChange] = useState<string | null>(null)

  const { data: profile, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!user
  })

  // Query to check username change eligibility
  useQuery({
    queryKey: ['username-change-eligibility'],
    queryFn: async () => {
      const { data: lastChange, error: lastChangeError } = await supabase
        .from('username_changes')
        .select('changed_at')
        .eq('user_id', user?.id)
        .order('changed_at', { ascending: false })
        .limit(1)
        .single()

      if (lastChangeError && lastChangeError.code !== 'PGRST116') {
        throw lastChangeError
      }

      if (lastChange) {
        const lastChangeDate = new Date(lastChange.changed_at)
        const nextEligibleDate = new Date(lastChangeDate.getTime() + (12 * 24 * 60 * 60 * 1000))
        const canChange = new Date() > nextEligibleDate
        setCanChangeUsername(canChange)
        setLastUsernameChange(nextEligibleDate.toLocaleDateString())
      }

      return true
    },
    enabled: !!user
  })

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      displayName: "",
      bioDescription: "",
      website: "",
      socialLinks: {
        twitter: "",
        instagram: "",
        youtube: "",
      },
    },
  })

  useEffect(() => {
    if (profile) {
      let socialLinks = {
        twitter: "",
        instagram: "",
        youtube: "",
      }

      if (profile.social_links && 
          typeof profile.social_links === 'object' && 
          !Array.isArray(profile.social_links)) {
        const links = profile.social_links as Record<string, unknown>
        socialLinks = {
          twitter: typeof links.twitter === 'string' ? links.twitter : "",
          instagram: typeof links.instagram === 'string' ? links.instagram : "",
          youtube: typeof links.youtube === 'string' ? links.youtube : "",
        }
      }
      
      form.reset({
        username: profile.username || "",
        displayName: profile.display_name || "",
        bioDescription: profile.bio_description || "",
        website: profile.website || "",
        socialLinks,
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
      const fileName = `${user?.id}.${fileExt}`

      setUploading(true)

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id)

      if (updateError) throw updateError

      toast.success("Profile picture updated successfully!")
      refetch()
    } catch (error) {
      toast.error("Error updating profile picture")
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(data: ProfileFormValues) {
    try {
      // Check if username is being changed
      if (data.username !== profile?.username) {
        if (!canChangeUsername) {
          toast.error(`You can change your username again on ${lastUsernameChange}`)
          return
        }

        // Record username change
        const { error: changeError } = await supabase
          .from('username_changes')
          .insert({
            user_id: user?.id,
            old_username: profile?.username,
            new_username: data.username
          })

        if (changeError) throw changeError
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          display_name: data.displayName,
          bio_description: data.bioDescription,
          website: data.website,
          social_links: data.socialLinks,
        })
        .eq('id', user?.id)

      if (error) throw error
      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error("Failed to update profile")
      console.error(error)
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
                <Input placeholder="username" {...field} disabled={!canChangeUsername} />
              </FormControl>
              <FormDescription>
                {canChangeUsername 
                  ? "This is your public display name."
                  : `You can change your username again on ${lastUsernameChange}`
                }
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

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Social Links</h3>
          <FormField
            control={form.control}
            name="socialLinks.twitter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Twitter</FormLabel>
                <FormControl>
                  <Input placeholder="Twitter username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socialLinks.instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram</FormLabel>
                <FormControl>
                  <Input placeholder="Instagram username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socialLinks.youtube"
            render={({ field }) => (
              <FormItem>
                <FormLabel>YouTube</FormLabel>
                <FormControl>
                  <Input placeholder="YouTube channel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit">Update profile</Button>
      </form>
    </Form>
  )
}
