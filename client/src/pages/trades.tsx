import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import TradeCard from "@/components/trade/TradeCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw } from "lucide-react";
import TradeModal from "@/components/trade/TradeModal";
import { TradeWithDetails } from "@shared/schema";

export default function Trades() {
  const { user } = useAuth();
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  
  const [refreshInterval, setRefreshInterval] = useState<number>(10000); // 10 seconds by default for more frequent trade updates
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  const { data: trades = [], isLoading, refetch } = useQuery<TradeWithDetails[]>({
    queryKey: ["/api/trades"],
    refetchInterval: refreshInterval,
  });
  
  // Function to manually refresh trades
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000); // Show refresh animation for at least 1 second
  };
  
  if (!user) {
    return <div>Please log in to view your trades.</div>;
  }
  
  // Auto-refresh when the component mounts
  useEffect(() => {
    handleRefresh();
    
    // Stop auto-refresh when component unmounts
    return () => {
      setRefreshInterval(0);
    };
  }, []);
  
  // Separate trades by status
  const pendingTrades = trades.filter(trade => trade.status === "pending");
  const completedTrades = trades.filter(
    trade => trade.status === "accepted" || trade.status === "completed"
  );
  const rejectedTrades = trades.filter(trade => trade.status === "rejected");
  
  // Separate incoming and outgoing trades
  const incomingTrades = pendingTrades.filter(trade => trade.receiverId === user.id);
  const outgoingTrades = pendingTrades.filter(trade => trade.proposerId === user.id);
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-custom p-4 shadow-soft dark:shadow-soft-dark mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-nunito">Trade Center</h1>
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full h-8 w-8 ${isRefreshing ? 'animate-spin' : ''}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className="h-4 w-4 text-pop-pink dark:text-brand-dark" />
            </Button>
          </div>
          <Button 
            className="bg-pop-pink dark:bg-brand-dark hover:bg-opacity-90 rounded-full"
            onClick={() => setIsTradeModalOpen(true)}
          >
            <Plus className="mr-1 h-4 w-4" /> New Trade
          </Button>
        </div>
        
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-custom mb-4">
          <div className="text-sm dark:text-gray-200">
            <p>Welcome to the Trade Center! Here you can manage all your trade requests with other collectors.</p>
            <p className="mt-1">To start a new trade, browse the collection and click on any item you're interested in.</p>
          </div>
        </div>
        
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full bg-gray-100 dark:bg-gray-700 p-1 rounded-full">
            <TabsTrigger 
              value="pending" 
              className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-pop-pink dark:data-[state=active]:text-brand-dark"
            >
              Pending ({pendingTrades.length})
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-pop-pink dark:data-[state=active]:text-brand-dark"
            >
              Completed ({completedTrades.length})
            </TabsTrigger>
            <TabsTrigger 
              value="rejected" 
              className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-pop-pink dark:data-[state=active]:text-brand-dark"
            >
              Rejected ({rejectedTrades.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-4">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pop-pink dark:border-brand-dark"></div>
              </div>
            ) : pendingTrades.length > 0 ? (
              <div>
                {incomingTrades.length > 0 && (
                  <>
                    <h2 className="text-lg font-semibold mb-2">Incoming Trade Requests</h2>
                    <div className="space-y-3 mb-6">
                      {incomingTrades.map((trade) => (
                        <TradeCard key={trade.id} trade={trade} isUserProposer={false} />
                      ))}
                    </div>
                  </>
                )}
                
                {outgoingTrades.length > 0 && (
                  <>
                    <h2 className="text-lg font-semibold mb-2">Outgoing Trade Requests</h2>
                    <div className="space-y-3">
                      {outgoingTrades.map((trade) => (
                        <TradeCard key={trade.id} trade={trade} isUserProposer={true} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">No pending trades</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Browse the collection to find items to trade!</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-4">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pop-pink dark:border-brand-dark"></div>
              </div>
            ) : completedTrades.length > 0 ? (
              <div className="space-y-3">
                {completedTrades.map((trade) => (
                  <TradeCard 
                    key={trade.id} 
                    trade={trade} 
                    isUserProposer={trade.proposerId === user.id} 
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">No completed trades yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your accepted and completed trades will appear here</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="rejected" className="mt-4">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pop-pink dark:border-brand-dark"></div>
              </div>
            ) : rejectedTrades.length > 0 ? (
              <div className="space-y-3">
                {rejectedTrades.map((trade) => (
                  <TradeCard 
                    key={trade.id} 
                    trade={trade} 
                    isUserProposer={trade.proposerId === user.id}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">No rejected trades</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Trades that were rejected will appear here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Trade Modal */}
      <TradeModal
        open={isTradeModalOpen}
        onOpenChange={(open) => {
          setIsTradeModalOpen(open);
          // When modal closes, refresh trades list
          if (!open) {
            handleRefresh();
          }
        }}
      />
    </div>
  );
}
