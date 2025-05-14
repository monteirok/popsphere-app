import { useQuery } from "@tanstack/react-query";
import { NotificationsPopover } from "../notifications/NotificationsPopover";

export default function NotificationDropdown() {
  // Fetch unread notification count
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/notifications/unread-count');
      if (!res.ok) throw new Error('Failed to fetch unread count');
      return res.json();
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });
  
  return <NotificationsPopover unreadCount={unreadCount} />;
}