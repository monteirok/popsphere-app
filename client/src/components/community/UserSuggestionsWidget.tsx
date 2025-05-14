import { useQuery } from "@tanstack/react-query";
import UserSuggestionCard from "./UserSuggestionCard";
import { useAuth } from "@/auth-provider";

export default function UserSuggestionsWidget() {
  const { user } = useAuth();
  
  const { data: recommendedUsers = [], isLoading } = useQuery({
    queryKey: ["/api/users/recommended"],
    enabled: !!user,
    refetchInterval: 60000, // Auto refresh every minute - less frequent for user suggestions
  });
  
  // Limit to 3 recommendations
  const limitedUsers = (recommendedUsers as any[]).slice(0, 3);
  
  return (
    <div className="bg-white rounded-custom p-4 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold font-nunito">Discover Collectors</h2>
        <a href="/community" className="text-pop-pink text-sm font-medium">See All</a>
      </div>
      
      {isLoading ? (
        <div className="py-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pop-pink"></div>
        </div>
      ) : limitedUsers.length > 0 ? (
        <div className="space-y-3">
          {limitedUsers.map((user) => (
            <UserSuggestionCard 
              key={user.id} 
              user={{
                ...user,
                itemsCount: Math.floor(Math.random() * 300) + 50,
                matchPercentage: Math.floor(Math.random() * 30) + 70,
              }} 
            />
          ))}
        </div>
      ) : (
        <div className="py-6 text-center">
          <p className="text-gray-500">No recommendations available</p>
        </div>
      )}
    </div>
  );
}
