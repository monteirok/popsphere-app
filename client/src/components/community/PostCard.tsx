import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PostWithDetails } from "@shared/schema";
import { AvatarWithStatus } from "@/components/ui/avatar-with-status";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal,
  Send
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PostCardProps {
  post: PostWithDetails;
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [liked, setLiked] = useState(post.liked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  
  // Get post comments
  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: [`/api/posts/${post.id}/comments`],
    enabled: showComments || showCommentsDialog,
  });
  
  // Toggle like mutation
  const { mutate: toggleLike } = useMutation({
    mutationFn: async () => {
      if (liked) {
        const response = await apiRequest("DELETE", `/api/posts/${post.id}/like`, {});
        return response.json();
      } else {
        const response = await apiRequest("POST", `/api/posts/${post.id}/like`, {});
        return response.json();
      }
    },
    onSuccess: (data) => {
      setLiked(!liked);
      setLikesCount(data.likesCount);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like/unlike post. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Add comment mutation
  const { mutate: addComment, isPending: isAddingComment } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/posts/${post.id}/comments`, {
        content: commentText,
      });
      return response.json();
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      toast({
        title: "Comment added",
        description: "Your comment has been added to the post.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Delete post mutation
  const { mutate: deletePost } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/posts/${post.id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() === "") return;
    addComment();
  };
  
  return (
    <div className="mb-4 pb-4 border-b border-gray-100">
      <div className="flex items-center mb-3">
        <AvatarWithStatus
          src={post.user.profileImage || ""}
          alt={post.user.displayName}
          className="w-8 h-8 rounded-full mr-2"
        />
        <div>
          <p className="font-medium text-sm">{post.user.username === user?.username ? "You" : post.user.displayName}</p>
          <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
        </div>
        
        {post.user.id === user?.id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-auto p-0 h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-red-500 focus:text-red-500"
                onClick={() => deletePost()}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <p className="text-sm mb-3">{post.content}</p>
      
      {post.images && post.images.length > 0 && (
        <div className={`grid ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 mb-3`}>
          {post.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Post image ${index + 1}`}
              className="w-full h-full object-cover rounded-custom"
              style={{ maxHeight: post.images.length === 1 ? '300px' : '150px' }}
            />
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <button 
            onClick={() => toggleLike()}
            className={`flex items-center mr-3 ${liked ? 'text-pop-pink' : ''}`}
          >
            <Heart className={`mr-1 h-4 w-4 ${liked ? 'fill-current' : ''}`} /> {likesCount}
          </button>
          <button 
            onClick={() => setShowCommentsDialog(true)}
            className="flex items-center"
          >
            <MessageCircle className="mr-1 h-4 w-4" /> {post.commentsCount}
          </button>
        </div>
      </div>
      
      {showComments && (
        <div className="mt-3">
          <div className="p-2 bg-gray-50 rounded-custom">
            {isLoadingComments ? (
              <p className="text-center text-xs py-2">Loading comments...</p>
            ) : comments.length > 0 ? (
              <div className="space-y-2">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="flex items-start space-x-2">
                    <AvatarWithStatus
                      src={comment.user.profileImage || ""}
                      alt={comment.user.displayName}
                      className="w-6 h-6 rounded-full"
                    />
                    <div className="bg-white p-2 rounded-lg text-xs flex-grow">
                      <p className="font-medium">{comment.user.displayName}</p>
                      <p>{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs py-2">No comments yet. Be the first to comment!</p>
            )}
            
            <form onSubmit={handleCommentSubmit} className="mt-2 flex">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="text-xs min-h-[32px] resize-none rounded-l-full rounded-r-none border-r-0"
              />
              <Button 
                type="submit" 
                disabled={commentText.trim() === "" || isAddingComment}
                size="sm"
                className="rounded-l-none rounded-r-full bg-pop-pink"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
      
      {!showComments && (
        <button 
          onClick={() => setShowComments(true)}
          className="w-full text-center mt-2 text-xs text-pop-pink hover:underline"
        >
          View comments
        </button>
      )}
      
      {/* Comments Dialog for Mobile */}
      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[300px] overflow-y-auto space-y-3">
            {isLoadingComments ? (
              <p className="text-center py-2">Loading comments...</p>
            ) : comments.length > 0 ? (
              comments.map((comment: any) => (
                <div key={comment.id} className="flex items-start space-x-2">
                  <AvatarWithStatus
                    src={comment.user.profileImage || ""}
                    alt={comment.user.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="bg-gray-50 p-3 rounded-lg text-sm flex-grow">
                    <p className="font-medium">{comment.user.displayName}</p>
                    <p>{comment.content}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(comment.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-2">No comments yet. Be the first to comment!</p>
            )}
          </div>
          
          <form onSubmit={handleCommentSubmit} className="mt-2 flex">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="text-sm resize-none rounded-l-lg rounded-r-none border-r-0"
            />
            <Button 
              type="submit" 
              disabled={commentText.trim() === "" || isAddingComment}
              className="rounded-l-none rounded-r-lg bg-pop-pink"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
