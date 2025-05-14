import { useState } from "react";
import { TradeWithDetails } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageCircleIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { TradeChat } from "./TradeChat";

interface ChatViewProps {
  trade: TradeWithDetails;
}

export function ChatView({ trade }: ChatViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { id, status } = trade;
  
  // Only show chat for accepted or completed trades
  if (status !== "accepted" && status !== "completed") {
    return null;
  }
  
  return (
    <Card className="mt-6">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full"
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircleIcon className="h-5 w-5 text-brand" />
              <CardTitle className="text-lg">Trade Chat</CardTitle>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CardDescription>
            Chat with the other collector to discuss shipping details and next steps
          </CardDescription>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-2">
            <TradeChat tradeId={id} />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}