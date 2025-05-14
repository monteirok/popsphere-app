import React, { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, formatDate } from '@/lib/utils';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

export type Notification = {
  id: number;
  userId: number;
  type: string;
  content: string;
  sourceId?: number;
  sourceType?: string;
  actorId?: number;
  read: boolean;
  createdAt: string;
  actor?: {
    id: number;
    username: string;
    displayName: string;
    profileImage: string | null;
  };
};

export default function NotificationDropdown() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: user ? ['/api/notifications'] : null,
    queryFn: () => fetch('/api/notifications').then(res => res.json()),
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!user,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: user ? ['/api/notifications/unread-count'] : null,
    queryFn: () => fetch('/api/notifications/unread-count').then(res => res.json()),
    refetchInterval: 30000,
    enabled: !!user,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/notifications/mark-all-read');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trade_request':
        return '🔄';
      case 'trade_accepted':
        return '✅';
      case 'trade_rejected':
        return '❌';
      case 'trade_completed':
        return '🎉';
      case 'follow':
        return '👤';
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      default:
        return '📣';
    }
  };

  const getNotificationLink = (notification: Notification) => {
    const { sourceType, sourceId } = notification;
    
    if (!sourceType || !sourceId) return '';
    
    switch (sourceType) {
      case 'trade':
        return `/trades`;
      case 'post':
        return `/community`;
      case 'user':
        return `/profile/${sourceId}`;
      default:
        return '';
    }
  };

  const handleMarkAllAsRead = () => {
    if (notifications.length > 0) {
      markAllAsReadMutation.mutate();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-pink-500"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No notifications yet</div>
          ) : (
            notifications.map((notification: Notification) => (
              <a 
                key={notification.id} 
                href={getNotificationLink(notification)}
                className={cn(
                  "flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors border-b last:border-0",
                  !notification.read && "bg-muted/30"
                )}
                onClick={() => setOpen(false)}
              >
                {notification.actor ? (
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={notification.actor.profileImage || ''} />
                    <AvatarFallback>{getInitials(notification.actor.displayName)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-9 w-9 flex items-center justify-center bg-muted rounded-full">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-tight">{notification.content}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(new Date(notification.createdAt))}</p>
                </div>
              </a>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}