import { NotificationItem } from "./NotificationItem";
import type { Notification } from "@/types/notifications";

interface NotificationGroupProps {
  title: string;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

export const NotificationGroup = ({ title, notifications, onMarkAsRead }: NotificationGroupProps) => {
  if (notifications.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="px-4 text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="divide-y divide-border">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
          />
        ))}
      </div>
    </div>
  );
};