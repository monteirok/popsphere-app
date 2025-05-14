import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { PlusIcon } from "lucide-react";
import AddItemModal from "./AddItemModal";
import { useToast } from "@/hooks/use-toast";

interface CollectionHeaderProps {
  userId: number;
  onSortChange: (sort: string) => void;
  onSeriesFilterChange: (series: string) => void;
}

export default function CollectionHeader({ 
  userId, 
  onSortChange, 
  onSeriesFilterChange 
}: CollectionHeaderProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: collectibles = [], isLoading } = useQuery({
    queryKey: [`/api/collectibles?userId=${userId}`],
  });

  const { data: allSeries = [] } = useQuery({
    queryKey: ['/api/collectibles/series'],
    queryFn: async () => {
      // Extract unique series from collectibles
      if (collectibles.length === 0) return [];
      const uniqueSeries = [...new Set(collectibles.map((item: any) => item.series))];
      return uniqueSeries;
    },
    enabled: collectibles.length > 0,
  });

  // Calculate statistics
  const totalItems = collectibles.length;
  const uniqueSeries = [...new Set(collectibles.map((item: any) => item.series))].length;
  const rareItems = collectibles.filter((item: any) => 
    item.rarity === 'rare' || item.rarity === 'ultra-rare' || item.rarity === 'limited'
  ).length;
  
  // Assume 200 is the total number of possible collectibles in the PopMart universe
  // This would be fetched from the API in a real app
  const totalPossibleItems = 200;
  const completionPercentage = Math.round((totalItems / totalPossibleItems) * 100);

  return (
    <div className="bg-white rounded-custom p-4 shadow-soft mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <h2 className="text-xl font-bold font-nunito mb-2 md:mb-0">My Collection</h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-pop-pink hover:bg-opacity-90 text-white rounded-full px-4 py-2 font-medium text-sm transition"
          >
            <PlusIcon className="h-4 w-4 mr-1" /> Add Item
          </Button>
          
          <Select onValueChange={onSeriesFilterChange}>
            <SelectTrigger className="bg-gray-100 rounded-full px-4 py-2 h-auto text-sm w-36">
              <SelectValue placeholder="All Series" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Series</SelectItem>
              {allSeries.map((series: string) => (
                <SelectItem key={series} value={series}>{series}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select onValueChange={onSortChange}>
            <SelectTrigger className="bg-gray-100 rounded-full px-4 py-2 h-auto text-sm w-36">
              <SelectValue placeholder="Sort: Newest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Sort: Newest</SelectItem>
              <SelectItem value="oldest">Sort: Oldest</SelectItem>
              <SelectItem value="a-z">Sort: A-Z</SelectItem>
              <SelectItem value="rarity">Sort: Rarity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-custom">
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-xl font-bold text-pop-pink">{totalItems}</div>
            <div className="text-xs text-gray-500">Items</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-soft-blue">{uniqueSeries}</div>
            <div className="text-xs text-gray-500">Series</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-golden-yellow">{rareItems}</div>
            <div className="text-xs text-gray-500">Rare</div>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="text-sm text-gray-500">Collection complete: <span className="font-bold text-pop-pink">{completionPercentage}%</span></div>
          <Progress 
            value={completionPercentage} 
            className="w-48 h-2 bg-gray-200 rounded-full mt-1"
          />
        </div>
      </div>
      
      <AddItemModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen}
        onSuccess={() => {
          toast({
            title: "Item added",
            description: "Your collectible has been added to your collection.",
          });
        }}
      />
    </div>
  );
}
