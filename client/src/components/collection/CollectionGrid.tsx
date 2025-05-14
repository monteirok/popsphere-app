import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CollectionItemCard from "./CollectionItemCard";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import AddItemModal from "./AddItemModal";
import { Collectible } from "@shared/schema";

interface CollectionGridProps {
  userId: number;
  series?: string;
  sort?: string;
}

export default function CollectionGrid({ userId, series = "all", sort = "newest" }: CollectionGridProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const { data: collectibles = [], isLoading, isError } = useQuery({
    queryKey: [`/api/collectibles?userId=${userId}`],
  });

  // Filter by series if needed
  const filteredCollectibles = series === "all" 
    ? collectibles 
    : collectibles.filter((item: Collectible) => item.series === series);

  // Sort the collectibles
  const sortedCollectibles = [...filteredCollectibles].sort((a: Collectible, b: Collectible) => {
    switch (sort) {
      case "newest":
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case "oldest":
        return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
      case "a-z":
        return a.name.localeCompare(b.name);
      case "rarity": {
        const rarityOrder: Record<string, number> = {
          'common': 0,
          'rare': 1,
          'ultra-rare': 2,
          'limited': 3
        };
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      }
      default:
        return 0;
    }
  });

  // Paginate the results
  const paginatedCollectibles = sortedCollectibles.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = paginatedCollectibles.length < sortedCollectibles.length;

  if (isLoading) {
    return (
      <div className="bg-white rounded-custom p-4 shadow-soft flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pop-pink"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-custom p-4 shadow-soft">
        <p className="text-center text-red-500">Failed to load collection. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-custom p-4 shadow-soft">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {paginatedCollectibles.map((collectible: Collectible) => (
          <CollectionItemCard 
            key={collectible.id} 
            collectible={collectible} 
          />
        ))}
        
        {/* Add new item placeholder */}
        <div 
          className="collection-item border-2 border-dashed border-gray-200 rounded-custom flex flex-col items-center justify-center p-4 hover:border-pop-pink cursor-pointer transition-colors aspect-square"
          onClick={() => setIsAddModalOpen(true)}
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
            <PlusIcon className="text-gray-400 h-6 w-6" />
          </div>
          <p className="text-sm text-gray-500">Add New Item</p>
        </div>
      </div>
      
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button 
            onClick={() => setPage(page + 1)}
            variant="outline" 
            className="bg-gray-100 hover:bg-gray-200 text-dark-grey rounded-full px-6 py-2 font-medium text-sm transition"
          >
            Load More Items
          </Button>
        </div>
      )}
      
      <AddItemModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
      />
    </div>
  );
}
