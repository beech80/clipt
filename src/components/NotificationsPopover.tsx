import { useEffect } from "react";
import { Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationBadge } from "./notifications/NotificationBadge";
import { NotificationList } from "./notifications/NotificationList";
import { NotificationService } from "@/services/notificationService";

export const NotificationsPopover = () => {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: NotificationService.fetchNotifications,
  });

  const markAsReadMutation = useMutation({
    mutationFn: NotificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const unsubscribe = NotificationService.subscribeToNewNotifications((payload) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.info("New notification received", {
        action: {
          label: "View",
          onClick: () => {
            const notificationTrigger = document.querySelector('[aria-label="Notifications"]');
            if (notificationTrigger instanceof HTMLElement) {
              notificationTrigger.click();
            }
          },
        },
      });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <NotificationBadge count={unreadCount} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                notifications
                  .filter(n => !n.read)
                  .forEach(n => markAsReadMutation.mutate(n.id));
              }}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            <NotificationList
              notifications={notifications}
              onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};