import { useState } from "react";
import { MoreHorizontal, Pencil, RefreshCw } from "lucide-react";
import { Collectible } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import RarityBadge from "@/components/ui/rarity-badge";
import TradeModal from "@/components/trade/TradeModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CollectionItemCardProps {
  collectible: Collectible;
}

export default function CollectionItemCard({ collectible }: CollectionItemCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: toggleForTrade } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "PATCH", 
        `/api/collectibles/${collectible.id}`,
        { forTrade: !collectible.forTrade }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/collectibles?userId=${collectible.userId}`] });
      toast({
        title: collectible.forTrade ? "Item removed from trades" : "Item available for trade",
        description: collectible.forTrade 
          ? "This item is no longer available for trading." 
          : "Other collectors can now request to trade for this item.",
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

  return (
    <>
      <div className="collection-item relative group">
        <div className="aspect-square rounded-custom overflow-hidden bg-gray-100 relative">
          <img 
            src={collectible.image} 
            alt={`${collectible.name} - ${collectible.variant}`}
            className="w-full h-full object-cover"
          />
          {collectible.series && (
            <div className="absolute top-2 right-2 bg-pop-pink text-white text-xs px-1.5 py-0.5 rounded-full">
              {collectible.series}
            </div>
          )}
        </div>
        <div className="mt-2">
          <h3 className="font-medium truncate">{collectible.name}</h3>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">{collectible.variant}</p>
            <RarityBadge rarity={collectible.rarity} />
          </div>
        </div>
        <div className="item-actions opacity-0 group-hover:opacity-100 absolute inset-0 bg-black bg-opacity-50 rounded-custom flex items-center justify-center space-x-2 transition-opacity">
          <button 
            onClick={() => setShowTradeModal(true)}
            className="bg-white text-dark-grey rounded-full w-9 h-9 flex items-center justify-center hover:bg-pop-pink hover:text-white transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setShowDetails(true)}
            className="bg-white text-dark-grey rounded-full w-9 h-9 flex items-center justify-center hover:bg-pop-pink hover:text-white transition"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button className="bg-white text-dark-grey rounded-full w-9 h-9 flex items-center justify-center hover:bg-pop-pink hover:text-white transition">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{collectible.name}</DialogTitle>
            <DialogDescription>{collectible.variant}</DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4">
            <div className="mx-auto w-full max-w-[200px] aspect-square rounded-custom overflow-hidden">
              <img 
                src={collectible.image} 
                alt={`${collectible.name} - ${collectible.variant}`}
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-semibold">Series:</div>
              <div>{collectible.series}</div>
              
              <div className="font-semibold">Rarity:</div>
              <div className="flex items-center">
                <RarityBadge rarity={collectible.rarity} showText />
              </div>
              
              <div className="font-semibold">Added on:</div>
              <div>{new Date(collectible.addedAt).toLocaleDateString()}</div>
              
              <div className="font-semibold">Available for trade:</div>
              <div>{collectible.forTrade ? "Yes" : "No"}</div>
            </div>
            
            {collectible.description && (
              <div className="text-sm">
                <div className="font-semibold mb-1">Description:</div>
                <p className="text-gray-700">{collectible.description}</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex sm:justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => toggleForTrade()}
            >
              {collectible.forTrade ? "Remove from Trades" : "Make Available for Trade"}
            </Button>
            <Button onClick={() => setShowTradeModal(true)}>
              Propose Trade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trade Modal */}
      <TradeModal 
        open={showTradeModal} 
        onOpenChange={setShowTradeModal}
        offeredCollectible={collectible}
      />
    </>
  );
}
