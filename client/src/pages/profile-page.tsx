import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Post, Job } from "@shared/schema";
import DigitalCvCard from "@/components/digital-cv-card";
import PostCard from "@/components/post-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Pencil, Plus, X, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<Partial<User>>({
    name: user?.name || "",
    title: user?.title || "",
    bio: user?.bio || "",
    skills: user?.skills || [],
  });
  const [newSkill, setNewSkill] = useState("");

  // Fetch user's posts
  const { data: posts, isLoading: loadingPosts } = useQuery<Post[]>({
    queryKey: [`/api/users/${user?.id}/posts`],
    enabled: !!user,
  });

  // Fetch user's job applications (for job seeker)
  const { data: applications, isLoading: loadingApplications } = useQuery<any[]>({
    queryKey: ["/api/applications"],
    enabled: !!user && !user.isRecruiter,
  });

  // Fetch job postings (for recruiter)
  const { data: jobPostings, isLoading: loadingJobPostings } = useQuery<Job[]>({
    queryKey: [`/api/users/${user?.id}/jobs`],
    enabled: !!user && !!user.isRecruiter,
  });

  // Update user profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    if (!user) return;
    updateProfileMutation.mutate(profileData);
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    
    const updatedSkills = [...(profileData.skills || []), newSkill];
    setProfileData({ ...profileData, skills: updatedSkills });
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = (profileData.skills || []).filter(skill => skill !== skillToRemove);
    setProfileData({ ...profileData, skills: updatedSkills });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center">
                <Avatar className="w-24 h-24 md:w-32 md:h-32">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.name} />
                  <AvatarFallback className="text-2xl bg-[#EFE9FF] text-[#8B4DFF]">
                    {user?.name?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
              
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <Input
                        id="title"
                        value={profileData.title}
                        onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                        placeholder="Your professional title"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        placeholder="Tell us about yourself"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Skills
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {profileData.skills?.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {skill}
                            <button onClick={() => handleRemoveSkill(skill)}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Add a skill"
                          className="mr-2"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSkill();
                            }
                          }}
                        />
                        <Button type="button" onClick={handleAddSkill}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900">{user?.name || user?.username}</h1>
                    <p className="text-gray-600">{user?.title || (user?.isRecruiter ? "Recruiter" : "Professional")}</p>
                    {user?.bio && (
                      <p className="mt-4 text-gray-700">
                        {user.bio}
                      </p>
                    )}
                    {user?.skills && user.skills.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {user.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
                <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="posts" className="mt-6">
                {loadingPosts ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="space-y-6">
                    {posts && posts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        author={user as User}
                        likes={0}
                        comments={[]}
                        isLiked={false}
                      />
                    ))}
                    {(!posts || posts.length === 0) && (
                      <>
                        <Card className="bg-white shadow-sm overflow-hidden">
                          <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.name} />
                                <AvatarFallback className="bg-[#EFE9FF] text-[#8B4DFF]">
                                  {user?.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="mb-2">
                                  <h4 className="font-medium text-gray-900">{user?.name}</h4>
                                  <p className="text-gray-500 text-sm">{user?.title}</p>
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
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.name} />
                                <AvatarFallback className="bg-[#EFE9FF] text-[#8B4DFF]">
                                  {user?.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="mb-2">
                                  <h4 className="font-medium text-gray-900">{user?.name}</h4>
                                  <p className="text-gray-500 text-sm">{user?.title}</p>
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
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="activity" className="mt-6">
                <div className="space-y-4">
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
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <DigitalCvCard />
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Profile Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary-600 h-2.5 rounded-full" 
                    style={{ 
                      width: `${calculateProfileCompletion(user)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Your profile is {calculateProfileCompletion(user)}% complete
                </p>
                
                {user && (
                  <div className="mt-4 space-y-2">
                    {!user.name && (
                      <div className="flex items-center text-sm text-gray-600">
                        <X className="h-4 w-4 text-red-500 mr-2" />
                        Add your full name
                      </div>
                    )}
                    {!user.title && (
                      <div className="flex items-center text-sm text-gray-600">
                        <X className="h-4 w-4 text-red-500 mr-2" />
                        Add your job title
                      </div>
                    )}
                    {!user.bio && (
                      <div className="flex items-center text-sm text-gray-600">
                        <X className="h-4 w-4 text-red-500 mr-2" />
                        Add a bio
                      </div>
                    )}
                    {(!user.skills || user.skills.length === 0) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <X className="h-4 w-4 text-red-500 mr-2" />
                        Add your skills
                      </div>
                    )}
                    {!user.digitalCvUrl && (
                      <div className="flex items-center text-sm text-gray-600">
                        <X className="h-4 w-4 text-red-500 mr-2" />
                        Upload your Digital CV
                      </div>
                    )}
                    {user.name && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Full name added
                      </div>
                    )}
                    {user.title && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Job title added
                      </div>
                    )}
                    {user.bio && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Bio added
                      </div>
                    )}
                    {user.skills && user.skills.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Skills added
                      </div>
                    )}
                    {user.digitalCvUrl && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Digital CV uploaded
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(user: User | null): number {
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
