import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AvatarWithStatus } from "@/components/ui/avatar-with-status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

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
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("followers");
  const [followingStatus, setFollowingStatus] = useState<Record<number, boolean>>({});

  // Populate initial following status
  useEffect(() => {
    const status: Record<number, boolean> = {};
    if (user) {
      const followingUserIds = following.map(f => f.id);
      followers.forEach(follower => {
        status[follower.id] = followingUserIds.includes(follower.id);
      });
      setFollowingStatus(status);
    }
  }, [followers, following, user]);

  const followMutation = useMutation({
    mutationFn: async (followUserId: number) => {
      const res = await apiRequest("POST", "/api/users/follow", { followingId: followUserId });
      return res.json();
    },
    onSuccess: (_, followUserId) => {
      setFollowingStatus(prev => ({ ...prev, [followUserId]: true }));
      toast({
        title: "Success",
        description: "You are now following this user",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/following`] });
      refetchFollowing();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (unfollowUserId: number) => {
      const res = await apiRequest("DELETE", `/api/users/follow/${unfollowUserId}`, {});
      return res.json();
    },
    onSuccess: (_, unfollowUserId) => {
      setFollowingStatus(prev => ({ ...prev, [unfollowUserId]: false }));
      toast({
        title: "Success",
        description: "You have unfollowed this user",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/following`] });
      refetchFollowing();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    },
  });

  const handleToggleFollow = (followUserId: number, currentlyFollowing: boolean) => {
    if (!user) return;
    
    if (currentlyFollowing) {
      unfollowMutation.mutate(followUserId);
    } else {
      followMutation.mutate(followUserId);
    }
  };

  const navigateToProfile = (username: string) => {
    onOpenChange(false);
    setLocation(`/users/${username}`);
  };

  const renderUserItem = (userData: User, isFollowing?: boolean) => {
    const isCurrentUser = userData.id === user?.id;
    const isFollowingUser = isFollowing !== undefined ? isFollowing : followingStatus[userData.id] || false;

    return (
      <div key={userData.id} className="flex items-center justify-between py-3 border-b border-gray-100">
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => navigateToProfile(userData.username)}
        >
          <AvatarWithStatus
            src={userData.profileImage || ""}
            alt={userData.displayName}
            className="h-10 w-10 rounded-full mr-3"
          />
          <div>
            <p className="font-medium">{userData.displayName}</p>
            <p className="text-sm text-gray-500">@{userData.username}</p>
          </div>
        </div>
        
        {!isCurrentUser && user && (
          <Button
            variant={isFollowingUser ? "outline" : "default"}
            size="sm"
            onClick={() => handleToggleFollow(userData.id, isFollowingUser)}
            disabled={followMutation.isPending || unfollowMutation.isPending}
          >
            {(followMutation.isPending || unfollowMutation.isPending) && 
              (followMutation.variables === userData.id || unfollowMutation.variables === userData.id) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {isFollowingUser ? "Unfollow" : "Follow"}
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isOwnProfile ? "Your Connections" : `${username}'s Connections`}
          </DialogTitle>
          <DialogDescription className="text-center">
            View followers and following users
          </DialogDescription>
        </DialogHeader>
        
        <Tabs
          defaultValue="followers"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mt-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({following.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="followers" className="max-h-[60vh] overflow-y-auto">
            {followers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No followers yet</p>
            ) : (
              <div className="space-y-1">
                {followers.map(follower => renderUserItem(follower))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="following" className="max-h-[60vh] overflow-y-auto">
            {following.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Not following anyone yet</p>
            ) : (
              <div className="space-y-1">
                {following.map(follow => renderUserItem(follow, true))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}