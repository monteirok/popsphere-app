import { useQuery } from "@tanstack/react-query";
import PostCard from "./PostCard";

export default function CommunityFeedWidget() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["/api/posts"],
    refetchInterval: 15000, // Auto refresh every 15 seconds
  });
  
  // Limit to 2 posts for the widget
  const limitedPosts = (posts as any[]).slice(0, 2);
  
  return (
    <div className="bg-white rounded-custom p-4 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold font-nunito">Community Feed</h2>
        <a href="/community" className="text-pop-pink text-sm font-medium">See All</a>
      </div>
      
      {isLoading ? (
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pop-pink"></div>
        </div>
      ) : limitedPosts.length > 0 ? (
        <div>
          {limitedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-gray-500">No posts yet</p>
          <p className="text-sm text-gray-400 mt-1">Be the first to post in the community!</p>
        </div>
      )}
      
      <div className="mt-4 text-center">
        <a href="/community" className="bg-gray-100 hover:bg-gray-200 text-dark-grey rounded-full px-4 py-2 text-xs font-medium transition block w-full">
          View All Posts
        </a>
      </div>
    </div>
  );
}
