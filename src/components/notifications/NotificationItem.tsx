import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { NotificationIcon } from "./NotificationIcon";
import type { Notification } from "@/types/notifications";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export const NotificationItem = ({ notification, onMarkAsRead }: NotificationItemProps) => {
  return (
    <div className={`flex items-start gap-4 p-4 ${!notification.read ? 'bg-accent/50' : ''}`}>
      <NotificationIcon type={notification.type} className="h-5 w-5 mt-1 text-primary" />
      <div className="flex-1 space-y-1">
        <p className="text-sm">{notification.content}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(notification.created_at), 'p')}
        </p>
      </div>
      {!notification.read && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onMarkAsRead(notification.id)}
          className="h-8"
        >
          Mark as read
        </Button>
      )}
    </div>
  );
};