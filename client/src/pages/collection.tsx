import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import CollectionHeader from "../components/collection/CollectionHeader";
import CollectionGrid from "../components/collection/CollectionGrid";
import CommunityFeedWidget from "../components/community/CommunityFeedWidget";
import UserSuggestionsWidget from "../components/community/UserSuggestionsWidget";

export default function Collection() {
  const { user } = useAuth();
  const [sort, setSort] = useState("newest");
  const [seriesFilter, setSeriesFilter] = useState("all");
  
  if (!user) {
    return <div>Please log in to view your collection.</div>;
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Collection */}
      <div className="lg:col-span-2">
        <CollectionHeader 
          userId={user.id} 
          onSortChange={setSort}
          onSeriesFilterChange={setSeriesFilter}
        />
        
        <CollectionGrid 
          userId={user.id}
          series={seriesFilter}
          sort={sort}
        />
      </div>
      
      {/* Right Column - Trades and Social */}
      <div className="space-y-6">
        <ActiveTradesWidget userId={user.id} />
        <CommunityFeedWidget />
        <UserSuggestionsWidget />
      </div>
    </div>
  );
}

// Active Trades Widget Component
function ActiveTradesWidget({ userId }: { userId: number }) {
  const { data: trades = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/trades"],
    refetchInterval: 10000, // Auto refresh every 10 seconds
  });
  
  // Filter to only pending trades and limit to 2
  const pendingTrades = (trades as any[])
    .filter(trade => trade.status === "pending")
    .slice(0, 2);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-custom p-4 shadow-soft dark:shadow-soft-dark">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold font-nunito">Active Trades</h2>
        <a href="/trades" className="text-pop-pink dark:text-brand-dark text-sm font-medium">View All</a>
      </div>
      
      {isLoading ? (
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pop-pink dark:border-brand-dark"></div>
        </div>
      ) : pendingTrades.length > 0 ? (
        pendingTrades.map((trade: any) => (
          <div key={trade.id} className="trade-card bg-gray-50 dark:bg-gray-700 rounded-custom p-3 mb-3 transition-transform duration-200 cursor-pointer">
            <div className="flex items-center mb-2">
              <img 
                src={trade.proposerId === userId ? trade.receiver.profileImage : trade.proposer.profileImage} 
                alt="User" 
                className="w-8 h-8 rounded-full mr-2"
              />
              <div>
                <p className="font-medium text-sm">
                  {trade.proposerId === userId ? trade.receiver.displayName : trade.proposer.displayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {trade.proposerId === userId ? "is considering your trade" : "wants to trade with you"}
                </p>
              </div>
              {new Date(trade.createdAt).getTime() > Date.now() - 86400000 && (
                <div className="ml-auto text-xs bg-soft-blue dark:bg-blue-700 text-white px-2 py-0.5 rounded-full">New</div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">You Give:</p>
                <div className="flex items-center">
                  <img 
                    src={trade.proposerId === userId ? trade.proposerCollectible.image : trade.receiverCollectible.image} 
                    alt="Collectible"
                    className="w-10 h-10 rounded-custom object-cover border border-gray-200 dark:border-gray-600"
                  />
                  <div className="ml-2">
                    <p className="text-xs font-medium">
                      {trade.proposerId === userId ? trade.proposerCollectible.name : trade.receiverCollectible.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {trade.proposerId === userId ? trade.proposerCollectible.variant : trade.receiverCollectible.variant}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pop-pink dark:text-brand-dark">
                  <path d="M7 17 L17 7 M7 7 L17 17"></path>
                </svg>
              </div>
              
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">You Receive:</p>
                <div className="flex items-center">
                  <img 
                    src={trade.proposerId === userId ? trade.receiverCollectible.image : trade.proposerCollectible.image} 
                    alt="Collectible"
                    className="w-10 h-10 rounded-custom object-cover border border-gray-200 dark:border-gray-600"
                  />
                  <div className="ml-2">
                    <p className="text-xs font-medium">
                      {trade.proposerId === userId ? trade.receiverCollectible.name : trade.proposerCollectible.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {trade.proposerId === userId ? trade.receiverCollectible.variant : trade.proposerCollectible.variant}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center p-6 text-gray-500 dark:text-gray-400">
          <p>No active trades</p>
          <p className="text-sm mt-1">Start a trade by clicking on any collectible!</p>
        </div>
      )}
      
      <div className="text-center p-2">
        <a href="/trades" className="text-gray-500 dark:text-gray-400 text-sm hover:text-pop-pink dark:hover:text-brand-dark">Create New Trade Request</a>
      </div>
    </div>
  );
}
