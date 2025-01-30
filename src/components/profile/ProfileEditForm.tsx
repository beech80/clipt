import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { ProfileAvatarUpload } from "./ProfileAvatarUpload"
import { ProfileBasicInfo } from "./ProfileBasicInfo"
import { ProfileGamingInfo } from "./ProfileGamingInfo"
import { ProfileSocialLinks } from "./ProfileSocialLinks"
import { ProfileFormValues, DatabaseProfile } from "./types"

const profileFormSchema = z.object({
  username: z.string().min(3).max(50),
  displayName: z.string().min(2).max(50),
  bioDescription: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal("")),
  favoriteGame: z.string().optional(),
  gamingPlatforms: z.array(z.string()).optional(),
  gamerLevel: z.string().optional(),
  twitchUsername: z.string().optional(),
  discordUsername: z.string().optional(),
  socialLinks: z.object({
    twitter: z.string().optional(),
    youtube: z.string().optional(),
    twitch: z.string().optional(),
  }),
})

export function ProfileEditForm() {
  const { user } = useAuth()

  const { data: profile, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      return data as DatabaseProfile
    },
    enabled: !!user
  })

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      displayName: "",
      bioDescription: "",
      location: "",
      website: "",
      favoriteGame: "",
      gamingPlatforms: [],
      gamerLevel: "",
      twitchUsername: "",
      discordUsername: "",
      socialLinks: {
        twitter: "",
        youtube: "",
        twitch: "",
      },
    },
  })

  React.useEffect(() => {
    if (profile) {
      const socialLinks = profile.social_links || {
        twitter: "",
        youtube: "",
        twitch: "",
      }
      
      form.reset({
        username: profile.username || "",
        displayName: profile.display_name || "",
        bioDescription: profile.bio_description || "",
        location: profile.location || "",
        website: profile.website || "",
        favoriteGame: profile.favorite_game || "",
        gamingPlatforms: profile.gaming_platforms || [],
        gamerLevel: profile.gamer_level || "",
        twitchUsername: profile.twitch_username || "",
        discordUsername: profile.discord_username || "",
        socialLinks,
      })
    }
  }, [profile, form])

  async function onSubmit(data: ProfileFormValues) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          display_name: data.displayName,
          bio_description: data.bioDescription,
          location: data.location,
          website: data.website,
          favorite_game: data.favoriteGame,
          gaming_platforms: data.gamingPlatforms,
          gamer_level: data.gamerLevel,
          twitch_username: data.twitchUsername,
          discord_username: data.discordUsername,
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

  const handleAvatarChange = (url: string) => {
    refetch()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <ProfileAvatarUpload
          avatarUrl={profile?.avatar_url}
          displayName={profile?.display_name}
          username={profile?.username}
          onAvatarChange={handleAvatarChange}
          refetch={refetch}
        />

        <ProfileBasicInfo form={form} />
        <ProfileGamingInfo form={form} />
        <ProfileSocialLinks form={form} />

        <Button 
          type="submit" 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          Update Profile
        </Button>
      </form>
    </Form>
  )
}