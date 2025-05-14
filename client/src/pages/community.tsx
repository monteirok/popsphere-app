import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, X, RefreshCw } from "lucide-react";
import PostCard from "@/components/community/PostCard";
import UserSuggestionsWidget from "@/components/community/UserSuggestionsWidget";

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [postContent, setPostContent] = useState("");
  const [postImages, setPostImages] = useState<string[]>([]);
  const [imageInputUrl, setImageInputUrl] = useState("");
  const [refreshInterval, setRefreshInterval] = useState<number>(15000); // 15 seconds by default
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Fetch community feed posts
  const { data: posts = [], isLoading: isLoadingPosts, refetch } = useQuery({
    queryKey: ["/api/posts"],
    refetchInterval: refreshInterval,
  });
  
  // Function to manually refresh posts
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000); // Show refresh animation for at least 1 second
  };
  
  // Auto-refresh when the component mounts
  useEffect(() => {
    handleRefresh();
    
    // Stop auto-refresh when component unmounts
    return () => {
      setRefreshInterval(0);
    };
  }, []);
  
  // Create post mutation
  const { mutate: createPost, isPending } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/posts", {
        content: postContent,
        images: postImages.length > 0 ? postImages : undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      setPostContent("");
      setPostImages([]);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      handleRefresh(); // Manually refresh the posts
      toast({
        title: "Post created",
        description: "Your post has been published to the community.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleCreatePost = () => {
    if (postContent.trim() === "") {
      toast({
        title: "Empty post",
        description: "Please add some content to your post.",
        variant: "destructive",
      });
      return;
    }
    
    createPost();
  };
  
  const addImageUrl = () => {
    if (!imageInputUrl.trim()) return;
    
    if (!imageInputUrl.match(/^https?:\/\/.+\..+/)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL.",
        variant: "destructive",
      });
      return;
    }
    
    setPostImages([...postImages, imageInputUrl]);
    setImageInputUrl("");
  };
  
  const removeImage = (index: number) => {
    setPostImages(postImages.filter((_, i) => i !== index));
  };
  
  if (!user) {
    return <div>Please log in to view the community.</div>;
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-gray-800 rounded-custom p-4 shadow-soft dark:shadow-soft-dark mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold font-nunito">Community Feed</h2>
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
          
          <div className="mb-4">
            <Textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Share what's new with your collection..."
              className="resize-none min-h-[100px] dark:bg-gray-800 dark:border-gray-700"
            />
            
            {postImages.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {postImages.map((imageUrl, index) => (
                  <div key={index} className="relative rounded-custom overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={`Post image ${index + 1}`} 
                      className="w-full h-32 object-cover"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex mt-3">
              <div className="relative flex-1 mr-2">
                <input
                  type="text"
                  value={imageInputUrl}
                  onChange={(e) => setImageInputUrl(e.target.value)}
                  placeholder="Paste image URL here"
                  className="w-full rounded-l-full py-2 px-4 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-pop-pink dark:focus:ring-brand-dark"
                />
                <Button
                  type="button"
                  onClick={addImageUrl}
                  className="absolute right-0 top-0 bottom-0 rounded-l-none rounded-r-full bg-pop-pink dark:bg-brand-dark"
                >
                  <Camera className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              <Button
                onClick={handleCreatePost}
                disabled={isPending || postContent.trim() === ""}
                className="bg-pop-pink dark:bg-brand-dark hover:bg-opacity-90 rounded-full"
              >
                {isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
          
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            {isLoadingPosts ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pop-pink dark:border-brand-dark"></div>
              </div>
            ) : posts.length > 0 ? (
              <div>
                {(posts as any[]).map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Be the first to post in the community!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <UserSuggestionsWidget />
        
        <div className="bg-white dark:bg-gray-800 rounded-custom p-4 shadow-soft dark:shadow-soft-dark">
          <h2 className="text-lg font-bold font-nunito mb-4">Community Rules</h2>
          
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="bg-pop-pink dark:bg-brand-dark text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
              <p>Be kind and respectful to other collectors.</p>
            </li>
            <li className="flex items-start">
              <span className="bg-pop-pink dark:bg-brand-dark text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
              <p>Only post authentic PopSphere collectibles.</p>
            </li>
            <li className="flex items-start">
              <span className="bg-pop-pink dark:bg-brand-dark text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
              <p>No selling or advertising. Trading is encouraged!</p>
            </li>
            <li className="flex items-start">
              <span className="bg-pop-pink dark:bg-brand-dark text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
              <p>Share your collection milestones and achievements.</p>
            </li>
            <li className="flex items-start">
              <span className="bg-pop-pink dark:bg-brand-dark text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">5</span>
              <p>Have fun and celebrate the joy of collecting!</p>
            </li>
          </ul>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-custom p-4 shadow-soft dark:shadow-soft-dark">
          <h2 className="text-lg font-bold font-nunito mb-4">Upcoming Events</h2>
          
          <div className="space-y-4">
            <div className="border border-gray-100 dark:border-gray-700 rounded-custom p-3">
              <div className="font-medium">PopSphere Online Convention</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">July 15-16, 2025 • Virtual</div>
              <p className="text-sm mt-2">Join collectors worldwide for exclusive reveals and limited editions!</p>
            </div>
            
            <div className="border border-gray-100 dark:border-gray-700 rounded-custom p-3">
              <div className="font-medium">Dimoo Series 5 Release</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">August 3, 2025 • Global</div>
              <p className="text-sm mt-2">Get ready for the newest Dimoo series with 12 new collectibles!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
