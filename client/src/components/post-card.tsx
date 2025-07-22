import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  ThumbsUp,
  Heart,
  Award,
  Lightbulb,
  Smile,
  Hand,
  MessageSquare,
  Share2,
  Repeat2,
  MapPin,
  MoreHorizontal,
  Trash2,
  Edit3
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Post, User } from "@shared/schema";

interface PostCardProps {
  post: Post;
  author: User;
  likes: number;
  comments: Array<{ comment: { content: string, createdAt: Date }, user: User }>;
  isLiked: boolean;
  reposts?: number;
  isReposted?: boolean;
}

export default function PostCard({ post, author, likes, comments, isLiked, reposts = 0, isReposted = false }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLikedState, setIsLikedState] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(likes);
  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localComments, setLocalComments] = useState(comments);
  const [showReactions, setShowReactions] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<string>("like");
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRepostedState, setIsRepostedState] = useState(isReposted);
  const [repostsCount, setRepostsCount] = useState(reposts);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const reactionButtonRef = useRef<HTMLDivElement>(null);
  const deleteMenuRef = useRef<HTMLDivElement>(null);
  
  // Handle clicking outside menus to close them
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (reactionButtonRef.current && !reactionButtonRef.current.contains(event.target as Node)) {
        setShowReactions(false);
      }
      if (deleteMenuRef.current && !deleteMenuRef.current.contains(event.target as Node)) {
        setShowDeleteMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLike = async (reactionType: string = "like") => {
    if (!user) return;

    try {
      if (isLikedState && currentReaction === reactionType) {
        // Remove reaction if clicking the same reaction type
        await apiRequest("DELETE", `/api/posts/${post.id}/like`);
        setIsLikedState(false);
        setLikesCount(prev => prev - 1);
        setCurrentReaction("like");
        
        // Show confirmation tooltip for reaction removal
        setShowConfirmation(true);
        setTimeout(() => {
          setShowConfirmation(false);
        }, 2000);
      } else {
        // Add or change reaction
        await apiRequest("POST", `/api/posts/${post.id}/like`);
        setIsLikedState(true);
        
        // If not liked before, increment count
        if (!isLikedState) {
          setLikesCount(prev => prev + 1);
        }
        
        // Update reaction type
        setCurrentReaction(reactionType);
        
        // Show confirmation tooltip briefly
        setShowConfirmation(true);
        setTimeout(() => {
          setShowConfirmation(false);
        }, 2000);
      }
      
      // Hide reaction menu after selection
      setShowReactions(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive"
      });
    }
  };
  
  // Get color class based on reaction type
  const getReactionColor = (type: string) => {
    switch (type) {
      case "like": return "text-purple-600 bg-purple-50";
      case "love": return "text-red-600 bg-red-50";
      case "celebrate": return "text-yellow-600 bg-yellow-50";
      case "insightful": return "text-blue-600 bg-blue-50";
      case "funny": return "text-amber-600 bg-amber-50";
      case "support": return "text-green-600 bg-green-50";
      default: return "text-purple-600 bg-purple-50";
    }
  };
  
  // Get reaction icon based on type
  const getReactionIcon = (type: string) => {
    switch (type) {
      case "like":
        return <ThumbsUp className={`mr-1 h-4 w-4 ${isLikedState && currentReaction === "like" ? 'fill-purple-600' : ''}`} />;
      case "love":
        return <Heart className={`mr-1 h-4 w-4 ${isLikedState && currentReaction === "love" ? 'fill-red-600' : ''}`} />;
      case "celebrate":
        return <Award className={`mr-1 h-4 w-4 ${isLikedState && currentReaction === "celebrate" ? 'fill-yellow-600' : ''}`} />;
      case "insightful":
        return <Lightbulb className={`mr-1 h-4 w-4 ${isLikedState && currentReaction === "insightful" ? 'fill-blue-600' : ''}`} />;
      case "funny":
        return <Smile className={`mr-1 h-4 w-4 ${isLikedState && currentReaction === "funny" ? 'fill-amber-600' : ''}`} />;
      case "support":
        return <Hand className={`mr-1 h-4 w-4 ${isLikedState && currentReaction === "support" ? 'fill-green-600' : ''}`} />;
      default:
        return <ThumbsUp className={`mr-1 h-4 w-4 ${isLikedState ? 'fill-purple-600' : ''}`} />;
    }
  };
  
  // Get reaction text based on type
  const getReactionText = (type: string) => {
    if (!isLikedState) return "Like";
    
    switch (type) {
      case "like": return "Liked";
      case "love": return "Loved";
      case "celebrate": return "Celebrated";
      case "insightful": return "Insightful";
      case "funny": return "Funny";
      case "support": return "Supported";
      default: return "Liked";
    }
  };
  
  // Get colored background and text for reaction tooltips
  const getReactionTooltipColor = (type: string) => {
    switch (type) {
      case "like": return "bg-purple-600 text-white";
      case "love": return "bg-red-600 text-white";
      case "celebrate": return "bg-yellow-600 text-white";
      case "insightful": return "bg-blue-600 text-white";
      case "funny": return "bg-amber-600 text-white";
      case "support": return "bg-green-600 text-white";
      default: return "bg-purple-600 text-white";
    }
  };

  const handleComment = () => {
    setShowComments(true);
  };

  const handleRepost = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to repost.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest(
        isRepostedState ? "DELETE" : "POST",
        `/api/posts/${post.id}/repost`
      );

      if (!response.ok) {
        throw new Error("Failed to repost");
      }

      // Handle successful response (POST returns JSON, DELETE returns 204)
      const wasReposted = isRepostedState;
      setIsRepostedState(!isRepostedState);
      setRepostsCount(prev => wasReposted ? prev - 1 : prev + 1);

      toast({
        title: wasReposted ? "Repost removed" : "Post reposted",
        description: wasReposted 
          ? "You have unreposted this post." 
          : "The post has been shared to your profile.",
      });
    } catch (error) {
      toast({
        title: "Repost failed",
        description: "Unable to repost. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeletePost = async () => {
    if (!user || post.userId !== user.id || isDeleting) return;
    
    setIsDeleting(true);
    setShowDeleteMenu(false);
    
    try {
      const response = await apiRequest("DELETE", `/api/posts/${post.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to delete post");
      }
      
      // Immediately remove post from cache optimistically
      queryClient.setQueryData(["/api/posts"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((p: any) => p.id !== post.id);
      });
      
      // Force a complete refresh
      queryClient.removeQueries({ queryKey: ["/api/posts"] });
      window.location.reload();
      
      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      });
      
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete the post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditPost = async () => {
    if (!user || post.userId !== user.id || !editContent.trim()) return;
    
    try {
      const response = await apiRequest("PATCH", `/api/posts/${post.id}`, {
        content: editContent.trim()
      });
      
      if (!response.ok) {
        throw new Error("Failed to update post");
      }
      
      // Update the local state and refresh
      post.content = editContent.trim();
      setIsEditing(false);
      setShowDeleteMenu(false);
      
      // Refresh the posts to show updated content
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      await queryClient.refetchQueries({ queryKey: ["/api/posts"] });
      
      toast({
        title: "Post updated",
        description: "Your post has been updated successfully.",
      });
      
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update the post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditContent(post.content);
    setShowDeleteMenu(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditContent(post.content);
  };

  // Share options state
  const [showShareOptions, setShowShareOptions] = useState(false);
  const shareOptionsRef = useRef<HTMLDivElement>(null);

  // Handle click outside share options to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareOptionsRef.current && !shareOptionsRef.current.contains(event.target as Node)) {
        setShowShareOptions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle share options
  const handleShare = () => {
    setShowShareOptions(prev => !prev);
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    // Create a temporary text area to copy post content
    const tempTextArea = document.createElement('textarea');
    
    // Create shareable content with attribution
    const shareableContent = `${post.content}\n\nShared from: ${author.name || author.username} on Harmony.ai`;
    
    // Set the text content
    tempTextArea.value = shareableContent;
    
    // Append the element to the DOM
    document.body.appendChild(tempTextArea);
    
    // Select the text
    tempTextArea.select();
    
    try {
      // Execute copy command
      document.execCommand('copy');
      
      // Notify user of success
      toast({
        title: "Content copied to clipboard",
        description: "You can now paste and share this post wherever you'd like!",
        variant: "default"
      });
    } catch (err) {
      // Handle any errors
      toast({
        title: "Unable to copy",
        description: "There was an issue copying the content to your clipboard.",
        variant: "destructive"
      });
    } finally {
      // Remove the temporary element
      document.body.removeChild(tempTextArea);
    }
    
    // Close share options
    setShowShareOptions(false);
  };

  // Share via email
  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out this post from ${author.name || author.username} on Harmony.ai`);
    const body = encodeURIComponent(`${post.content}\n\nShared from: ${author.name || author.username} on Harmony.ai`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setShowShareOptions(false);
  };

  // Share as private message
  const shareAsPrivateMessage = () => {
    toast({
      title: "Share as private message",
      description: "Message sharing feature coming soon. Post content copied to clipboard meanwhile.",
      variant: "default"
    });
    copyToClipboard();
    setShowShareOptions(false);
  };

  // Share on external platform 
  const shareOnPlatform = (platform: string) => {
    // Simulate sharing to external platform
    toast({
      title: `Share on ${platform}`,
      description: `${platform} sharing integration coming soon!`,
      variant: "default"
    });
    setShowShareOptions(false);
  };

  const submitComment = async () => {
    if (!comment.trim() || !user) return;

    setIsSubmittingComment(true);
    try {
      const response = await apiRequest("POST", `/api/posts/${post.id}/comments`, { content: comment });
      const newComment = await response.json();
      
      // Add the new comment to the local state
      setLocalComments([
        ...localComments,
        { 
          comment: { 
            ...newComment,
            createdAt: new Date()
          }, 
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            profileImageUrl: user.profileImageUrl
          } as User
        }
      ]);
      
      setComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <Card className="mb-6 overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white">
      <CardContent className="p-0">
        <div className="p-4 pb-3 bg-white">
          <div className="flex">
            <div className="flex-shrink-0 mr-3">
              <div 
                onClick={() => navigate(`/profile/${author.id}`)}
                className="cursor-pointer hover:opacity-90 transition-opacity"
              >
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={author.profileImageUrl || undefined} alt={author.name || author.username} />
                  <AvatarFallback className="bg-purple-100 text-purple-800 text-lg">
                    {author.name?.substring(0, 2).toUpperCase() || author.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="flex-grow">
              <div className="flex items-center">
                <h3 
                  onClick={() => navigate(`/profile/${author.id}`)}
                  className="font-semibold text-gray-800 cursor-pointer hover:text-purple-700 transition-colors"
                >
                  {author.name || author.username}
                </h3>
                <span className="mx-1 text-gray-500">•</span>
                <span className="text-gray-500 text-sm">{author.title || (author.isRecruiter ? "Recruiter" : "Professional")}</span>
              </div>
              <p className="text-xs text-gray-500">
                {post.createdAt && formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
            
            {/* Show delete option only for post owner */}
            {user && post.userId === user.id && (
              <div className="relative" ref={deleteMenuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                
                {showDeleteMenu && (
                  <div className="absolute right-0 top-8 z-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]">
                    <button
                      onClick={startEditing}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit post
                    </button>
                    <button
                      onClick={handleDeletePost}
                      disabled={isDeleting}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? "Deleting..." : "Delete post"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-3">
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px] resize-none border-gray-200 focus:border-purple-500"
                  placeholder="Edit your post..."
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleEditPost}
                    disabled={!editContent.trim() || editContent === post.content}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Save changes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEditing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 whitespace-pre-line">{post.content}</p>
            )}
          </div>
        </div>

        {post.imageUrl && (
          <div className="w-full border-t border-b border-gray-100">
            <img
              className="w-full max-h-[500px] object-cover"
              src={post.imageUrl}
              alt="Post attachment"
            />
          </div>
        )}

        <div className="px-4 py-3 border-t border-b border-gray-100 bg-white">
          <div className="flex items-center justify-around">
            <div 
              ref={reactionButtonRef} 
              className="relative"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="inline-block"
              >
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center rounded-full px-3 ${
                      isLikedState 
                        ? getReactionColor(currentReaction)
                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                    onClick={() => setShowReactions(!showReactions)}
                  >
                    {getReactionIcon(currentReaction)}
                    <span className="ml-1 text-sm font-medium">{getReactionText(currentReaction)}</span>
                    {likesCount > 0 && (
                      <span className="ml-1 bg-purple-100 text-purple-800 rounded-full px-1.5 py-0.5 text-xs font-medium">
                        {likesCount}
                      </span>
                    )}
                  </Button>
                </div>
                
                {/* Tooltip showing reaction confirmation */}
                {showConfirmation && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute -top-7 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs font-medium rounded whitespace-nowrap shadow-md ${isLikedState ? getReactionTooltipColor(currentReaction) : 'bg-gray-800 text-white'}`}
                  >
                    {isLikedState 
                      ? `Reaction added: ${currentReaction.charAt(0).toUpperCase() + currentReaction.slice(1)}`
                      : 'Reaction removed'}
                  </motion.div>
                )}
              </motion.div>
              
              {showReactions && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute -top-16 left-0 bg-white shadow-xl rounded-full flex p-2 border border-gray-200 z-10"
                >
                  {/* Reaction buttons with staggered animation */}
                  <motion.div className="flex" initial="hidden" animate="visible" variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.05
                      }
                    }
                  }}>
                    <motion.div className="relative group">
                      <motion.button
                        variants={{
                          hidden: { scale: 0.8, opacity: 0 },
                          visible: { scale: 1, opacity: 1 }
                        }}
                        whileHover={{ scale: 1.25, y: -5 }}
                        className="p-2 mx-1 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-all duration-200 shadow-sm hover:shadow-md"
                        onClick={() => handleLike("like")}
                      >
                        <ThumbsUp className={`h-5 w-5 ${isLikedState && currentReaction === "like" ? 'fill-purple-600' : ''}`} />
                      </motion.button>
                      <motion.span 
                        initial={{ opacity: 0, y: 0 }}
                        whileHover={{ opacity: 1, y: -2 }}
                        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-medium bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none"
                      >
                        Like
                      </motion.span>
                    </motion.div>
                    <motion.div className="relative group">
                      <motion.button
                        variants={{
                          hidden: { scale: 0.8, opacity: 0 },
                          visible: { scale: 1, opacity: 1 }
                        }}
                        whileHover={{ scale: 1.25, y: -5 }}
                        className="p-2 mx-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-200 shadow-sm hover:shadow-md"
                        onClick={() => handleLike("love")}
                      >
                        <Heart className={`h-5 w-5 ${isLikedState && currentReaction === "love" ? 'fill-red-600' : ''}`} />
                      </motion.button>
                      <motion.span 
                        initial={{ opacity: 0, y: 0 }}
                        whileHover={{ opacity: 1, y: -2 }}
                        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-medium bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none"
                      >
                        Love
                      </motion.span>
                    </motion.div>
                    <motion.div className="relative group">
                      <motion.button
                        variants={{
                          hidden: { scale: 0.8, opacity: 0 },
                          visible: { scale: 1, opacity: 1 }
                        }}
                        whileHover={{ scale: 1.25, y: -5 }}
                        className="p-2 mx-1 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-all duration-200 shadow-sm hover:shadow-md"
                        onClick={() => handleLike("celebrate")}
                      >
                        <Award className={`h-5 w-5 ${isLikedState && currentReaction === "celebrate" ? 'fill-yellow-600' : ''}`} />
                      </motion.button>
                      <motion.span 
                        initial={{ opacity: 0, y: 0 }}
                        whileHover={{ opacity: 1, y: -2 }}
                        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-medium bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none"
                      >
                        Celebrate
                      </motion.span>
                    </motion.div>
                    <motion.div className="relative group">
                      <motion.button
                        variants={{
                          hidden: { scale: 0.8, opacity: 0 },
                          visible: { scale: 1, opacity: 1 }
                        }}
                        whileHover={{ scale: 1.25, y: -5 }}
                        className="p-2 mx-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-200 shadow-sm hover:shadow-md"
                        onClick={() => handleLike("insightful")}
                      >
                        <Lightbulb className={`h-5 w-5 ${isLikedState && currentReaction === "insightful" ? 'fill-blue-600' : ''}`} />
                      </motion.button>
                      <motion.span 
                        initial={{ opacity: 0, y: 0 }}
                        whileHover={{ opacity: 1, y: -2 }}
                        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-medium bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none"
                      >
                        Insightful
                      </motion.span>
                    </motion.div>
                    
                    <motion.div className="relative group">
                      <motion.button
                        variants={{
                          hidden: { scale: 0.8, opacity: 0 },
                          visible: { scale: 1, opacity: 1 }
                        }}
                        whileHover={{ scale: 1.25, y: -5 }}
                        className="p-2 mx-1 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 transition-all duration-200 shadow-sm hover:shadow-md"
                        onClick={() => handleLike("funny")}
                      >
                        <Smile className={`h-5 w-5 ${isLikedState && currentReaction === "funny" ? 'fill-amber-600' : ''}`} />
                      </motion.button>
                      <motion.span 
                        initial={{ opacity: 0, y: 0 }}
                        whileHover={{ opacity: 1, y: -2 }}
                        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-medium bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none"
                      >
                        Funny
                      </motion.span>
                    </motion.div>
                    
                    <motion.div className="relative group">
                      <motion.button
                        variants={{
                          hidden: { scale: 0.8, opacity: 0 },
                          visible: { scale: 1, opacity: 1 }
                        }}
                        whileHover={{ scale: 1.25, y: -5 }}
                        className="p-2 mx-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-all duration-200 shadow-sm hover:shadow-md"
                        onClick={() => handleLike("support")}
                      >
                        <Hand className={`h-5 w-5 ${isLikedState && currentReaction === "support" ? 'fill-green-600' : ''}`} />
                      </motion.button>
                      <motion.span 
                        initial={{ opacity: 0, y: 0 }}
                        whileHover={{ opacity: 1, y: -2 }}
                        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-medium bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none"
                      >
                        Support
                      </motion.span>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center rounded-full px-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50"
              onClick={handleComment}
            >
              <MessageSquare className="mr-1 h-4 w-4" />
              <span className="text-sm">Comment</span>
              {localComments.length > 0 && (
                <span className="ml-1 bg-gray-100 text-gray-800 rounded-full px-1.5 py-0.5 text-xs font-medium">
                  {localComments.length}
                </span>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center rounded-full px-3 transition-colors ${
                isRepostedState 
                  ? 'text-green-600 bg-green-50 hover:text-green-700 hover:bg-green-100 border border-green-200' 
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
              onClick={handleRepost}
            >
              <Repeat2 className={`mr-1 h-4 w-4 ${isRepostedState ? 'fill-current' : ''}`} />
              <span className="text-sm">{isRepostedState ? 'Unrepost' : 'Repost'}</span>
              {repostsCount > 0 && (
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                  isRepostedState 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {repostsCount}
                </span>
              )}
            </Button>
            
            <div className="relative" ref={shareOptionsRef}>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center rounded-full px-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                onClick={handleShare}
              >
                <Share2 className="mr-1 h-4 w-4" />
                <span className="text-sm">Share</span>
              </Button>
            
              {/* Share options dropdown */}
              {showShareOptions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 bottom-full mb-2 bg-white rounded-lg shadow-xl border border-gray-200 w-56 z-20"
                >
                  <div className="p-2">
                    <h4 className="text-sm font-medium text-gray-800 px-2 py-1">Share this post</h4>
                    
                    <button 
                      className="w-full text-left flex items-center px-2 py-1.5 rounded-md hover:bg-gray-50 text-sm"
                      onClick={copyToClipboard}
                    >
                      <span className="bg-gray-100 p-1.5 rounded-full mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </span>
                      Copy to clipboard
                    </button>
                    
                    <button 
                      className="w-full text-left flex items-center px-2 py-1.5 rounded-md hover:bg-gray-50 text-sm"
                      onClick={shareViaEmail}
                    >
                      <span className="bg-blue-100 p-1.5 rounded-full mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                      Share via email
                    </button>
                    
                    <button 
                      className="w-full text-left flex items-center px-2 py-1.5 rounded-md hover:bg-gray-50 text-sm"
                      onClick={() => shareAsPrivateMessage()}
                    >
                      <span className="bg-purple-100 p-1.5 rounded-full mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </span>
                      Share as message
                    </button>
                    
                    <div className="border-t border-gray-100 my-1 mx-2"></div>
                    
                    <button 
                      className="w-full text-left flex items-center px-2 py-1.5 rounded-md hover:bg-gray-50 text-sm"
                      onClick={() => shareOnPlatform('LinkedIn')}
                    >
                      <span className="bg-blue-100 p-1.5 rounded-full mr-2 text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
                        </svg>
                      </span>
                      Share on LinkedIn
                    </button>
                    
                    <button 
                      className="w-full text-left flex items-center px-2 py-1.5 rounded-md hover:bg-gray-50 text-sm"
                      onClick={() => shareOnPlatform('Twitter')}
                    >
                      <span className="bg-blue-100 p-1.5 rounded-full mr-2 text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                        </svg>
                      </span>
                      Share on Twitter
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {(showComments || localComments.length > 0) && (
        <div className="px-4 pt-0 pb-2">
          {localComments.length > 0 && (
            <div className="mb-4 space-y-3">
              {localComments.map((item, index) => (
                <div key={index} className="flex space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.user.profileImageUrl || undefined} alt={item.user.name || item.user.username} />
                    <AvatarFallback className="text-xs bg-purple-100 text-purple-800">
                      {(item.user.name?.substring(0, 2) || item.user.username?.substring(0, 2)).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-medium text-sm text-gray-800">
                        {item.user.name || item.user.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(item.comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{item.comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <CardFooter className="px-4 py-3 border-t border-gray-100">
        <div className="flex w-full">
          <div className="flex-shrink-0 mr-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.name || user?.username} />
              <AvatarFallback className="text-xs bg-purple-100 text-purple-800">
                {user?.name?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 flex">
            <Textarea
              placeholder="Add a comment..."
              className="min-h-0 h-10 py-2 resize-none flex-1 bg-gray-100 border-0 focus-visible:ring-1 focus-visible:ring-primary-500"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitComment();
                }
              }}
            />
            {comment.trim() && (
              <Button 
                size="sm" 
                className="ml-2 self-center"
                onClick={submitComment}
                disabled={isSubmittingComment}
              >
                Post
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
