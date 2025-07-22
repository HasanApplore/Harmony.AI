import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout";
import FeedTabs from "@/components/feed-tabs";
import PostCard from "@/components/post-card";
import CreatePost from "@/components/create-post";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { queryClient } from "@/lib/queryClient";
import { Post, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Play } from "lucide-react";

export default function RecruiterFeed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("for-you");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [content, setContent] = useState("");
  const [enhancedPosts, setEnhancedPosts] = useState<any[]>([]);

  // Fetch posts
  const { data: posts, isLoading: loadingPosts } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  // Process posts
  useEffect(() => {
    // Only process posts when they are available
    if (!posts) {
      return;
    }
    
    const fetchPostDetails = async () => {
      const enhanced = await Promise.all(
        posts.map(async (post) => {
          try {
            const [authorRes, likesRes, commentsRes] = await Promise.all([
              fetch(`/api/users/${post.userId}`),
              fetch(`/api/posts/${post.id}/likes`),
              fetch(`/api/posts/${post.id}/comments`)
            ]);
            
            if (!authorRes.ok) {
              console.error(`Error fetching author for post ${post.id}:`, authorRes.status);
              throw new Error(`Failed to fetch author: ${authorRes.status}`);
            }
            
            if (!likesRes.ok) {
              console.error(`Error fetching likes for post ${post.id}:`, likesRes.status);
              throw new Error(`Failed to fetch likes: ${likesRes.status}`);
            }
            
            if (!commentsRes.ok) {
              console.error(`Error fetching comments for post ${post.id}:`, commentsRes.status);
              throw new Error(`Failed to fetch comments: ${commentsRes.status}`);
            }
            
            const author = await authorRes.json();
            const likes = await likesRes.json();
            const comments = await commentsRes.json();
            
            // Check if current user has liked this post
            const isLiked = Array.isArray(likes) && likes.some((like: any) => like.userId === user?.id);
            
            return {
              post,
              author,
              likes: Array.isArray(likes) ? likes.length : 0,
              comments: Array.isArray(comments) ? comments : [],
              isLiked: !!isLiked
            };
          } catch (error) {
            console.error(`Error processing post ${post.id}:`, error);
            // Return a default/fallback post with minimal error impact
            return {
              post,
              author: {
                id: post.userId,
                name: "Unknown User",
                username: "unknown_user",
                title: "User",
                profileImageUrl: null
              },
              likes: 0,
              comments: [],
              isLiked: false
            };
          }
        })
      );
      
      // Sort posts by most recent first
      const sortedPosts = enhanced.sort((a, b) => {
        const dateA = new Date(a.post.createdAt).getTime();
        const dateB = new Date(b.post.createdAt).getTime();
        return dateB - dateA;
      });
      
      setEnhancedPosts(sortedPosts);
    };
    
    fetchPostDetails();
  }, [posts, user?.id, isRefreshing]);

  // Handle tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  
  // Handle Most Recent Posts button click
  const handleMostRecentClick = () => {
    setIsRefreshing(true);
    toast({
      title: "Refreshing posts",
      description: "Getting the most recent posts for you",
    });
    
    // Invalidate posts query to refetch the latest data
    queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    
    // Simulate loading for better UX
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4">
        {/* Main Tab Navigation */}
        <FeedTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          onRecentPostsClick={handleMostRecentClick} 
        />

        {/* Content Grid */}
        <div className="grid md:grid-cols-10 gap-6">
          {/* Left Column - Feed */}
          <div className="md:col-span-7 space-y-6">
            {/* Create Post */}
            <div className="create-post-section">
              <CreatePost 
                className="transform transition-all hover:shadow-md" 
                initialContent={content}
                onContentChange={setContent}
              />
            </div>

            {/* Feed Posts */}
            {activeTab === "for-you" && (
              <>
                {loadingPosts || isRefreshing ? (
                  <div className="space-y-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : (
                  <>
                    {enhancedPosts.map((item) => (
                      <PostCard
                        key={item.post.id}
                        post={item.post}
                        author={item.author}
                        likes={item.likes}
                        comments={item.comments}
                        isLiked={item.isLiked}
                      />
                    ))}
                    {enhancedPosts.length === 0 && (
                      <div className="bg-white shadow rounded-lg p-8 text-center">
                        <p className="text-gray-500">No posts available. Start by creating your first post!</p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            
            {/* Trending Content */}
            {activeTab === "trending" && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800">Trending Topics</h3>
                  <p className="text-gray-500 mt-1">Discover what professionals are talking about</p>
                </div>
                
                <div className="p-6 pt-0 space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            )}
            
            {/* Job Recommendations */}
            {activeTab === "jobs" && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800">Recommended Jobs</h3>
                  <p className="text-gray-500 mt-1">Based on your preferences and skills</p>
                </div>
                
                <div className="p-6 pt-0 space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Digital CV, Stats, Communities */}
          <div className="md:col-span-3 space-y-6">
            {/* Your Digital CV */}
            <Card className="border-0 shadow-md overflow-hidden digital-cv-section">
              <div className="bg-purple-600 p-4 text-white flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  <span className="font-medium">Your Digital CV</span>
                </div>
                <Button variant="secondary" size="sm" className="h-7 text-xs px-2 rounded">
                  Update
                </Button>
              </div>
              <CardContent className="p-0">
                <div className="relative aspect-video w-full h-48 bg-gray-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Button 
                        variant="outline"
                        className="rounded-full h-14 w-14 bg-white/80 hover:bg-white flex items-center justify-center"
                      >
                        <Play className="h-6 w-6 text-purple-600" />
                      </Button>
                      <p className="text-sm text-gray-500">View your video CV</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Profile Activity */}
            <Card className="border-0 shadow-md stats-section">
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <span className="h-5 w-5 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-purple-600">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </span>
                  Profile Activity
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-600">
                          <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" />
                          <rect width="18" height="18" x="3" y="4" rx="2" />
                          <circle cx="12" cy="10" r="2" />
                          <line x1="8" x2="8" y1="2" y2="4" />
                          <line x1="16" x2="16" y1="2" y2="4" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Profile views</p>
                        <p className="text-2xl font-bold">142</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">+12%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-600">
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <path d="M12 8v8" />
                          <path d="m8.5 12 7 0" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Digital CV views</p>
                        <p className="text-2xl font-bold">38</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">+8%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-600">
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.3-4.3" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Search appearances</p>
                        <p className="text-2xl font-bold">73</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">+15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}