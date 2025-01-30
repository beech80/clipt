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
import { Camera, Gamepad2, Trophy, Twitch } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

const GAMING_PLATFORMS = [
  "PC",
  "PlayStation",
  "Xbox",
  "Nintendo Switch",
  "Mobile",
  "VR",
  "Retro",
]

const GAMER_LEVELS = [
  "Casual",
  "Competitive",
  "Pro",
  "Streamer",
  "Content Creator",
  "Esports Player",
]

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface SocialLinks {
  twitter?: string;
  youtube?: string;
  twitch?: string;
}

export function ProfileEditForm() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

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

  useEffect(() => {
    if (profile) {
      const socialLinks = profile.social_links as SocialLinks || {
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-24 h-24 cursor-pointer hover:opacity-90 transition-opacity border-4 border-purple-500" onClick={handleAvatarClick}>
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-purple-600">
                {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
              </AvatarFallback>
              <div className="absolute bottom-0 right-0 p-1 bg-purple-500 rounded-full">
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

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="username" {...field} className="bg-gaming-800 border-gaming-700" />
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
                  <Input placeholder="Display Name" {...field} className="bg-gaming-800 border-gaming-700" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="gamerLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gamer Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gaming-800 border-gaming-700">
                    <SelectValue placeholder="Select your gamer level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GAMER_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="favoriteGame"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Favorite Game</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="Enter your favorite game" 
                    {...field} 
                    className="bg-gaming-800 border-gaming-700 pl-10"
                  />
                  <Gamepad2 className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                </div>
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
                  placeholder="Tell us about your gaming journey..."
                  className="resize-none bg-gaming-800 border-gaming-700 min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="twitchUsername"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Twitch Username</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="Your Twitch username" 
                      {...field} 
                      className="bg-gaming-800 border-gaming-700 pl-10"
                    />
                    <Twitch className="absolute left-3 top-2.5 h-5 w-5 text-purple-500" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discordUsername"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discord Username</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Your Discord username" 
                    {...field} 
                    className="bg-gaming-800 border-gaming-700"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Social Links
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="socialLinks.twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter</FormLabel>
                  <FormControl>
                    <Input placeholder="Twitter username" {...field} className="bg-gaming-800 border-gaming-700" />
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
                    <Input placeholder="YouTube channel" {...field} className="bg-gaming-800 border-gaming-700" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialLinks.twitch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitch</FormLabel>
                  <FormControl>
                    <Input placeholder="Twitch username" {...field} className="bg-gaming-800 border-gaming-700" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

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