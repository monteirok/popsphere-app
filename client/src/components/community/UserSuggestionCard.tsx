import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AvatarWithStatus } from "@/components/ui/avatar-with-status";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface UserSuggestionCardProps {
  user: {
    id: number;
    username: string;
    displayName: string;
    profileImage?: string;
    bio?: string;
    isFollowing?: boolean;
    itemsCount?: number;
    matchPercentage?: number;
  };
}

export default function UserSuggestionCard({ user }: UserSuggestionCardProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Follow/unfollow mutation
  const { mutate: toggleFollow, isPending } = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        const response = await apiRequest("DELETE", `/api/users/${user.id}/follow`, {});
        return response.json();
      } else {
        const response = await apiRequest("POST", `/api/users/${user.id}/follow`, {});
        return response.json();
      }
    },
    onSuccess: () => {
      setIsFollowing(!isFollowing);
      queryClient.invalidateQueries({ queryKey: ["/api/users/recommended"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/followers`] });
      
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing 
          ? `You have unfollowed ${user.displayName}` 
          : `You are now following ${user.displayName}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${isFollowing ? 'unfollow' : 'follow'} user. Please try again.`,
        variant: "destructive",
      });
    }
  });
  
  return (
    <div className="flex items-center justify-between">
      <Link href={`/profile/${user.username}`}>
        <div className="flex items-center cursor-pointer">
          <AvatarWithStatus
            src={user.profileImage || ""}
            alt={user.displayName}
            className="w-10 h-10 rounded-full mr-3"
          />
          <div>
            <p className="font-medium text-sm">{user.displayName}</p>
            <p className="text-xs text-gray-500">
              {user.itemsCount ? `${user.itemsCount} items` : ""}
              {user.itemsCount && user.matchPercentage ? " · " : ""}
              {user.matchPercentage ? `${user.matchPercentage}% match` : ""}
              {!user.itemsCount && !user.matchPercentage && user.bio ? user.bio : ""}
            </p>
          </div>
        </div>
      </Link>
      <Button
        onClick={() => toggleFollow()}
        disabled={isPending}
        size="sm"
        variant={isFollowing ? "outline" : "default"}
        className={isFollowing 
          ? "bg-gray-100 hover:bg-gray-200 text-dark-grey rounded-full text-xs px-3 py-1 font-medium transition" 
          : "bg-pop-pink hover:bg-opacity-90 text-white rounded-full text-xs px-3 py-1 font-medium transition"
        }
      >
        {isFollowing ? "Following" : "Follow"}
      </Button>
    </div>
  );
}
