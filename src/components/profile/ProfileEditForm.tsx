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
import { useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Camera } from "lucide-react"

const profileFormSchema = z.object({
  username: z.string().min(3).max(50),
  displayName: z.string().min(2).max(50),
  bioDescription: z.string().max(500).optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileEditForm() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      displayName: "",
      bioDescription: "",
    },
  })

  useEffect(() => {
    if (profile) {
      form.reset({
        username: profile.username || "",
        displayName: profile.display_name || "",
        bioDescription: profile.bio_description || "",
      })
    }
  }, [profile, form])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    if (file.size > 5000000) {
      toast.error("Image size should be less than 5MB")
      return
    }

    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      toast.success("Profile picture updated successfully!")
      refetch()
    } catch (error) {
      toast.error("Error updating profile picture")
      console.error(error)
    }
  }

  async function onSubmit(data: ProfileFormValues) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          display_name: data.displayName,
          bio_description: data.bioDescription,
        })
        .eq('id', user?.id)

      if (error) throw error
      toast.success("Profile updated successfully!")
      refetch()
    } catch (error) {
      toast.error("Failed to update profile")
      console.error(error)
    }
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-24 h-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback>
              {profile?.display_name?.charAt(0) || user?.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-4 h-4" />
            Change Profile Picture
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your display name" {...field} />
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
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your unique username.
                  </FormDescription>
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

            <Button type="submit" className="w-full">
              Update Profile
            </Button>
          </form>
        </Form>
      </div>
    </Card>
  )
}