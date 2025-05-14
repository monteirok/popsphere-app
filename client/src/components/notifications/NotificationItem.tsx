import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/lib/utils";
import { NotificationWithActor } from "@shared/schema";
import { 
  MessageSquareIcon, 
  ThumbsUpIcon, 
  UserPlusIcon, 
  RefreshCcwIcon,
  CheckIcon,
  XIcon
} from "lucide-react";

interface NotificationItemProps {
  notification: NotificationWithActor;
  onMarkAsRead: (id: number) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const { id, type, content, createdAt, read, actor } = notification;

  // Determine icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'trade_request':
        return <RefreshCcwIcon className="h-4 w-4 text-pop-pink" />;
      case 'trade_accepted':
        return <CheckIcon className="h-4 w-4 text-green-500" />;
      case 'trade_rejected':
        return <XIcon className="h-4 w-4 text-red-500" />;
      case 'trade_completed':
        return <CheckIcon className="h-4 w-4 text-green-500" />;
      case 'follow':
        return <UserPlusIcon className="h-4 w-4 text-blue-500" />;
      case 'like':
        return <ThumbsUpIcon className="h-4 w-4 text-pop-pink" />;
      case 'comment':
        return <MessageSquareIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageSquareIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleClick = () => {
    if (!read) {
      onMarkAsRead(id);
    }
  };
  
  return (
    <div 
      className={`flex items-start gap-3 p-3 ${read ? 'opacity-80' : 'bg-muted/30'} cursor-pointer hover:bg-muted/50 transition-colors`}
      onClick={handleClick}
    >
      {actor ? (
        <Avatar className="h-9 w-9">
          <AvatarImage src={actor.profileImage || undefined} alt={actor.displayName} />
          <AvatarFallback>{getInitials(actor.displayName)}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="h-9 w-9 flex items-center justify-center rounded-full bg-muted">
          {getIcon()}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="text-sm">{content}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {formatDate(createdAt)}
        </div>
      </div>
      
      {!read && (
        <div className="h-2 w-2 bg-pop-pink rounded-full mt-1.5"></div>
      )}
    </div>
  );
}