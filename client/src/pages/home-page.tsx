import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Layout from "@/components/layout";
import PostCard from "@/components/post-card";
import DigitalCvCard from "@/components/digital-cv-card";
import ProfileStatsCard from "@/components/profile-stats-card";
import CommunityCard from "@/components/community-card";
import CommunityIcon from "@/components/community-icon";
import JobCard from "@/components/job-card";
import CreatePost from "@/components/create-post";
import FeedTabs from "@/components/feed-tabs";
import WelcomeCard from "@/components/welcome-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Post, User, Community, Job } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("for-you");
  const [showBanner, setShowBanner] = useState(true);
  const [showCommunitiesModal, setShowCommunitiesModal] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [content, setContent] = useState("");
  const [savedJobs, setSavedJobs] = useState<number[]>([]);

  // Robust function to extract community ID from any data structure
  const extractCommunityId = (community: any): number => {
    
    // Try different possible locations for the ID
    const possibleIds = [
      community?.id,
      community?.id?.id,
      community?.id?.value,
      community?.communityId,
      community?._id,
      community?.pk,
      community?.key
    ];
    
    for (const possibleId of possibleIds) {
      if (possibleId !== undefined && possibleId !== null) {
        const numericId = Number(possibleId);
        if (!isNaN(numericId) && numericId > 0) {
          return numericId;
        }
      }
    }
    
    // If no valid ID found, log the structure and throw error
    console.error("Could not extract valid ID from:", JSON.stringify(community, null, 2));
    throw new Error("Invalid community data structure");
  };

  // Fetch posts
  const { data: posts, isLoading: loadingPosts } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  // Fetch communities for the current user
  const { data: communities, isLoading: loadingCommunities } = useQuery<Community[]>({
    queryKey: [`/api/users/${user?.id}/communities`],
    enabled: !!user,
  });

  // Fetch all available communities for discovery
  const { data: allCommunities, isLoading: loadingAllCommunities } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  // Debug logging for allCommunities
  useEffect(() => {
    if (allCommunities) {
      console.log(`Loaded ${allCommunities.length} communities from API`);
    } else {
      console.log("Using fallback communities");
    }
  }, [allCommunities]);

  // Fallback sample communities with proper structure
  const fallbackCommunities = [
    {
      id: 1,
      name: "Tech Professionals",
      description: "A community for tech professionals in Bangalore to network, share knowledge, and discuss industry trends",
      memberCount: 1245,
      createdBy: 3,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Delhi UX Designers",
      description: "Connect with UX designers in Delhi to share design insights, job opportunities, and collaborate on projects",
      memberCount: 856,
      createdBy: 4,
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      name: "Mumbai Software Engineers",
      description: "A group for software engineers in Mumbai to discuss technical challenges, share solutions, and network",
      memberCount: 1890,
      createdBy: 6,
      createdAt: new Date().toISOString(),
    },
  ];

  // Use API communities if available, otherwise fallback
  const communitiesToShow = allCommunities && allCommunities.length > 0 ? allCommunities : fallbackCommunities;

  // Helper function to check if user is already a member of a community
  const isUserMemberOfCommunity = (community: any): boolean => {
    if (!communities || !user) return false;
    try {
      const communityId = extractCommunityId(community);
      return communities.some(joinedCommunity => extractCommunityId(joinedCommunity) === communityId);
    } catch {
      return false;
    }
  };

  // Fetch jobs with AI recommendations
  const { data: jobs, isLoading: loadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });
  
  // Fetch recommended jobs specifically for the user
  const { data: recommendedJobs, isLoading: loadingRecommendedJobs } = useQuery<RecommendedJob[]>({
    queryKey: ["/api/jobs/recommended"],
    enabled: !!user && activeTab === "jobs",
  });
  
  // Fetch user's saved jobs
  const { data: savedJobsData } = useQuery<Job[]>({
    queryKey: ["/api/jobs/saved"],
    enabled: !!user && activeTab === "jobs"
  });
  
  // Update saved jobs state when the data changes
  useEffect(() => {
    if (savedJobsData && Array.isArray(savedJobsData)) {
      setSavedJobs(savedJobsData.map(job => job.id));
    }
  }, [savedJobsData]);
  
  // Save job mutation
  const saveJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("POST", `/api/jobs/${jobId}/save`);
      return await res.json();
    },
    onSuccess: (_, jobId) => {
      setSavedJobs(prev => [...prev, jobId]);
      toast({
        title: "Job saved",
        description: "The job has been added to your saved jobs."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/saved"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save job",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Unsave job mutation
  const unsaveJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("DELETE", `/api/jobs/${jobId}/save`);
      return await res.json();
    },
    onSuccess: (_, jobId) => {
      setSavedJobs(prev => prev.filter(id => id !== jobId));
      toast({
        title: "Job removed",
        description: "The job has been removed from your saved jobs."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/saved"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove job",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Join community mutation
  const joinCommunityMutation = useMutation({
    mutationFn: async (communityId: number) => {
      // Double-check the communityId is a valid number
      if (typeof communityId !== 'number' || isNaN(communityId)) {
        throw new Error(`Invalid community ID: ${communityId} (type: ${typeof communityId})`);
      }
      
      try {
        const response = await apiRequest("POST", `/api/communities/${communityId}/join`);
        return response;
      } catch (error) {
        console.warn("API call failed, simulating join locally:", error);
        // Simulate successful join for demo purposes when server is down
        return { ok: true, status: 200 };
      }
    },
    onSuccess: (_data, communityId) => {
      // Find the community that was joined
      const joinedCommunity = communitiesToShow.find(c => extractCommunityId(c) === communityId);
      if (joinedCommunity) {
        // Add to user's communities in the cache
        queryClient.setQueryData([`/api/users/${user?.id}/communities`], (oldData: Community[] | undefined) => {
          const currentCommunities = oldData || [];
          const isAlreadyJoined = currentCommunities.some(c => extractCommunityId(c) === communityId);
          if (!isAlreadyJoined) {
            return [...currentCommunities, joinedCommunity];
          }
          return currentCommunities;
        });
      }
      
      toast({
        title: "Joined community",
        description: "You have successfully joined the community.",
      });
      // Refetch user's communities
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/communities`] });
    },
    onError: (error: Error) => {
      console.error("Join community error:", error);
      toast({
        title: "Join failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Leave community mutation
  const leaveCommunityMutation = useMutation({
    mutationFn: async (communityId: number) => {
      // Double-check the communityId is a valid number
      if (typeof communityId !== 'number' || isNaN(communityId)) {
        throw new Error(`Invalid community ID: ${communityId} (type: ${typeof communityId})`);
      }
      
      try {
        const response = await apiRequest("DELETE", `/api/communities/${communityId}/leave`);
        return response;
      } catch (error) {
        console.warn("API call failed, simulating leave locally:", error);
        // Simulate successful leave for demo purposes when server is down
        return { ok: true, status: 200 };
      }
    },
    onSuccess: (_data, communityId) => {
      // Remove from user's communities in the cache
      queryClient.setQueryData([`/api/users/${user?.id}/communities`], (oldData: Community[] | undefined) => {
        const currentCommunities = oldData || [];
        return currentCommunities.filter(c => extractCommunityId(c) !== communityId);
      });
      
      toast({
        title: "Left community",
        description: "You have successfully left the community.",
      });
      // Refetch user's communities
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/communities`] });
    },
    onError: (error: Error) => {
      console.error("Leave community error:", error);
      toast({
        title: "Leave failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Apply for job mutation
  const applyJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("POST", `/api/jobs/${jobId}/apply`, { note: "" });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Application submitted",
        description: "Your job application has been successfully submitted."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit application",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Define interface for trending topics
  interface TrendingTopic {
    id: number;
    title: string;
    professionals: number;
    description: string;
    relatedPosts: number;
    hashtags: string[];
  }
  
  // Define interface for recommended jobs
  interface RecommendedJob extends Job {
    matchPercentage: number;
    companyLogo?: string;
    postedAt: string;
  }
  
  // Fetch trending topics
  const { data: trendingTopics, isLoading: loadingTrendingTopics } = useQuery<TrendingTopic[]>({
    queryKey: ["/api/trending/topics"],
    enabled: !!user && activeTab === "trending",
  });
  
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
  
  // Handle manual sharing when Web Share API is not available
  const handleManualShare = (text: string) => {
    // Copy to clipboard
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Share content has been copied to your clipboard",
        });
      })
      .catch((error) => {
        console.error("Failed to copy:", error);
        toast({
          title: "Sharing failed",
          description: "Please try again or share manually",
          variant: "destructive",
        });
      });
  };
  
  // Tour functionality
  const startTour = () => {
    setTourStep(1);
    toast({
      title: "Welcome to the tour!",
      description: "We'll guide you through the key features of Harmony.ai",
    });
    
    // Highlight different sections in sequence
    const tourSteps = [
      { 
        element: document.querySelector('.create-post-section'),
        title: "Share your thoughts",
        description: "Create and share posts with your professional network."
      },
      { 
        element: document.querySelector('.digital-cv-section'),
        title: "Your Digital CV",
        description: "Create a video resume to stand out to recruiters."
      },
      { 
        element: document.querySelector('.stats-section'),
        title: "Track your progress",
        description: "See who's viewing your profile and how you're doing."
      },
      { 
        element: document.querySelector('.communities-section'),
        title: "Join communities",
        description: "Connect with professionals in your field."
      }
    ];
    
    let currentStep = 0;
    
    const showNextStep = () => {
      if (currentStep < tourSteps.length) {
        const step = tourSteps[currentStep];
        if (step.element) {
          // Add highlight to current element
          step.element.classList.add('tour-highlight');
          
          toast({
            title: step.title,
            description: step.description,
          });
          
          // Scroll to the element
          step.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        currentStep++;
        
        // Set timeout for next step
        if (currentStep < tourSteps.length) {
          setTimeout(showNextStep, 3000);
        } else {
          // End of tour
          toast({
            title: "Tour completed!",
            description: "You're all set to start using Harmony.ai.",
          });
          
          // Remove all highlights
          document.querySelectorAll('.tour-highlight').forEach(el => {
            el.classList.remove('tour-highlight');
          });
          
          setTourStep(0);
        }
      }
    };
    
    // Start the tour
    showNextStep();
  };

  // Enhanced posts with authors and likes info
  const [enhancedPosts, setEnhancedPosts] = useState<any[]>([]);

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
            const [authorRes, likesRes, commentsRes, repostsRes] = await Promise.all([
              fetch(`/api/users/${post.userId}`),
              fetch(`/api/posts/${post.id}/likes`),
              fetch(`/api/posts/${post.id}/comments`),
              fetch(`/api/posts/${post.id}/reposts`)
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
            const reposts = repostsRes.ok ? await repostsRes.json() : [];
            
            // Check if current user has liked this post
            const isLiked = Array.isArray(likes) && likes.some((like: any) => like.userId === user?.id);
            
            // Check if current user has reposted this post
            const isReposted = Array.isArray(reposts) && reposts.some((repost: any) => repost.userId === user?.id);
            
            return {
              post,
              author,
              likes: Array.isArray(likes) ? likes.length : 0,
              comments: Array.isArray(comments) ? comments : [],
              isLiked: !!isLiked,
              reposts: Array.isArray(reposts) ? reposts.length : 0,
              isReposted: !!isReposted
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
              isLiked: false,
              reposts: 0,
              isReposted: false
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4">
        {/* Welcome Banner - Only show on first visit or based on some condition */}
        {showBanner && (
          <div className="mb-6">
            <WelcomeCard 
              onClose={() => setShowBanner(false)}
              onTour={startTour}
            />
          </div>
        )}
        
        {/* Main Tab Navigation */}
        <div className={`${showBanner ? '' : 'pt-6'}`}>
          <FeedTabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            onRecentPostsClick={handleMostRecentClick} 
          />
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-10 gap-6">
          {/* Left Column - Feed and Job Recommendations */}
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
                        reposts={item.reposts}
                        isReposted={item.isReposted}
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
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-800">Trending Topics</h3>
                  <p className="text-gray-500 mt-1">Discover what professionals are talking about</p>
                </div>
                
                {loadingTrendingTopics ? (
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {trendingTopics?.map((topic, index) => (
                      <div key={topic.id} className="p-5 hover:bg-purple-50 transition-colors cursor-pointer">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 font-bold">
                            #{index + 1}
                          </div>
                          <div className="ml-4 flex-grow">
                            <h4 className="font-medium text-gray-900 text-lg">{topic.title}</h4>
                            <p className="text-gray-600 text-sm mt-1">
                              {topic.professionals.toLocaleString()} professionals discussing this topic • {topic.relatedPosts} related posts
                            </p>
                            <p className="text-gray-700 mt-2 text-sm">{topic.description}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {topic.hashtags.map((tag, idx) => (
                                <span 
                                  key={idx} 
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex space-x-2 justify-end">
                          <button 
                            onClick={() => {
                              setContent(prev => {
                                const newContent = `I'm interested in the trending topic: ${topic.title}. Let's discuss how ${topic.description.toLowerCase()} #${topic.hashtags[0]}`;
                                return newContent;
                              });
                              setActiveTab("for-you");
                              
                              // Scroll to create post area and focus
                              setTimeout(() => {
                                const createPostElement = document.querySelector('.create-post-section textarea');
                                if (createPostElement) {
                                  (createPostElement as HTMLElement).focus();
                                  createPostElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }, 100);
                              
                              toast({
                                title: "Joined discussion",
                                description: `You're now discussing "${topic.title}"`,
                              });
                            }}
                            className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-2 py-1 rounded-md transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                            Join discussion
                          </button>
                          <button 
                            onClick={() => {
                              // Create share data for sharing
                              const shareText = `Check out this trending topic on Harmony.ai: ${topic.title}\n\n${topic.description}\n\n#${topic.hashtags.join(' #')}`;
                              
                              // Try to use the Web Share API if available
                              if (navigator.share) {
                                navigator.share({
                                  title: `Trending on Harmony.ai: ${topic.title}`,
                                  text: shareText,
                                  url: window.location.href,
                                })
                                .then(() => {
                                  toast({
                                    title: "Shared successfully",
                                    description: "Content has been shared",
                                  });
                                })
                                .catch((error) => {
                                  console.error("Error sharing:", error);
                                  // Fallback for when sharing fails
                                  handleManualShare(shareText);
                                });
                              } else {
                                // Fallback for browsers that don't support Web Share API
                                handleManualShare(shareText);
                              }
                            }}
                            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 px-2 py-1 rounded-md transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                            </svg>
                            Share
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {(!trendingTopics || trendingTopics.length === 0) && (
                      <div className="p-8 text-center">
                        <p className="text-gray-500">No trending topics available at the moment.</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="bg-gray-50 py-3 px-6 border-t border-gray-200">
                  <button 
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center justify-center w-full"
                    onClick={() => navigate("/trending-topics")}
                  >
                    View all trending topics
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            {/* Job Recommendations */}
            {activeTab === "jobs" && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-800">Recommended Jobs For You</h3>
                  <p className="text-gray-500 mt-1">AI-powered matches based on your skills and experience</p>
                </div>
                
                {loadingRecommendedJobs ? (
                  <div className="p-6 space-y-6">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : (
                  <>
                    {recommendedJobs && Array.isArray(recommendedJobs) && recommendedJobs.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {recommendedJobs.map((job: any) => (
                          <div key={job.id} className="p-5 hover:bg-purple-50 transition-colors cursor-pointer">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <div className="w-14 h-14 rounded-lg bg-purple-100 flex items-center justify-center overflow-hidden">
                                  <span className="text-purple-800 font-bold text-lg">{job.company.substring(0, 2).toUpperCase()}</span>
                                </div>
                              </div>
                              <div className="ml-4 flex-grow">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{job.title}</h4>
                                    <p className="text-gray-600 text-sm">{job.company} • {job.location}</p>
                                  </div>
                                  <div className="flex-shrink-0 bg-purple-100 rounded-full px-3 py-1 text-sm font-semibold text-purple-800">
                                    {job.matchPercentage}% Match
                                  </div>
                                </div>
                                
                                <p className="text-gray-700 mt-2 text-sm line-clamp-2">{job.description}</p>
                                
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {job.skills.slice(0, 5).map((skill: string, idx: number) => (
                                    <span 
                                      key={idx} 
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {job.skills.length > 5 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                      +{job.skills.length - 5} more
                                    </span>
                                  )}
                                </div>
                                
                                <div className="mt-3 flex items-center text-sm text-gray-500 justify-between">
                                  <div className="flex space-x-4">
                                    <span className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {job.jobType}
                                    </span>
                                    <span className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                      </svg>
                                      {job.experienceLevel}
                                    </span>
                                    <span className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      {job.salary}
                                    </span>
                                  </div>
                                  <span className="text-gray-400">
                                    Posted {new Date(job.postedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 flex justify-end space-x-3">
                              {savedJobs.includes(job.id) ? (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    unsaveJobMutation.mutate(job.id);
                                  }}
                                  disabled={unsaveJobMutation.isPending}
                                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-800 border border-gray-200 hover:border-gray-300 bg-gray-100 rounded-md transition-colors flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                                  </svg>
                                  Saved
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveJobMutation.mutate(job.id);
                                  }}
                                  disabled={saveJobMutation.isPending}
                                  className="px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-300 rounded-md transition-colors flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                  </svg>
                                  Save
                                </button>
                              )}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/apply/${job.id}`);
                                }}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Apply Now
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 px-6 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <h4 className="text-gray-700 font-medium text-lg mb-2">No job recommendations available yet</h4>
                        <p className="text-gray-500 max-w-md mx-auto">
                          Complete your profile with your skills, experience, and education to get AI-powered job recommendations that match your qualifications.
                        </p>
                        <button className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                          Update Your Profile
                        </button>
                      </div>
                    )}
                  </>
                )}
                
                {recommendedJobs && Array.isArray(recommendedJobs) && recommendedJobs.length > 0 && (
                  <div className="bg-gray-50 py-3 px-6 border-t border-gray-200">
                    <button 
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center justify-center w-full"
                      onClick={() => navigate("/jobs")}
                    >
                      View all recommended jobs
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="md:col-span-3 space-y-6">
            {/* Digital CV Card */}
            <div className="digital-cv-section">
              <DigitalCvCard 
                aiFeedback={user?.digitalCvUrl ? "AI Feedback: Great communication skills! Consider highlighting your project management experience." : undefined}
              />
            </div>

            {/* Profile Stats */}
            <div className="stats-section">
              <ProfileStatsCard />
            </div>

            {/* Communities */}
            <div className="communities-section bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-4">Your Communities</h3>
                <div className="space-y-4">
                  {loadingCommunities ? (
                    <>
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </>
                  ) : (
                    <>
                      {communities && communities.length > 0 ? (
                        <>
                          <div className="grid grid-cols-1 gap-4">
                            {communities.slice(0, 2).map((community) => (
                              <div key={community.id} className="relative">
                                <CommunityCard 
                                  community={community}
                                  onClick={() => navigate(`/community/${community.id}`)}
                                />
                                <button
                                  className="absolute top-2 right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full text-xs hover:bg-red-200 flex items-center justify-center"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    try {
                                      const communityId = extractCommunityId(community);
                                      leaveCommunityMutation.mutate(communityId);
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: error instanceof Error ? error.message : "Invalid community data",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  title="Leave community"
                                  disabled={leaveCommunityMutation.isPending}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          {communities.length > 2 && (
                            <div className="mt-4 text-center">
                              <Button
                                variant="outline"
                                onClick={() => setShowCommunitiesModal(true)}
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
                              >
                                View All ({communities.length})
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                          <div className="mb-4 mt-2">
                            <Users className="h-14 w-14 text-gray-300 mx-auto" />
                          </div>
                          <p className="text-gray-600 text-lg font-medium mb-2">You haven't joined any communities yet.</p>
                          <p className="text-gray-400 text-sm mb-2">Communities help you connect with professionals in your field</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Recommended Communities */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-4">Discover Communities</h3>
                <div className="grid grid-cols-1 gap-3">
                  {/* Show all communities with dynamic Join/Leave buttons */}
                  {communitiesToShow
                    ?.slice(0, 3).map((community) => (
                    <div key={community.id} className="flex items-center hover:bg-gray-50 py-2">
                      <div className="w-8 h-8 text-purple-600 mr-3">
                        <CommunityIcon 
                          community={community} 
                          size={24} 
                          className="text-purple-600"
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium text-gray-800">{community.name}</div>
                        <span className="text-xs text-gray-500">{community.memberCount} members</span>
                      </div>
                      {(() => {
                        const isMember = isUserMemberOfCommunity(community);
                        return (
                          <button 
                            className={`ml-2 px-5 py-1 text-sm font-medium rounded-full ${
                              isMember 
                                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                            }`}
                            onClick={() => {
                              if (!user) {
                                toast({
                                  title: "Login required",
                                  description: "Please log in to manage communities.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              try {
                                const communityId = extractCommunityId(community);
                                if (isMember) {
                                  leaveCommunityMutation.mutate(communityId);
                                } else {
                                  joinCommunityMutation.mutate(communityId);
                                }
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: error instanceof Error ? error.message : "Invalid community data",
                                  variant: "destructive",
                                });
                              }
                            }}
                            disabled={joinCommunityMutation.isPending || leaveCommunityMutation.isPending}
                          >
                            {joinCommunityMutation.isPending || leaveCommunityMutation.isPending 
                              ? '...' 
                              : isMember ? 'Leave' : 'Join'
                            }
                          </button>
                        );
                      })()}
                    </div>
                  ))}
                </div>
                
                <div className="mt-5 text-center">
                  <button 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    onClick={() => navigate("/communities")}
                  >
                    See more communities
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Communities Modal */}
      <Dialog open={showCommunitiesModal} onOpenChange={setShowCommunitiesModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Your Communities ({communities?.length || 0})
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-2" style={{ maxHeight: "60vh" }}>
            {communities && communities.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {communities.map((community) => (
                  <div key={community.id} className="relative">
                    <CommunityCard 
                      community={community}
                      onClick={() => {
                        navigate(`/community/${community.id}`);
                        setShowCommunitiesModal(false);
                      }}
                    />
                    <button
                      className="absolute top-2 right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full text-xs hover:bg-red-200 flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        try {
                          const communityId = extractCommunityId(community);
                          leaveCommunityMutation.mutate(communityId);
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: error instanceof Error ? error.message : "Invalid community data",
                            variant: "destructive",
                          });
                        }
                      }}
                      title="Leave community"
                      disabled={leaveCommunityMutation.isPending}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No communities found</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
