import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { DatabaseProfile, ProfileFormValues } from "./types";
import { ProfileBasicInfo } from "./ProfileBasicInfo";
import { ProfileGamingInfo } from "./ProfileGamingInfo";

const formSchema = z.object({
  username: z.string().min(2).max(50).nullable(),
  display_name: z.string().min(2).max(50).nullable(),
  bio_description: z.string().max(160).nullable(),
  website: z.string().url().nullable().or(z.literal("")),
  favorite_game: z.string().nullable(),
  gaming_platforms: z.array(z.string()).nullable(),
  gamer_level: z.string().nullable(),
  twitch_username: z.string().nullable(),
  discord_username: z.string().nullable(),
  location: z.string().nullable(),
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

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: profile?.username || null,
      display_name: profile?.display_name || null,
      bio_description: profile?.bio_description || null,
      website: profile?.website || null,
      favorite_game: profile?.favorite_game || null,
      gaming_platforms: profile?.gaming_platforms || null,
      gamer_level: profile?.gamer_level || null,
      twitch_username: profile?.twitch_username || null,
      discord_username: profile?.discord_username || null,
      location: profile?.location || null,
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ProfileBasicInfo form={form} />
        <ProfileGamingInfo form={form} />
        <Button type="submit">Update Profile</Button>
      </form>
    </Form>
  );
};

export default ProfileEditForm;