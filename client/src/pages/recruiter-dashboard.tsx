import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CreatePost from "@/components/create-post";
import PostCard from "@/components/post-card";
import WelcomeCard from "@/components/welcome-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  BarChart, 
  Building2, 
  Users, 
  Calendar, 
  BriefcaseBusiness, 
  Briefcase,
  CheckCircle2, 
  Clock, 
  FileStack,
  PlusCircle,
  Search,
  Trophy,
  UserCheck,
  X,
  ChevronRight,
  ChevronLeft,
  HelpCircle
} from "lucide-react";
import { Post, User } from "@shared/schema";

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [content, setContent] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [enhancedPosts, setEnhancedPosts] = useState<any[]>([]);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  
  // References to elements we'll highlight during the tour
  const createPostRef = useRef<HTMLDivElement>(null);
  const applicantsButtonRef = useRef<HTMLButtonElement>(null);
  const postJobButtonRef = useRef<HTMLButtonElement>(null);
  const overviewTabRef = useRef<HTMLButtonElement>(null);
  const jobsTabRef = useRef<HTMLButtonElement>(null);
  const candidatesTabRef = useRef<HTMLButtonElement>(null);
  const interviewsTabRef = useRef<HTMLButtonElement>(null);
  const statsCardRef = useRef<HTMLDivElement>(null);
  
  // Fetch posts for feed
  const { data: posts, isLoading: loadingPosts } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  // Process posts for feed
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

  // Overview stats
  const {
    data: stats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ["/api/recruiter/stats"],
    queryFn: () => {
      // Fallback to sample data until API is implemented
      return {
        activeJobs: 5,
        totalApplicants: 127,
        shortlistedCandidates: 18,
        interviewsScheduled: 7,
        talentPoolSize: 43,
        viewRate: 78,
        applicantRate: 24,
        conversionRate: 5.2
      };
    }
  });
  
  // Active jobs data
  const {
    data: jobs,
    isLoading: jobsLoading
  } = useQuery({
    queryKey: ["/api/recruiter/jobs"],
    queryFn: () => {
      // Fallback to sample data until API is implemented
      return [
        {
          id: 1,
          title: "Senior Business Analyst",
          company: user?.company || "Your Company",
          location: "Bengaluru, Karnataka",
          applicantCount: 32,
          shortlistedCount: 8,
          status: "active",
          postedDate: "2025-05-01T09:51:15.873Z",
          views: 145
        },
        {
          id: 2,
          title: "Product Manager",
          company: user?.company || "Your Company",
          location: "Delhi, Remote",
          applicantCount: 47,
          shortlistedCount: 5,
          status: "active",
          postedDate: "2025-05-05T09:51:15.873Z",
          views: 203
        },
        {
          id: 3,
          title: "Data Scientist",
          company: user?.company || "Your Company",
          location: "Mumbai, Hybrid",
          applicantCount: 24,
          shortlistedCount: 3,
          status: "active",
          postedDate: "2025-05-07T09:51:15.873Z",
          views: 112
        },
        {
          id: 4,
          title: "UX Designer",
          company: user?.company || "Your Company",
          location: "Remote",
          applicantCount: 19,
          shortlistedCount: 2,
          status: "active",
          postedDate: "2025-05-10T09:51:15.873Z",
          views: 87
        },
        {
          id: 5,
          title: "DevOps Engineer",
          company: user?.company || "Your Company",
          location: "Pune, Maharashtra",
          applicantCount: 5,
          shortlistedCount: 0,
          status: "active",
          postedDate: "2025-05-12T09:51:15.873Z",
          views: 42
        }
      ];
    }
  });
  
  // Top candidates
  const {
    data: topCandidates,
    isLoading: candidatesLoading
  } = useQuery({
    queryKey: ["/api/recruiter/top-candidates"],
    queryFn: () => {
      // Fallback to sample data until API is implemented
      return [
        {
          id: 3,
          name: "Priya Sharma",
          title: "Senior UX Designer",
          matchScore: 92,
          skills: ["User Research", "UX Design", "Figma", "Prototyping", "User Testing"],
          profileImageUrl: "https://randomuser.me/api/portraits/women/79.jpg",
          hasVideo: true
        },
        {
          id: 4,
          name: "Arjun Patel",
          title: "Full Stack Developer",
          matchScore: 89,
          skills: ["React", "Node.js", "TypeScript", "MongoDB", "Docker"],
          profileImageUrl: "https://randomuser.me/api/portraits/men/32.jpg",
          hasVideo: true
        },
        {
          id: 5,
          name: "Divya Reddy",
          title: "Data Scientist",
          matchScore: 85,
          skills: ["Python", "ML", "Data Analysis", "TensorFlow", "Statistical Analysis"],
          profileImageUrl: "https://randomuser.me/api/portraits/women/44.jpg",
          hasVideo: false
        }
      ];
    }
  });
  
  // Upcoming interviews
  const {
    data: interviews,
    isLoading: interviewsLoading
  } = useQuery({
    queryKey: ["/api/recruiter/interviews"],
    queryFn: () => {
      // Fallback to sample data until API is implemented
      return [
        {
          id: 1,
          candidateName: "Arjun Patel",
          jobTitle: "Senior Business Analyst",
          date: "2025-05-18T10:00:00Z",
          type: "Virtual",
          profileImageUrl: "https://randomuser.me/api/portraits/men/32.jpg"
        },
        {
          id: 2,
          candidateName: "Priya Sharma",
          jobTitle: "Product Manager",
          date: "2025-05-19T14:30:00Z",
          type: "In-person",
          profileImageUrl: "https://randomuser.me/api/portraits/women/79.jpg"
        },
        {
          id: 3,
          candidateName: "Raj Kumar",
          jobTitle: "UX Designer",
          date: "2025-05-20T11:00:00Z",
          type: "Virtual",
          profileImageUrl: "https://randomuser.me/api/portraits/men/11.jpg"
        }
      ];
    }
  });
  
  // Function to refresh posts
  const handleRefreshPosts = () => {
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

  // Define tour steps with titles, descriptions, and icons
  const tourSteps = [
    {
      title: "Dashboard Overview",
      description: "This is your recruiter dashboard where you can post jobs, track applicants, and engage with your talent network. Create posts to share job openings and company updates.",
      icon: PlusCircle
    },
    {
      title: "Post New Jobs",
      description: "Click this button to create new job postings. You can set requirements, location, salary range, and other details to attract the right candidates.",
      icon: Briefcase
    },
    {
      title: "Track Applicants",
      description: "Monitor and manage applications with the Applicants button. View candidate profiles, filter by skills, and track the status of each application.",
      icon: Users
    },
    {
      title: "Navigation Features",
      description: "Switch between tabs to access different features. View all your job postings, explore your talent pool, and manage scheduled interviews from these tabs.",
      icon: Calendar
    },
    {
      title: "Recruitment Analytics",
      description: "Track key recruitment metrics including application rates, profile views, and top candidates. Use this data to optimize your hiring strategy and find the best talent.",
      icon: BarChart
    }
  ];
  
  // Tour navigation functions
  const startTour = () => {
    setTourActive(true);
    setTourStep(1);
  };

  const nextTourStep = () => {
    if (tourStep < 5) {
      setTourStep(tourStep + 1);
    } else {
      endTour();
    }
  };

  const prevTourStep = () => {
    if (tourStep > 1) {
      setTourStep(tourStep - 1);
    }
  };

  const endTour = () => {
    setTourActive(false);
    setTourStep(0);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4">
        {/* Tour Card - Matches the screenshot exactly */}
        {tourActive && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={endTour}></div>
            
            {/* Tour card - positioned to match the specific element being highlighted */}
            <div 
              className="fixed z-[10000] bg-white rounded-xl shadow-2xl w-[480px] p-6 pointer-events-auto"
              style={{
                top: tourStep === 1 ? '170px' : 
                     tourStep === 2 ? '140px' : 
                     tourStep === 3 ? '340px' : 
                     tourStep === 4 ? '240px' : '340px',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              {/* Close button */}
              <button 
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-700" 
                onClick={endTour}
              >
                <X className="h-5 w-5" />
              </button>
              
              {/* Tour content */}
              <div className="flex items-start gap-4 mb-5">
                <div className="p-3 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="text-purple-700">
                    {tourStep === 1 && <PlusCircle className="h-6 w-6" />}
                    {tourStep === 2 && <Briefcase className="h-6 w-6" />}
                    {tourStep === 3 && <Users className="h-6 w-6" />}
                    {tourStep === 4 && <Calendar className="h-6 w-6" />}
                    {tourStep === 5 && <BarChart className="h-6 w-6" />}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {tourSteps[tourStep-1].title}
                  </h3>
                  <p className="text-gray-600">
                    {tourSteps[tourStep-1].description}
                  </p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="relative h-2 bg-purple-100 rounded-full mb-6 overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-purple-600 transition-all duration-300"
                  style={{ width: `${tourStep * 20}%` }}
                />
              </div>
              
              {/* Navigation controls */}
              <div className="flex justify-between items-center">
                <button 
                  onClick={prevTourStep}
                  disabled={tourStep === 1}
                  className={`flex items-center px-4 py-2 rounded-md ${tourStep === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  Previous
                </button>
                
                <div className="text-sm text-gray-500">
                  Step {tourStep} of 5
                </div>
                
                <button 
                  onClick={nextTourStep}
                  className="flex items-center px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                >
                  {tourStep === 5 ? 'Finish' : 'Next'}
                  {tourStep < 5 && <ChevronRight className="h-5 w-5 ml-1" />}
                </button>
              </div>
            </div>
            
            {/* Highlighted elements */}
            {tourStep === 1 && (
              <div className="fixed top-0 left-0 w-full h-full pointer-events-none" />
            )}
            
            {tourStep === 2 && (
              <div className="fixed top-0 left-0 w-full h-full pointer-events-none" />
            )}
            
            {tourStep === 3 && (
              <>
                <div className="fixed top-[400px] right-[250px] border-2 border-purple-600 rounded-full shadow-[0_0_15px_rgba(138,63,252,0.6)] animate-pulse" 
                  style={{ width: '150px', height: '45px', zIndex: 9998 }} />
                
                <div className="fixed top-[400px] right-[250px] bg-purple-600/10 rounded-full"
                  style={{ width: '200px', height: '100px', zIndex: 9997 }} />
              </>
            )}
            
            {tourStep === 4 && (
              <div className="fixed top-0 left-0 w-full h-full pointer-events-none" />
            )}
            
            {tourStep === 5 && (
              <div className="fixed top-0 left-0 w-full h-full pointer-events-none" />
            )}
          </div>
        )}
        {/* Welcome banner for recruiters */}
        <div className="mb-6">
          <WelcomeCard 
            onTour={startTour}
          />
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Recruiter Dashboard</h1>
            <p className="text-gray-600">{user?.company || "Your Company"} • {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-white text-purple-600 border border-purple-600 hover:bg-purple-50 rounded-full px-4"
              onClick={() => navigate("/applicant-tracking")}
            >
              <Users className="h-4 w-4 mr-2" />
              Applicants
            </Button>
            <Button 
              className="bg-[#8a3ffc] hover:bg-[#7a2ff2] rounded-full px-4"
              onClick={() => navigate("/create-job-posting")}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 text-sm font-medium ${activeTab === "overview" ? 
              "text-[#8a3ffc] border-b-2 border-[#8a3ffc]" : 
              "text-gray-600 hover:text-[#8a3ffc]"}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab("jobs")}
            className={`px-6 py-3 text-sm font-medium ${activeTab === "jobs" ? 
              "text-[#8a3ffc] border-b-2 border-[#8a3ffc]" : 
              "text-gray-600 hover:text-[#8a3ffc]"}`}
          >
            Job Postings
          </button>
          <button 
            onClick={() => setActiveTab("candidates")}
            className={`px-6 py-3 text-sm font-medium ${activeTab === "candidates" ? 
              "text-[#8a3ffc] border-b-2 border-[#8a3ffc]" : 
              "text-gray-600 hover:text-[#8a3ffc]"}`}
          >
            Talent Pool
          </button>
          <button 
            onClick={() => setActiveTab("interviews")}
            className={`px-6 py-3 text-sm font-medium ${activeTab === "interviews" ? 
              "text-[#8a3ffc] border-b-2 border-[#8a3ffc]" : 
              "text-gray-600 hover:text-[#8a3ffc]"}`}
          >
            Interviews
          </button>
        </div>
        
        {/* Content for Overview tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Feed Section */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-2 space-y-6">
                {/* Create Post */}
                <CreatePost 
                  className="transform transition-all hover:shadow-md" 
                  initialContent={content}
                  onContentChange={setContent}
                />
                
                {/* Posts Feed */}
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
              </div>
              
              {/* Right Sidebar - Profile Stats */}
              <div className="space-y-6">
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <span className="h-5 w-5 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-[#8a3ffc]">
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
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
                
                {/* Active Job Metrics */}
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <span className="h-5 w-5 bg-purple-100 rounded-full flex items-center justify-center">
                        <Briefcase className="h-3 w-3 text-[#8a3ffc]" />
                      </span>
                      Active Job Metrics
                    </h3>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <p className="text-gray-600">Active Jobs</p>
                        <p className="font-semibold">{stats?.activeJobs || 0}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-gray-600">Total Applicants</p>
                        <p className="font-semibold">{stats?.totalApplicants || 0}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-gray-600">Shortlisted</p>
                        <p className="font-semibold">{stats?.shortlistedCandidates || 0}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-gray-600">Interviews Scheduled</p>
                        <p className="font-semibold">{stats?.interviewsScheduled || 0}</p>
                      </div>
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <p className="text-gray-600">View Rate</p>
                          <p className="font-semibold">{stats?.viewRate || 0}%</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-gray-600">Application Rate</p>
                          <p className="font-semibold">{stats?.applicantRate || 0}%</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
        
        {/* Content for Jobs tab */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Job Postings</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    type="text" 
                    placeholder="Search job postings..." 
                    className="pl-9 py-2 bg-white border border-gray-200 rounded-md text-sm" 
                  />
                </div>
                <Button 
                  className="bg-[#8a3ffc] hover:bg-[#7a2ff2] rounded-md px-4"
                  onClick={() => navigate("/create-job-posting")}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              </div>
            </div>
            
            {jobsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {jobs?.map((job) => (
                  <Card key={job.id} className="border bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="p-6 grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4">
                          <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.company}</p>
                          <p className="text-sm text-gray-600">{job.location}</p>
                          <p className="text-xs text-gray-500 mt-1">Posted: {new Date(job.postedDate).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="col-span-1 flex justify-center">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 px-2 py-1">
                            Active
                          </Badge>
                        </div>
                        
                        <div className="col-span-5 grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <p className="text-xl font-bold">{job.views}</p>
                            <p className="text-xs text-gray-500">Views</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold">{job.applicantCount}</p>
                            <p className="text-xs text-gray-500">Applicants</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold">{job.shortlistedCount}</p>
                            <p className="text-xs text-gray-500">Shortlisted</p>
                          </div>
                        </div>
                        
                        <div className="col-span-2 flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="text-gray-600 border-gray-300">View</Button>
                          <Button variant="outline" size="sm" className="text-gray-600 border-gray-300">Edit</Button>
                          <Button variant="ghost" size="sm" className="text-gray-600">Pause</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Content for Candidates tab */}
        {activeTab === "candidates" && (
          <div className="space-y-6">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Talent Pool</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    type="text" 
                    placeholder="Search candidates..." 
                    className="pl-9 py-2 bg-white border border-gray-200 rounded-md text-sm" 
                  />
                </div>
                <Button variant="outline" className="border-gray-300 text-gray-700">
                  Filter
                </Button>
              </div>
            </div>
            
            {candidatesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {topCandidates?.map((candidate) => (
                  <Card key={candidate.id} className="border bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="p-6 grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5 flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                              <AvatarImage src={candidate.profileImageUrl} alt={candidate.name} />
                              <AvatarFallback>{candidate.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            {candidate.hasVideo && (
                              <span className="absolute -top-1 -right-1 bg-[#8a3ffc] text-white text-[8px] p-1 rounded-full">
                                CV
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{candidate.name}</h3>
                            <p className="text-sm text-gray-600">{candidate.title}</p>
                            {candidate.hasVideo && (
                              <p className="text-xs text-[#8a3ffc] font-medium mt-1 flex items-center gap-1">
                                <FileStack className="h-3 w-3" />
                                Video CV Available
                              </p>
                            )}
                            {candidate.matchScore >= 85 && (
                              <p className="text-xs text-yellow-600 font-medium mt-1 flex items-center gap-1">
                                <Trophy className="h-3 w-3" />
                                Top Candidate
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="col-span-5 flex flex-wrap gap-1">
                          {candidate.skills.map((skill, index) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-md">
                              {skill}
                            </span>
                          ))}
                        </div>
                        
                        <div className="col-span-2 text-center">
                          <div className="text-center mb-2">
                            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-purple-50 mb-1">
                              <p className="text-lg font-bold text-[#8a3ffc]">{candidate.matchScore}%</p>
                            </div>
                            <p className="text-xs text-gray-500">Match Score</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="text-[#8a3ffc] border-[#8a3ffc] hover:bg-purple-50">
                              View CV
                            </Button>
                            <Button size="sm" className="bg-[#8a3ffc] hover:bg-[#7a2ff2]">
                              Contact
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Content for Interviews tab */}
        {activeTab === "interviews" && (
          <div className="space-y-6">
            <Card className="border shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Interviews</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upcoming interviews */}
                  <div className="lg:border-r lg:pr-6">
                    <h3 className="text-lg font-medium mb-4">Today & Tomorrow</h3>
                    {interviewsLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {interviews?.map((interview) => (
                          <div key={interview.id} className="flex items-start p-4 rounded-lg border border-gray-100 bg-white shadow-sm">
                            <Avatar className="h-12 w-12 mr-3">
                              <AvatarImage src={interview.profileImageUrl} alt={interview.candidateName} />
                              <AvatarFallback>{interview.candidateName.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-medium">{interview.candidateName}</h4>
                              <p className="text-sm text-gray-600">{interview.jobTitle}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <p className="text-xs flex items-center text-gray-500">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(interview.date).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric'
                                  })}
                                </p>
                                <p className="text-xs flex items-center text-gray-500">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(interview.date).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit'
                                  })}
                                </p>
                                <Badge variant="outline" className="text-xs py-0">
                                  {interview.type}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="ml-2" onClick={() => navigate(`/interviews/${interview.id}`)}>
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Past interviews */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Past Interviews</h3>
                    <div className="text-center py-6 text-gray-500 border rounded-lg">
                      No past interviews to show
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
      </div>
    </Layout>
  );
}