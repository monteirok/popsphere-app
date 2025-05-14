import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDate, getInitials } from "@/lib/utils";
import { ChatMessageWithSender } from "@shared/schema";
import { PinIcon } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageWithSender;
  isCurrentUser: boolean;
}

export function ChatMessage({ message, isCurrentUser }: ChatMessageProps) {
  const { sender, message: messageText, createdAt, isPinned } = message;
  
  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isCurrentUser ? "justify-end" : "justify-start"
    )}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.profileImage || undefined} alt={sender.displayName} />
          <AvatarFallback>{getInitials(sender.displayName)}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-[70%] relative", 
        isPinned ? "bg-amber-50 dark:bg-amber-950" : "",
        isCurrentUser ? "bg-brand dark:bg-brand-dark text-white rounded-2xl rounded-tr-sm" : "bg-muted rounded-2xl rounded-tl-sm"
      )}>
        {isPinned && (
          <div className="absolute top-2 right-2">
            <PinIcon className="h-3 w-3 text-amber-500" />
          </div>
        )}
        
        <div className="px-4 py-3">
          {!isCurrentUser && (
            <div className="font-semibold text-xs mb-1">
              {sender.displayName}
            </div>
          )}
          
          <div className="whitespace-pre-wrap">
            {messageText}
          </div>
          
          <div className="text-xs opacity-70 mt-1">
            {formatDate(createdAt)}
          </div>
        </div>
      </div>
      
      {isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.profileImage || undefined} alt={sender.displayName} />
          <AvatarFallback>{getInitials(sender.displayName)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}