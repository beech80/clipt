import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Gamepad2, Twitch } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { ProfileFormValues } from "./types"

const GAMER_LEVELS = [
  "Casual",
  "Competitive",
  "Pro",
  "Streamer",
  "Content Creator",
  "Esports Player",
]

interface ProfileGamingInfoProps {
  form: UseFormReturn<ProfileFormValues>
}

export function ProfileGamingInfo({ form }: ProfileGamingInfoProps) {
  return (
    <>
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
    </>
  )
}