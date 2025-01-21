import { Bell, Gift, Trophy, MessageSquare, Heart, UserPlus, Star } from "lucide-react";
import { NotificationType } from "@/types/notifications";

interface NotificationIconProps {
  type: NotificationType;
  className?: string;
}

export const NotificationIcon = ({ type, className = "" }: NotificationIconProps) => {
  switch (type) {
    case "achievement":
      return <Trophy className={className} />;
    case "level_up":
      return <Star className={className} />;
    case "gift":
      return <Gift className={className} />;
    case "message":
      return <MessageSquare className={className} />;
    case "like":
      return <Heart className={className} />;
    case "follow":
      return <UserPlus className={className} />;
    default:
      return <Bell className={className} />;
  }
};