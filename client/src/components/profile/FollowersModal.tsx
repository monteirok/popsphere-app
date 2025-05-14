import React, { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface FollowersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followers: User[];
  following: User[];
  userId: number;
  username: string;
  isOwnProfile: boolean;
  refetchFollowers: () => void;
  refetchFollowing: () => void;
}

export default function FollowersModal({
  open,
  onOpenChange,
  followers,
  following,
  userId,
  username,
  isOwnProfile,
  refetchFollowers,
  refetchFollowing,
}: FollowersModalProps) {
  const [activeTab, setActiveTab] = useState("followers");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Function to handle follow/unfollow
  const handleFollowToggle = async (userToToggle: User, isFollowing: boolean) => {
    if (!currentUser) return;
    
    try {
      if (isFollowing) {
        // Unfollow
        await apiRequest('DELETE', `/api/users/${userToToggle.username}/follow`);
        toast({
          title: "Unfollowed",
          description: `You're no longer following ${userToToggle.displayName || userToToggle.username}`,
        });
      } else {
        // Follow
        await apiRequest('POST', `/api/users/${userToToggle.username}/follow`);
        toast({
          title: "Following",
          description: `You're now following ${userToToggle.displayName || userToToggle.username}`,
        });
      }
      
      // Refresh data
      refetchFollowers();
      refetchFollowing();
    } catch (error) {
      console.error('Error toggling follow status:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Navigate to user's profile
  const goToProfile = (username: string) => {
    onOpenChange(false);
    setLocation(`/profile/${username}`);
  };

  // Check if current user is following a user
  const isFollowingUser = (userId: number): boolean => {
    return following.some(user => user.id === userId);
  };

  // Render a user item with appropriate follow/unfollow button
  const renderUserItem = (userData: User, isInFollowingTab?: boolean) => {
    const isFollowingThisUser = isFollowingUser(userData.id);
    const isCurrentUser = currentUser?.id === userData.id;
    
    return (
      <div key={userData.id} className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <div 
          className="flex items-center flex-1 cursor-pointer" 
          onClick={() => goToProfile(userData.username)}
        >
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={userData.profileImage || undefined} alt={userData.displayName || userData.username} />
            <AvatarFallback>{getInitials(userData.displayName || userData.username)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{userData.displayName || userData.username}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">@{userData.username}</div>
          </div>
        </div>
        
        {!isCurrentUser && currentUser && (
          <Button
            variant={isFollowingThisUser ? "outline" : "default"} 
            size="sm"
            onClick={() => handleFollowToggle(userData, isFollowingThisUser)}
            className={isFollowingThisUser ? "text-gray-600" : "bg-pop-pink hover:bg-pop-pink/90"}
          >
            {isFollowingThisUser ? 'Unfollow' : 'Follow'}
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">
            {username}'s {activeTab === "followers" ? "Followers" : "Following"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {activeTab === "followers" 
              ? `People who follow ${isOwnProfile ? 'you' : username}` 
              : `People ${isOwnProfile ? 'you follow' : `${username} follows`}`}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          defaultValue="followers" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <TabsList className="w-full mb-4">
            <TabsTrigger value="followers" className="flex-1">
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following" className="flex-1">
              Following ({following.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="followers" className="flex-1 overflow-auto">
            <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
              {followers.length > 0 ? (
                followers.map(follower => renderUserItem(follower))
              ) : (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <p>{isOwnProfile ? "You don't" : `${username} doesn't`} have any followers yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="following" className="flex-1 overflow-auto">
            <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
              {following.length > 0 ? (
                following.map(followedUser => renderUserItem(followedUser, true))
              ) : (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <p>{isOwnProfile ? "You're" : `${username} is`} not following anyone yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}