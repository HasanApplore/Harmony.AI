import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Layout from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Edit, 
  Play, 
  X, 
  Heart, 
  MessageSquare, 
  Share2, 
  Briefcase, 
  Building,
  Calendar,
  ThumbsUp,
  MessageCircle,
  Users
} from "lucide-react";

export default function ProfileView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const [, navigate] = useLocation();

  // Fetch user posts
  const { data: posts = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${user?.id}/posts`],
    enabled: !!user,
  });

  // Sample posts for demonstration
  const samplePosts = [
    {
      id: 1,
      content: "Just completed a fascinating project on data visualization for a major retail client. The insights we uncovered using Power BI were game-changing! #DataAnalytics #BusinessIntelligence",
      createdAt: "2023-07-15T10:30:00Z",
      likes: 24,
      comments: 7
    },
    {
      id: 2,
      content: "Excited to share that I've earned my Advanced Business Analytics certification! Looking forward to applying these new skills in upcoming projects. #ProfessionalDevelopment #Certification",
      createdAt: "2023-08-05T14:20:00Z",
      likes: 42,
      comments: 13
    }
  ];

  // Sample activities for demonstration
  const sampleActivities = [
    {
      id: 1,
      type: "connection",
      description: "Connected with Priya Sharma",
      date: "2023-08-10T09:15:00Z",
      icon: Users
    },
    {
      id: 2,
      type: "job-application",
      description: "Applied for Senior Business Analyst position at TechSolutions India",
      date: "2023-08-07T16:45:00Z",
      icon: Briefcase
    },
    {
      id: 3,
      type: "community",
      description: "Joined Data Analytics Professionals community",
      date: "2023-08-01T11:30:00Z", 
      icon: Users
    },
    {
      id: 4,
      type: "like",
      description: "Liked a post by Ananya Singh",
      date: "2023-07-28T13:20:00Z",
      icon: ThumbsUp
    },
    {
      id: 5,
      type: "comment",
      description: "Commented on a post by Rajesh Kumar",
      date: "2023-07-25T10:10:00Z",
      icon: MessageCircle
    }
  ];

  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
              <div className="bg-white rounded-full p-1 shadow-md border border-purple-200">
                <Avatar className="w-28 h-28">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.name} />
                  <AvatarFallback className="text-2xl bg-[#EFE9FF] text-[#8B4DFF]">
                    {user?.name?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user?.name}</h1>
                <p className="text-gray-600">{user?.title}</p>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4 bg-white border-gray-200"
                  onClick={() => navigate("/profile/edit")}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>

            {/* Profile Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="w-auto inline-flex mb-4">
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="posts" className="space-y-6">
                {posts.length === 0 ? (
                  <>
                    {/* Sample posts */}
                    {samplePosts.map(post => (
                      <Card key={post.id} className="border border-purple-100 shadow-sm">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user?.profileImageUrl} alt={user?.name} />
                              <AvatarFallback className="text-sm bg-[#EFE9FF] text-[#8B4DFF]">
                                {user?.name?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold">{user?.name}</div>
                              <div className="text-xs text-gray-500">{formatDate(post.createdAt)}</div>
                            </div>
                          </div>
                          
                          <p className="text-gray-800 mb-4">{post.content}</p>
                          
                          <div className="flex justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-5">
                              <button className="flex items-center gap-1 hover:text-purple-600">
                                <Heart className="h-4 w-4" />
                                <span>{post.likes}</span>
                              </button>
                              <button className="flex items-center gap-1 hover:text-purple-600">
                                <MessageSquare className="h-4 w-4" />
                                <span>{post.comments}</span>
                              </button>
                            </div>
                            <button className="flex items-center gap-1 hover:text-purple-600">
                              <Share2 className="h-4 w-4" />
                              <span>Share</span>
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  posts.map(post => (
                    <Card key={post.id} className="border border-purple-100 shadow-sm">
                      <CardContent className="p-5">
                        <p>{post.content}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="activity" className="space-y-4">
                {sampleActivities.map(activity => (
                  <Card key={activity.id} className="border border-purple-100 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <activity.icon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800">{activity.description}</p>
                          <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Column */}
          <div className="w-full md:w-80 space-y-6">
            {/* Digital CV Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-purple-200">
              <div className="flex justify-between items-center p-3 bg-purple-600">
                <h3 className="text-lg font-semibold text-white">Your Digital CV</h3>
                <Button 
                  size="sm" 
                  className="bg-white text-purple-700 hover:bg-gray-100"
                  onClick={() => navigate("/profile/edit")}
                >
                  Update
                </Button>
              </div>
              <div className="aspect-video bg-purple-100 relative">
                {/* Digital CV preview */}
                <div className="w-full h-full flex items-center justify-center">
                  <button 
                    className="w-16 h-16 rounded-full bg-purple-700 flex items-center justify-center text-white shadow-lg hover:bg-purple-800"
                    onClick={() => {
                      if (user?.digitalCvUrl) {
                        window.open(user.digitalCvUrl, '_blank');
                      } else {
                        navigate("/profile/edit");
                      }
                    }}
                  >
                    <Play className="h-8 w-8" />
                  </button>
                </div>
                {/* Protection notice */}
                <div className="absolute bottom-2 left-2 right-2 text-xs flex items-center justify-center">
                  <div className="bg-white/80 px-2 py-1 rounded-full text-purple-800 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1.5 text-purple-600" />
                    <span>Protected against unauthorized downloads</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profile Completion Card */}
            <div className="bg-white rounded-lg shadow-md p-5 border border-purple-200">
              <h3 className="font-semibold mb-3">Profile Completion</h3>
              <Progress value={60} className="h-2 mb-3 bg-purple-100" />
              <p className="text-sm text-gray-600 mb-4">Your profile is 60% complete</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-gray-700">Add a bio</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-gray-700">Add your skills</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700">Full name added</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700">Job title added</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700">Digital CV uploaded</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}