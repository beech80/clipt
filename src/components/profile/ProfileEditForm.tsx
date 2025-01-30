import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { DatabaseProfile } from "./types";

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
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as DatabaseProfile;
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: profile?.username || '',
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      website: profile?.website || '',
      favorite_game: profile?.favorite_game || '',
      gaming_platforms: profile?.gaming_platforms || [],
      gamer_level: profile?.gamer_level || '',
      twitch_username: profile?.twitch_username || '',
      discord_username: profile?.discord_username || '',
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (error) {
      toast.error("Error updating profile");
    } else {
      toast.success("Profile updated successfully");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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