import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TradeWithDetails } from "@shared/schema";
import { AvatarWithStatus } from "@/components/ui/avatar-with-status";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RarityBadge from "@/components/ui/rarity-badge";

interface TradeCardProps {
  trade: TradeWithDetails;
  isUserProposer: boolean;
}

export default function TradeCard({ trade, isUserProposer }: TradeCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { mutate: updateTradeStatus, isPending } = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PATCH", `/api/trades/${trade.id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({
        title: "Trade updated",
        description: "The trade status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update trade status. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-soft-blue";
      case "accepted":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "completed":
        return "bg-golden-yellow";
      default:
        return "bg-gray-400";
    }
  };
  
  const isNew = new Date(trade.createdAt).getTime() > Date.now() - 86400000; // 24 hours
  
  return (
    <div className="trade-card bg-gray-50 rounded-custom p-3 mb-3 transition-transform duration-200 cursor-pointer">
      <div className="flex items-center mb-2">
        <AvatarWithStatus
          src={isUserProposer ? trade.receiver.profileImage : trade.proposer.profileImage}
          alt={isUserProposer ? trade.receiver.displayName : trade.proposer.displayName}
          status={isNew ? "new" : undefined}
          className="w-8 h-8 rounded-full mr-2"
        />
        <div>
          <p className="font-medium text-sm">
            {isUserProposer ? trade.receiver.displayName : trade.proposer.displayName}
          </p>
          <p className="text-xs text-gray-500">
            {isUserProposer ? "is considering your trade" : "wants to trade with you"}
          </p>
        </div>
        <div className={`ml-auto text-xs ${getStatusClass(trade.status)} text-white px-2 py-0.5 rounded-full`}>
          {isNew && trade.status === "pending" ? "New" : trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">You Give:</p>
          <div className="flex items-center">
            <img 
              src={isUserProposer ? trade.proposerCollectible.image : trade.receiverCollectible.image} 
              alt={isUserProposer ? trade.proposerCollectible.name : trade.receiverCollectible.name} 
              className="w-10 h-10 rounded-custom object-cover border border-gray-200"
            />
            <div className="ml-2">
              <p className="text-xs font-medium">
                {isUserProposer ? trade.proposerCollectible.name : trade.receiverCollectible.name}
              </p>
              <p className="text-xs text-gray-500">
                {isUserProposer ? trade.proposerCollectible.variant : trade.receiverCollectible.variant}
              </p>
            </div>
          </div>
        </div>
        
        <div className="px-2">
          <ArrowLeftRight className="text-pop-pink h-4 w-4" />
        </div>
        
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">You Receive:</p>
          <div className="flex items-center">
            <img 
              src={isUserProposer ? trade.receiverCollectible.image : trade.proposerCollectible.image} 
              alt={isUserProposer ? trade.receiverCollectible.name : trade.proposerCollectible.name} 
              className="w-10 h-10 rounded-custom object-cover border border-gray-200"
            />
            <div className="ml-2">
              <p className="text-xs font-medium">
                {isUserProposer ? trade.receiverCollectible.name : trade.proposerCollectible.name}
              </p>
              <div className="flex items-center">
                <p className="text-xs text-gray-500">
                  {isUserProposer ? trade.receiverCollectible.variant : trade.proposerCollectible.variant}
                </p>
                <RarityBadge 
                  rarity={isUserProposer ? trade.receiverCollectible.rarity : trade.proposerCollectible.rarity} 
                  size="xs"
                  className="ml-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {trade.status === "pending" && !isUserProposer && (
        <div className="flex mt-3 space-x-2">
          <Button 
            onClick={() => updateTradeStatus("accepted")}
            disabled={isPending}
            size="sm"
            className="flex-1 bg-pop-pink hover:bg-opacity-90 text-white rounded-full px-3 py-1.5 text-xs font-medium transition"
          >
            Accept Trade
          </Button>
          <Button 
            onClick={() => updateTradeStatus("rejected")}
            disabled={isPending}
            variant="outline"
            size="sm"
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-dark-grey rounded-full px-3 py-1.5 text-xs font-medium transition"
          >
            Decline
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className="bg-white border border-gray-200 text-dark-grey rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition p-0"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {trade.status === "pending" && isUserProposer && (
        <div className="flex mt-3">
          <Button 
            onClick={() => updateTradeStatus("rejected")}
            disabled={isPending}
            variant="outline"
            size="sm"
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-dark-grey rounded-full px-3 py-1.5 text-xs font-medium transition"
          >
            Cancel Request
          </Button>
        </div>
      )}
      
      {trade.status === "accepted" && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-custom text-center text-xs text-green-700">
          <div className="flex items-center justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            Trade accepted! Coordinate with the other collector to complete the exchange.
          </div>
        </div>
      )}
      
      {trade.status === "rejected" && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-custom text-center text-xs text-red-700">
          <div className="flex items-center justify-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            Trade declined. Better luck next time!
          </div>
        </div>
      )}
    </div>
  );
}
