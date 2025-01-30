import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface DatabaseProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  website: string | null;
  bio: string | null;
  bio_description: string | null;
  display_name: string | null;
  custom_theme: any;
  social_links: any;
  theme_preference: string | null;
  font_size: string | null;
  enable_notifications: boolean;
  enable_sounds: boolean;
  keyboard_shortcuts: boolean;
  is_verified: boolean;
  verification_requested_at: string | null;
  verification_approved_at: string | null;
  verification_rejected_at: string | null;
  verification_rejected_reason: string | null;
  onboarding_completed: boolean;
  onboarding_step: string | null;
  preferred_language: string | null;
  created_at: string;
  favorite_game: string | null;
  gaming_platforms: string[] | null;
  gamer_level: string | null;
  twitch_username: string | null;
  discord_username: string | null;
}

const formSchema = z.object({
  username: z.string().min(2).max(50),
  display_name: z.string().min(2).max(50),
  bio: z.string().max(160).optional(),
  website: z.string().url().optional().or(z.literal("")),
  favorite_game: z.string().optional(),
  gaming_platforms: z.array(z.string()).optional(),
  gamer_level: z.string().optional(),
  twitch_username: z.string().optional(),
  discord_username: z.string().optional(),
});

const ProfileEditForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      display_name: '',
      bio: '',
      website: '',
      favorite_game: '',
      gaming_platforms: [],
      gamer_level: '',
      twitch_username: '',
      discord_username: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', data.id);

    if (error) {
      toast.error("Error updating profile");
    } else {
      toast.success("Profile updated successfully");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <Input {...form.register("username")} />
          </FormControl>
          <FormMessage />
        </FormItem>
        <FormItem>
          <FormLabel>Display Name</FormLabel>
          <FormControl>
            <Input {...form.register("display_name")} />
          </FormControl>
          <FormMessage />
        </FormItem>
        <FormItem>
          <FormLabel>Bio</FormLabel>
          <FormControl>
            <Textarea {...form.register("bio")} />
          </FormControl>
          <FormMessage />
        </FormItem>
        <FormItem>
          <FormLabel>Website</FormLabel>
          <FormControl>
            <Input {...form.register("website")} />
          </FormControl>
          <FormMessage />
        </FormItem>
        <FormItem>
          <FormLabel>Favorite Game</FormLabel>
          <FormControl>
            <Input {...form.register("favorite_game")} />
          </FormControl>
          <FormMessage />
        </FormItem>
        <FormItem>
          <FormLabel>Gaming Platforms</FormLabel>
          <FormControl>
            <Input {...form.register("gaming_platforms")} />
          </FormControl>
          <FormMessage />
        </FormItem>
        <FormItem>
          <FormLabel>Gamer Level</FormLabel>
          <FormControl>
            <Input {...form.register("gamer_level")} />
          </FormControl>
          <FormMessage />
        </FormItem>
        <FormItem>
          <FormLabel>Twitch Username</FormLabel>
          <FormControl>
            <Input {...form.register("twitch_username")} />
          </FormControl>
          <FormMessage />
        </FormItem>
        <FormItem>
          <FormLabel>Discord Username</FormLabel>
          <FormControl>
            <Input {...form.register("discord_username")} />
          </FormControl>
          <FormMessage />
        </FormItem>
        <Button type="submit">Update Profile</Button>
      </form>
    </Form>
  );
};

export default ProfileEditForm;
