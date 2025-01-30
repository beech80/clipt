import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Trophy } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { ProfileFormValues } from "./types"

interface ProfileSocialLinksProps {
  form: UseFormReturn<ProfileFormValues>
}

export function ProfileSocialLinks({ form }: ProfileSocialLinksProps) {
  return (
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
  )
}