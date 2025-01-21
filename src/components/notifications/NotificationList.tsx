import { isToday, isYesterday } from "date-fns";
import { NotificationGroup } from "./NotificationGroup";
import type { Notification } from "@/types/notifications";

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

export const NotificationList = ({ notifications, onMarkAsRead }: NotificationListProps) => {
  const groupedNotifications = notifications.reduce(
    (groups, notification) => {
      const date = new Date(notification.created_at);
      if (isToday(date)) {
        groups.today.push(notification);
      } else if (isYesterday(date)) {
        groups.yesterday.push(notification);
      } else {
        groups.older.push(notification);
      }
      return groups;
    },
    { today: [], yesterday: [], older: [] } as Record<string, Notification[]>
  );

  return (
    <div className="space-y-6">
      <NotificationGroup
        title="Today"
        notifications={groupedNotifications.today}
        onMarkAsRead={onMarkAsRead}
      />
      <NotificationGroup
        title="Yesterday"
        notifications={groupedNotifications.yesterday}
        onMarkAsRead={onMarkAsRead}
      />
      <NotificationGroup
        title="Older"
        notifications={groupedNotifications.older}
        onMarkAsRead={onMarkAsRead}
      />
    </div>
  );
};