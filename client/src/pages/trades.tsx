import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import TradeCard from "@/components/trade/TradeCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

export default function Trades() {
  const { user } = useAuth();
  
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["/api/trades"],
  });
  
  if (!user) {
    return <div>Please log in to view your trades.</div>;
  }
  
  // Separate trades by status
  const pendingTrades = (trades as any[]).filter(trade => trade.status === "pending");
  const completedTrades = (trades as any[]).filter(
    trade => trade.status === "accepted" || trade.status === "completed"
  );
  const rejectedTrades = (trades as any[]).filter(trade => trade.status === "rejected");
  
  // Separate incoming and outgoing trades
  const incomingTrades = pendingTrades.filter(trade => trade.receiverId === user.id);
  const outgoingTrades = pendingTrades.filter(trade => trade.proposerId === user.id);
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-custom p-4 shadow-soft mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold font-nunito">Trade Center</h1>
          <Button className="bg-pop-pink hover:bg-opacity-90 rounded-full">
            <Plus className="mr-1 h-4 w-4" /> New Trade
          </Button>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-custom mb-4">
          <div className="text-sm">
            <p>Welcome to the Trade Center! Here you can manage all your trade requests with other collectors.</p>
            <p className="mt-1">To start a new trade, browse the collection and click on any item you're interested in.</p>
          </div>
        </div>
        
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full bg-gray-100 p-1 rounded-full">
            <TabsTrigger 
              value="pending" 
              className="rounded-full data-[state=active]:bg-white data-[state=active]:text-pop-pink"
            >
              Pending ({pendingTrades.length})
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="rounded-full data-[state=active]:bg-white data-[state=active]:text-pop-pink"
            >
              Completed ({completedTrades.length})
            </TabsTrigger>
            <TabsTrigger 
              value="rejected" 
              className="rounded-full data-[state=active]:bg-white data-[state=active]:text-pop-pink"
            >
              Rejected ({rejectedTrades.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-4">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pop-pink"></div>
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
                <p className="text-gray-500">No pending trades</p>
                <p className="text-sm text-gray-400 mt-1">Browse the collection to find items to trade!</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-4">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pop-pink"></div>
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
                <p className="text-gray-500">No completed trades yet</p>
                <p className="text-sm text-gray-400 mt-1">Your accepted and completed trades will appear here</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="rejected" className="mt-4">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pop-pink"></div>
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
                <p className="text-gray-500">No rejected trades</p>
                <p className="text-sm text-gray-400 mt-1">Trades that were rejected will appear here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
