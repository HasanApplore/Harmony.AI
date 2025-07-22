import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useParams } from "wouter";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Post } from "@shared/schema";
import PostCard from "@/components/post-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, UserPlus, CheckCircle, BriefcaseIcon, GraduationCap, Calendar, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export default function UserProfilePage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const [, setLocation] = useLocation();
  const userId = params.id;
  const [activeTab, setActiveTab] = useState("posts");

  // Redirect if no user ID
  useEffect(() => {
    if (!userId) {
      setLocation('/my-network');
    }
  }, [userId, setLocation]);

  // Fetch user data
  const { data: profileUser, isLoading: loadingUser } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Fetch user's posts with full data needed for post card
  const { data: posts, isLoading: loadingPosts } = useQuery<Post[]>({
    queryKey: [`/api/users/${userId}/posts`],
    enabled: !!userId,
  });
  
  // Fetch all users (for author data)
  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!userId,
  });

  // Check if we have a connection with this user
  const { data: connections, isLoading: loadingConnections } = useQuery<{connection: any, user: User}[]>({
    queryKey: ["/api/connections"],
    enabled: !!currentUser,
  });

  const isConnected = connections?.some(conn => 
    conn.user.id === parseInt(userId || '0')
  );

  // Send message to user
  const handleSendMessage = () => {
    if (userId) {
      setLocation(`/messages?userId=${userId}`);
    }
  };

  // Calculate profile completion
  function calculateProfileCompletion(user: User | undefined): number {
    if (!user) return 0;
    
    const totalItems = 5; // Name, title, bio, skills, digital CV
    let completedItems = 0;
    
    if (user.name) completedItems += 1;
    if (user.title) completedItems += 1;
    if (user.bio) completedItems += 1;
    if (user.skills && user.skills.length > 0) completedItems += 1;
    if (user.digitalCvUrl) completedItems += 1;
    
    return Math.round((completedItems / totalItems) * 100);
  }

  if (loadingUser) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-4">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <Skeleton className="w-32 h-32 rounded-full" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-48 mb-4" />
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-32 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profileUser) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-4">
          <Card className="p-8 text-center">
            <CardTitle className="mb-4">User Not Found</CardTitle>
            <p className="mb-6 text-gray-500">The user you're looking for doesn't exist or you may not have permission to view this profile.</p>
            <Button onClick={() => setLocation('/my-network')}>
              Back to Network
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center">
                <Avatar className="w-24 h-24 md:w-32 md:h-32">
                  <AvatarImage src={profileUser?.profileImageUrl || undefined} alt={profileUser?.name} />
                  <AvatarFallback className="text-2xl bg-[#EFE9FF] text-[#8B4DFF]">
                    {profileUser?.name?.substring(0, 2).toUpperCase() || profileUser?.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-4 flex flex-col gap-2">
                  {isConnected ? (
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : currentUser?.id !== parseInt(userId || '0') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-full"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  )}
                  
                  {currentUser?.id !== parseInt(userId || '0') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-full"
                      onClick={handleSendMessage}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="mb-2">
                  <h1 className="text-2xl font-bold">{profileUser.name || profileUser.username}</h1>
                  <p className="text-gray-600">{profileUser.title || 'Professional'}</p>
                  
                  {profileUser.company && (
                    <div className="flex items-center mt-2 text-gray-600">
                      <BriefcaseIcon className="h-4 w-4 mr-2" />
                      <span>{profileUser.company}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  {profileUser.bio ? (
                    <p className="text-gray-700 mb-4">{profileUser.bio}</p>
                  ) : (
                    <p className="text-gray-500 italic mb-4">No bio available</p>
                  )}
                </div>
                
                {profileUser.skills && profileUser.skills.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-1">
                      {profileUser.skills.map((skill, index) => (
                        <Badge key={index} className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-full bg-white border-4 border-purple-200 flex items-center justify-center">
                      <span className="text-xl font-bold text-purple-700">{calculateProfileCompletion(profileUser)}%</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-purple-800">Profile Strength</h3>
                      <p className="text-sm text-purple-700">
                        {calculateProfileCompletion(profileUser) < 50 
                          ? 'Basic profile' 
                          : calculateProfileCompletion(profileUser) < 80 
                            ? 'Intermediate profile' 
                            : 'Strong profile'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Content Tabs - Matching the format from the screenshot */}
        <div className="mb-8">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 mb-6">
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger 
                  value="posts" 
                  className="px-6 py-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-gray-800 text-gray-600 border-b-2 border-transparent data-[state=active]:border-purple-600 font-medium transition-colors"
                >
                  Posts
                </TabsTrigger>
                <TabsTrigger 
                  value="activity" 
                  className="px-6 py-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-gray-800 text-gray-600 border-b-2 border-transparent data-[state=active]:border-transparent font-medium transition-colors"
                >
                  Activity
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="posts" className="space-y-4">
              {profileUser.id === currentUser?.id ? (
                <>
                  <Card className="bg-white shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <img src={profileUser.profileImageUrl || ''} alt={profileUser.name} className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                          <div className="mb-2">
                            <h4 className="font-medium text-gray-900">{profileUser.name}</h4>
                            <p className="text-gray-500 text-sm">{profileUser.title}</p>
                            <p className="text-gray-500 text-xs">Posted 2 days ago</p>
                          </div>
                          <p className="text-gray-700 mb-4">
                            Just completed an analysis of market trends in the analytics sector. Fascinating to see how AI is transforming traditional business intelligence roles. Anyone else seeing this shift in their organization? #BusinessAnalytics #AI #MarketTrends
                          </p>
                          <div className="flex items-center justify-between border-t pt-3 mt-2">
                            <div className="flex items-center space-x-4">
                              <Button variant="ghost" size="sm" className="text-gray-600 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                                Like
                              </Button>
                              <Button variant="ghost" size="sm" className="text-gray-600 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                                Comment
                              </Button>
                              <Button variant="ghost" size="sm" className="text-gray-600 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                Share
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <img src={profileUser.profileImageUrl || ''} alt={profileUser.name} className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                          <div className="mb-2">
                            <h4 className="font-medium text-gray-900">{profileUser.name}</h4>
                            <p className="text-gray-500 text-sm">{profileUser.title}</p>
                            <p className="text-gray-500 text-xs">Posted 1 week ago</p>
                          </div>
                          <p className="text-gray-700 mb-4">
                            Excited to share that I've just completed my certification in Advanced Data Analytics! Looking forward to applying these new skills in my next project. #ProfessionalDevelopment #DataAnalytics #Certification
                          </p>
                          <div className="flex items-center justify-between border-t pt-3 mt-2">
                            <div className="flex items-center space-x-4">
                              <Button variant="ghost" size="sm" className="text-gray-600 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                                Like
                              </Button>
                              <Button variant="ghost" size="sm" className="text-gray-600 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                                Comment
                              </Button>
                              <Button variant="ghost" size="sm" className="text-gray-600 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                Share
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="border-none shadow-none">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-medium text-gray-700 mb-2">No posts yet</h3>
                    <p className="text-gray-500">This user hasn't shared any posts yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            

            
            <TabsContent value="activity" className="space-y-4">
              {profileUser.id === currentUser?.id ? (
                <>
                  <Card className="bg-white shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-700">
                            <span className="font-medium">You</span> earned the <span className="font-medium">Data Proficiency</span> skill badge
                          </p>
                          <p className="text-gray-500 text-sm mt-1">3 days ago</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600"><path d="M2 6h16"/><path d="M16 6h4v4"/><path d="M8 2v4"/><path d="M18 12v6"/><path d="M22 18h-4"/><path d="M8 18H2"/><path d="M4 12v4"/></svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-700">
                            <span className="font-medium">You</span> connected with <span className="font-medium">Arjun Patel</span>
                          </p>
                          <p className="text-gray-500 text-sm mt-1">1 week ago</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600"><path d="M21.5 12H16c-.7 2-2 3-4 3s-3.3-1-4-3H2.5"/><path d="M5.5 5.1l.7 1.4c.4.8 1.9 1.5 3.8 1.5s3.4-.7 3.8-1.5l.7-1.4"/><path d="M18.5 5.1l.7 1.4c.4.8 1.9 1.5 3.8 1.5"/><path d="M5.5 18.9l.7-1.4c.4-.8 1.9-1.5 3.8-1.5s3.4.7 3.8 1.5l.7 1.4"/><path d="M18.5 18.9l.7-1.4c.4-.8 1.9-1.5 3.8-1.5"/></svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-700">
                            <span className="font-medium">You</span> joined the <span className="font-medium">Data Analytics Professionals</span> community
                          </p>
                          <p className="text-gray-500 text-sm mt-1">2 weeks ago</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="border-none shadow-none">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-medium text-gray-700 mb-2">No recent activity</h3>
                    <p className="text-gray-500">Recent professional activity will appear here.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
            
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {/* Digital CV card if it exists */}
            {profileUser.digitalCvUrl && (
              <Card className="bg-white mb-6">
                <CardContent className="p-0">
                  <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-white mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m15 10 4.55-4.55c.3-.3.8-.3 1.1 0s.3.8 0 1.1L16.1 11l4.55 4.55c.3.3.3.8 0 1.1s-.8.3-1.1 0L15 12l-4.55 4.55c-.3.3-.8.3-1.1 0s-.3-.8 0-1.1L13.9 11 9.35 6.45c-.3-.3-.3-.8 0-1.1s.8-.3 1.1 0L15 10z"/>
                          <path d="M2 3h6l4 4h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
                        </svg>
                      </span>
                      <span className="font-medium">Digital CV</span>
                    </div>
                    {profileUser.id === currentUser?.id && (
                      <Button variant="outline" size="sm" className="text-white border-white hover:bg-purple-700">
                        Update
                      </Button>
                    )}
                  </div>
                  <div className="p-4">
                    <video 
                      controls
                      className="w-full rounded-md h-64 bg-gray-100"
                      preload="metadata"
                    >
                      <source src={profileUser.digitalCvUrl} type="video/mp4" />
                      <source src={profileUser.digitalCvUrl} type="video/webm" />
                      <source src={profileUser.digitalCvUrl} type="video/mov" />
                      Your browser does not support the video tag.
                    </video>
                    <div className="mt-3 text-sm text-gray-600">
                      <p className="font-medium">Professional Video Introduction</p>
                      <p>Click play to watch this digital CV presentation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div>
            {/* Profile Completion Card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-800 mb-3">Profile Completion</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your profile is {calculateProfileCompletion(profileUser)}% complete
                </p>
                
                <div className="space-y-2">
                  {!profileUser.bio && (
                    <div className="flex items-center text-sm text-gray-600">
                      <X className="h-4 w-4 text-red-500 mr-2" />
                      Add a bio
                    </div>
                  )}
                  
                  {(!profileUser.skills || profileUser.skills.length === 0) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <X className="h-4 w-4 text-red-500 mr-2" />
                      Add your skills
                    </div>
                  )}
                  
                  {profileUser.name && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Full name added
                    </div>
                  )}
                  
                  {profileUser.title && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Job title added
                    </div>
                  )}
                  
                  {profileUser.digitalCvUrl && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Digital CV uploaded
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Experience Section */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Experience</CardTitle>
              </CardHeader>
              <CardContent>
                {profileUser.experiences && Array.isArray(profileUser.experiences) && profileUser.experiences.length > 0 ? (
                  <div className="space-y-4">
                    {profileUser.experiences.map((exp: any, index) => (
                      <div key={index} className={`${index > 0 ? 'pt-4 border-t border-gray-100' : ''}`}>
                        <h3 className="font-medium">{exp.title || 'Position'}</h3>
                        <p className="text-sm text-gray-600">{exp.company || 'Company'}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{exp.startDate || '---'} - {exp.endDate || 'Present'}</span>
                        </div>
                        {exp.description && (
                          <p className="text-sm mt-2 text-gray-700">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No experience information available</p>
                )}
              </CardContent>
            </Card>
            
            {/* Education Section */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Education</CardTitle>
              </CardHeader>
              <CardContent>
                {profileUser.education && Array.isArray(profileUser.education) && profileUser.education.length > 0 ? (
                  <div className="space-y-4">
                    {profileUser.education.map((edu: any, index) => (
                      <div key={index} className={`${index > 0 ? 'pt-4 border-t border-gray-100' : ''}`}>
                        <h3 className="font-medium">{edu.institution || 'Institution'}</h3>
                        <p className="text-sm text-gray-600">{edu.degree || 'Degree'}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          <span>{edu.startYear || '---'} - {edu.endYear || 'Present'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No education information available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}