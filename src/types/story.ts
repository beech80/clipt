export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  text_content: string | null;
  background_color: string | null;
  font_style: string | null;
  profiles: {
    username: string;
    avatar_url: string;
  };
}