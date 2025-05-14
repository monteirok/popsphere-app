import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Collectible } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeftRight } from "lucide-react";
import { useAuth } from "@/auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface TradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offeredCollectible?: Collectible;
}

export default function TradeModal({ open, onOpenChange, offeredCollectible }: TradeModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedCollectible, setSelectedCollectible] = useState<string>("");
  
  // Fetch all collectibles available for trade
  const { data: tradeCollectibles = [], isLoading: isLoadingCollectibles } = useQuery<any[]>({
    queryKey: ["/api/collectibles?forTrade=true"],
    enabled: open,
  });
  
  // Filter out the current user's collectibles and the offered collectible
  const otherUserCollectibles = tradeCollectibles.filter(
    (collectible) => collectible.userId !== user?.id && (!offeredCollectible || collectible.id !== offeredCollectible.id)
  );
  
  // Group collectibles by user
  const collectiblesByUser: Record<string, any[]> = {};
  otherUserCollectibles.forEach((collectible) => {
    const userId = collectible.user.id.toString();
    if (!collectiblesByUser[userId]) {
      collectiblesByUser[userId] = [];
    }
    collectiblesByUser[userId].push(collectible);
  });
  
  // Mutations for creating a trade
  const { mutate: createTrade, isPending } = useMutation({
    mutationFn: async (tradeData: {
      proposerCollectibleId: number;
      receiverId: number;
      receiverCollectibleId: number;
      message: string;
    }) => {
      const response = await apiRequest("POST", "/api/trades", tradeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      onOpenChange(false);
      setMessage("");
      setSelectedUser("");
      setSelectedCollectible("");
      toast({
        title: "Trade proposed!",
        description: "Your trade request has been sent to the collector.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error proposing trade",
        description: "There was an error sending your trade proposal. Please try again.",
        variant: "destructive",
      });
      console.error("Trade proposal error:", error);
    },
  });
  
  const handleSubmit = () => {
    if (!offeredCollectible) {
      toast({
        title: "Missing collectible",
        description: "Please select a collectible to offer for trade.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedCollectible) {
      toast({
        title: "Missing collectible",
        description: "Please select a collectible you want to receive.",
        variant: "destructive",
      });
      return;
    }
    
    const receiverCollectible = otherUserCollectibles.find(
      (c) => c.id.toString() === selectedCollectible
    );
    
    if (!receiverCollectible) {
      toast({
        title: "Invalid selection",
        description: "The selected collectible is not available.",
        variant: "destructive",
      });
      return;
    }
    
    createTrade({
      proposerCollectibleId: offeredCollectible.id,
      receiverId: receiverCollectible.userId,
      receiverCollectibleId: receiverCollectible.id,
      message: message,
    });
  };
  
  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    setSelectedCollectible("");
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-pop-pink">Propose Trade</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <p className="text-sm font-medium mb-2">You Offer</p>
            {offeredCollectible ? (
              <div className="w-24 h-24 mx-auto rounded-custom overflow-hidden border-2 border-pop-pink">
                <img 
                  src={offeredCollectible.image} 
                  alt={offeredCollectible.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 mx-auto bg-gray-100 rounded-custom flex items-center justify-center border-2 border-dashed border-gray-200">
                <span className="text-gray-400 text-sm">Select an item</span>
              </div>
            )}
            {offeredCollectible && (
              <div className="mt-2 text-xs">
                <p className="font-medium">{offeredCollectible.name}</p>
                <p className="text-gray-500">{offeredCollectible.variant}</p>
              </div>
            )}
          </div>
          
          <div className="px-4">
            <ArrowLeftRight className="text-pop-pink h-5 w-5" />
          </div>
          
          <div className="text-center flex-1">
            <p className="text-sm font-medium mb-2">You Request</p>
            {selectedCollectible && otherUserCollectibles.find(c => c.id.toString() === selectedCollectible) ? (
              <div className="w-24 h-24 mx-auto rounded-custom overflow-hidden border-2 border-pop-pink">
                <img 
                  src={otherUserCollectibles.find(c => c.id.toString() === selectedCollectible)?.image} 
                  alt={otherUserCollectibles.find(c => c.id.toString() === selectedCollectible)?.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 mx-auto bg-gray-100 rounded-custom flex items-center justify-center border-2 border-dashed border-gray-200">
                <span className="text-gray-400 text-sm">Select an item</span>
              </div>
            )}
            {selectedCollectible && otherUserCollectibles.find(c => c.id.toString() === selectedCollectible) && (
              <div className="mt-2 text-xs">
                <p className="font-medium">
                  {otherUserCollectibles.find(c => c.id.toString() === selectedCollectible)?.name}
                </p>
                <p className="text-gray-500">
                  {otherUserCollectibles.find(c => c.id.toString() === selectedCollectible)?.variant}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {isLoadingCollectibles ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Collector</label>
              <Select value={selectedUser} onValueChange={handleUserChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a collector" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(collectiblesByUser).map(([userId, collectibles]) => (
                    <SelectItem key={userId} value={userId}>
                      {collectibles[0].user.displayName} ({collectibles.length} items)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedUser && (
              <div>
                <label className="block text-sm font-medium mb-1">Select Collectible</label>
                <Select value={selectedCollectible} onValueChange={setSelectedCollectible}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a collectible" />
                  </SelectTrigger>
                  <SelectContent>
                    {collectiblesByUser[selectedUser]?.map((collectible) => (
                      <SelectItem key={collectible.id} value={collectible.id.toString()}>
                        {collectible.name} - {collectible.variant}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-1">Add a message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-custom border border-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-pop-pink resize-none"
            rows={3}
            placeholder="What would you like to say?"
          />
        </div>
        
        <DialogFooter className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!offeredCollectible || !selectedCollectible || isPending}
            className="bg-pop-pink hover:bg-opacity-90 text-white"
          >
            {isPending ? "Sending..." : "Send Trade Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
