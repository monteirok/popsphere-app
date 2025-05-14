import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/utils";
import FollowersModal from "@/components/profile/FollowersModal";
import { 
  Edit, 
  Grid, 
  RefreshCw, 
  Users, 
  User as UserIcon,
  Camera,
  LogOut
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import CollectionItemCard from "@/components/collection/CollectionItemCard";
import PostCard from "@/components/community/PostCard";
import UserSuggestionCard from "@/components/community/UserSuggestionCard";
import TradeCard from "@/components/trade/TradeCard";

export default function Profile() {
  const { username } = useParams<{ username?: string }>();
  const { user: currentUser, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // State for profile edit
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState("");
  
  // State for followers/following modal
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  
  // Fetch the profile user (either current user or the username in URL)
  const { data: profileUser, isLoading: isLoadingUser } = useQuery({
    queryKey: [username ? `/api/users/${username}` : `/api/users/${currentUser?.id}`],
    enabled: !!currentUser && (!!username || !!currentUser?.id),
    onSuccess: (data) => {
      if (data && !isEditing) {
        setDisplayName(data.displayName || "");
        setBio(data.bio || "");
        setProfileImage(data.profileImage || "");
      }
    },
  });
  
  // Determine if viewing own profile
  const isOwnProfile = !username || (profileUser && currentUser && profileUser.id === currentUser.id);
  
  // Fetch user's collectibles
  const { data: collectibles = [], isLoading: isLoadingCollectibles } = useQuery({
    queryKey: [`/api/collectibles?userId=${profileUser?.id}`],
    enabled: !!profileUser?.id,
  });
  
  // Fetch user's posts
  const { data: posts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: [`/api/posts?userId=${profileUser?.id}`],
    enabled: !!profileUser?.id,
  });
  
  // Fetch user's followers
  const { 
    data: followers = [], 
    isLoading: isLoadingFollowers,
    refetch: refetchFollowers
  } = useQuery({
    queryKey: [username 
      ? `/api/users/${username}/followers` 
      : `/api/users/${profileUser?.id}/followers`
    ],
    enabled: !!profileUser?.id || !!username,
  });
  
  // Fetch user's following
  const { 
    data: following = [], 
    isLoading: isLoadingFollowing,
    refetch: refetchFollowing
  } = useQuery({
    queryKey: [username 
      ? `/api/users/${username}/following` 
      : `/api/users/${profileUser?.id}/following`
    ],
    enabled: !!profileUser?.id || !!username,
  });
  
  // Fetch user's trades
  const { data: trades = [], isLoading: isLoadingTrades } = useQuery({
    queryKey: ["/api/trades"],
    enabled: isOwnProfile && !!profileUser?.id,
  });
  
  // Update profile mutation
  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/users/${currentUser?.id}`, {
        displayName,
        bio,
        profileImage,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser?.id}`] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Follow/unfollow mutation
  const { mutate: toggleFollow, isPending: isFollowPending } = useMutation({
    mutationFn: async (isFollowing: boolean) => {
      const userIdentifier = username || profileUser?.id;
      if (isFollowing) {
        const response = await apiRequest("DELETE", `/api/users/${userIdentifier}/follow`, {});
        return response.json();
      } else {
        const response = await apiRequest("POST", `/api/users/${userIdentifier}/follow`, {});
        return response.json();
      }
    },
    onSuccess: () => {
      const userIdentifier = username || profileUser?.id;
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userIdentifier}/followers`] });
      toast({
        title: "Success",
        description: "Follow status updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Check if current user is following profile user
  const isFollowing = followers.some((follower: any) => follower.id === currentUser?.id);
  
  // Handle profile update
  const handleUpdateProfile = () => {
    if (!displayName.trim()) {
      toast({
        title: "Error",
        description: "Display name is required.",
        variant: "destructive",
      });
      return;
    }
    
    updateProfile();
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    setLocation("/login");
  };
  
  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pop-pink"></div>
      </div>
    );
  }
  
  if (!profileUser && !isLoadingUser) {
    return (
      <div className="bg-white rounded-custom p-6 shadow-soft text-center">
        <h2 className="text-xl font-bold mb-2">User Not Found</h2>
        <p className="text-gray-500">The user you're looking for doesn't exist or has been removed.</p>
        <Button 
          className="mt-4 bg-pop-pink hover:bg-opacity-90"
          onClick={() => setLocation("/")}
        >
          Back to Home
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-custom p-6 shadow-soft mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start">
          <Avatar className="h-24 w-24 rounded-full mb-4 md:mb-0 md:mr-6 border-2 border-pop-pink">
            <AvatarImage src={profileUser?.profileImage} alt={profileUser?.displayName} />
            <AvatarFallback className="text-xl">{getInitials(profileUser?.displayName || "")}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold">{profileUser?.displayName}</h1>
            <p className="text-gray-500">@{profileUser?.username}</p>
            
            {profileUser?.bio && (
              <p className="mt-2 text-sm">{profileUser.bio}</p>
            )}
            
            <div className="flex flex-wrap justify-center md:justify-start mt-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold">{collectibles.length}</div>
                <div className="text-xs text-gray-500">Collectibles</div>
              </div>
              <div 
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsFollowersModalOpen(true)}
              >
                <div className="text-lg font-bold">{followers.length}</div>
                <div className="text-xs text-gray-500">Followers</div>
              </div>
              <div 
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsFollowersModalOpen(true)}
              >
                <div className="text-lg font-bold">{following.length}</div>
                <div className="text-xs text-gray-500">Following</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            {isOwnProfile ? (
              <div className="space-y-2">
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-full">
                      <Edit className="h-4 w-4 mr-2" /> Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input 
                          id="displayName" 
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="profileImage">Profile Image URL</Label>
                        <div className="flex space-x-2">
                          <Input 
                            id="profileImage" 
                            value={profileImage}
                            onChange={(e) => setProfileImage(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                          />
                          <Avatar className="h-10 w-10 rounded-full">
                            <AvatarImage src={profileImage} alt={displayName} />
                            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea 
                          id="bio" 
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell others about yourself and your collection"
                          className="resize-none h-20"
                        />
                      </div>
                      
                      <div className="flex justify-between">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                          disabled={isUpdating}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleUpdateProfile}
                          disabled={isUpdating}
                          className="bg-pop-pink hover:bg-opacity-90"
                        >
                          {isUpdating ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  variant="outline" 
                  className="rounded-full"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => toggleFollow(isFollowing)}
                disabled={isFollowPending}
                className={isFollowing 
                  ? "bg-gray-100 hover:bg-gray-200 text-dark-grey rounded-full" 
                  : "bg-pop-pink hover:bg-opacity-90 text-white rounded-full"
                }
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="collection" className="w-full">
        <div className="bg-white rounded-custom p-4 shadow-soft mb-6">
          <TabsList className="w-full justify-start bg-transparent space-x-2 p-0">
            <TabsTrigger 
              value="collection" 
              className="data-[state=active]:bg-pop-pink data-[state=active]:text-white rounded-full px-4 py-2"
            >
              <Grid className="h-4 w-4 mr-2" /> Collection
            </TabsTrigger>
            <TabsTrigger 
              value="posts" 
              className="data-[state=active]:bg-pop-pink data-[state=active]:text-white rounded-full px-4 py-2"
            >
              <Users className="h-4 w-4 mr-2" /> Posts
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger 
                value="trades" 
                className="data-[state=active]:bg-pop-pink data-[state=active]:text-white rounded-full px-4 py-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Trades
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="following" 
              className="data-[state=active]:bg-pop-pink data-[state=active]:text-white rounded-full px-4 py-2"
            >
              <UserIcon className="h-4 w-4 mr-2" /> Following
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="collection" className="mt-0">
          <div className="bg-white rounded-custom p-4 shadow-soft">
            <h2 className="text-xl font-bold mb-4">Collection</h2>
            
            {isLoadingCollectibles ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pop-pink"></div>
              </div>
            ) : collectibles.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(collectibles as any[]).map((collectible) => (
                  <CollectionItemCard key={collectible.id} collectible={collectible} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500">No collectibles yet</p>
                {isOwnProfile && (
                  <p className="text-sm text-gray-400 mt-1">Start adding items to your collection!</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="posts" className="mt-0">
          <div className="bg-white rounded-custom p-4 shadow-soft">
            <h2 className="text-xl font-bold mb-4">Posts</h2>
            
            {isLoadingPosts ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pop-pink"></div>
              </div>
            ) : posts.length > 0 ? (
              <div>
                {(posts as any[]).map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500">No posts yet</p>
                {isOwnProfile && (
                  <p className="text-sm text-gray-400 mt-1">Share updates about your collection!</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        {isOwnProfile && (
          <TabsContent value="trades" className="mt-0">
            <div className="bg-white rounded-custom p-4 shadow-soft">
              <h2 className="text-xl font-bold mb-4">Trades</h2>
              
              {isLoadingTrades ? (
                <div className="py-12 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pop-pink"></div>
                </div>
              ) : (trades as any[]).length > 0 ? (
                <div className="space-y-3">
                  {(trades as any[])
                    .filter(trade => trade.status === "pending")
                    .map((trade) => (
                      <TradeCard 
                        key={trade.id} 
                        trade={trade} 
                        isUserProposer={trade.proposerId === currentUser?.id} 
                      />
                    ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-gray-500">No active trades</p>
                  <p className="text-sm text-gray-400 mt-1">Start trading with other collectors!</p>
                </div>
              )}
              
              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={() => setLocation("/trades")}
                  className="bg-pop-pink hover:bg-opacity-90 rounded-full"
                >
                  View All Trades
                </Button>
              </div>
            </div>
          </TabsContent>
        )}
        
        <TabsContent value="following" className="mt-0">
          <div className="bg-white rounded-custom p-4 shadow-soft">
            <h2 className="text-xl font-bold mb-4">Following</h2>
            
            {isLoadingFollowing ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pop-pink"></div>
              </div>
            ) : following.length > 0 ? (
              <div className="space-y-4">
                {(following as any[]).map((followedUser) => (
                  <UserSuggestionCard 
                    key={followedUser.id} 
                    user={{
                      ...followedUser,
                      isFollowing: true
                    }} 
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500">Not following anyone yet</p>
                <p className="text-sm text-gray-400 mt-1">Follow other collectors to see their updates!</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Followers/Following Modal */}
      {profileUser && (
        <FollowersModal
          open={isFollowersModalOpen}
          onOpenChange={setIsFollowersModalOpen}
          followers={followers || []}
          following={following || []}
          userId={profileUser.id}
          username={profileUser.username}
          isOwnProfile={isOwnProfile}
          refetchFollowers={refetchFollowers}
          refetchFollowing={refetchFollowing}
        />
      )}
    </div>
  );
}
