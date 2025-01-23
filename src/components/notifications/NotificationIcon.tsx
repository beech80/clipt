import { Bell, Gift, Trophy, MessageSquare, Heart, UserPlus, Star, Video } from "lucide-react";
import { NotificationType } from "@/types/notifications";

interface NotificationIconProps {
  type: NotificationType;
  className?: string;
}

export const NotificationIcon = ({ type, className = "" }: NotificationIconProps) => {
  switch (type) {
    case "follow":
      return <UserPlus className={className} />;
    case "like":
      return <Heart className={className} />;
    case "comment":
      return <MessageSquare className={className} />;
    case "mention":
      return <Star className={className} />;
    case "stream_live":
      return <Video className={className} />;
    case "reply":
      return <MessageSquare className={className} />;
    default:
      return <Bell className={className} />;
  }
};