import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, SendIcon } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatMessageWithSender } from "@shared/schema";

interface TradeChatProps {
  tradeId: number;
}

type ChatFormValues = {
  message: string;
};

export function TradeChat({ tradeId }: TradeChatProps) {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ChatFormValues>({
    defaultValues: {
      message: ""
    }
  });
  
  // Get chat messages
  const { data: messages = [], isLoading, error } = useQuery<ChatMessageWithSender[]>({
    queryKey: ['/api/trades', tradeId, 'messages'],
    queryFn: async () => {
      const res = await fetch(`/api/trades/${tradeId}/messages`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    refetchInterval: 5000 // Poll every 5 seconds for new messages
  });
  
  // Find pinned message (if any)
  const pinnedMessage = messages.find(message => message.isPinned);
  const regularMessages = messages.filter(message => !message.isPinned);
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: ChatFormValues) => {
      const res = await apiRequest('POST', `/api/trades/${tradeId}/messages`, data);
      return res.json();
    },
    onSuccess: () => {
      reset();
      // Invalidate messages cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['/api/trades', tradeId, 'messages'] });
      // Enable auto-scroll when sending a message
      setAutoScroll(true);
    }
  });
  
  // Handle form submission
  const onSubmit = handleSubmit((data) => {
    if (data.message.trim() === '') return;
    sendMessageMutation.mutate(data);
  });
  
  // Scroll to bottom when new messages arrive and autoScroll is enabled
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);
  
  // Detect manual scroll to disable auto-scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const div = e.currentTarget;
    const isScrolledToBottom = Math.abs(div.scrollHeight - div.clientHeight - div.scrollTop) < 50;
    setAutoScroll(isScrolledToBottom);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-destructive">
        Error loading messages. Please try again.
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden">
      {/* Pinned message */}
      {pinnedMessage && (
        <div className="bg-amber-50 dark:bg-amber-950 p-3 border-b">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">Trade Details</p>
          <div className="text-sm whitespace-pre-wrap">{pinnedMessage.message}</div>
        </div>
      )}
      
      {/* Chat messages */}
      <ScrollArea 
        className="flex-1 p-4" 
        ref={scrollRef} 
        onScroll={handleScroll}
      >
        {regularMessages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div>
            {regularMessages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                isCurrentUser={message.senderId === user?.id}
              />
            ))}
          </div>
        )}
      </ScrollArea>
      
      <Separator />
      
      {/* Message input */}
      <form onSubmit={onSubmit} className="p-3 flex gap-2">
        <Input
          {...register("message")}
          placeholder="Type your message..."
          disabled={isSubmitting}
          className="flex-1"
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendIcon className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}