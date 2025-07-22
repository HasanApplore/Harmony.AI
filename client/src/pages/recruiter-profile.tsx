import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Video, ThumbsUp, MessageSquare, Share2, Plus, X, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function RecruiterProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState("posts");
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    title: user?.title || "",
    bio: user?.bio || "",
    company: user?.company || "",
    industry: user?.industry || "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(
    user?.skills && typeof user.skills === 'string' 
      ? JSON.parse(user.skills) 
      : Array.isArray(user?.skills) ? user.skills : []
  );
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch user's posts
  const { data: posts = [], isLoading: isPostsLoading } = useQuery<any[]>({
    queryKey: ["/api/users", user?.id, "posts"],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch(`/api/users/${user?.id}/posts`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      return res.json();
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: "PATCH",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle skill addition
  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  // Handle skill removal
  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  // Handle profile update
  const handleProfileUpdate = () => {
    if (!user) return;
    
    const formData = new FormData();
    formData.append("name", profileData.name);
    formData.append("title", profileData.title);
    formData.append("bio", profileData.bio || "");
    formData.append("company", profileData.company || "");
    formData.append("industry", profileData.industry || "");
    if (skills && skills.length > 0) {
      formData.append("skills", JSON.stringify(skills));
    }
    
    if (profileImageFile) {
      formData.append("profileImage", profileImageFile);
    }
    
    updateProfileMutation.mutate(formData);
  };

  // Handle profile image selection
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  };

  return (
    <Layout>
      <div className="p-4 pb-16 max-w-7xl mx-auto">
        {isEditing ? (
          // Edit profile form
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
            
            {/* Profile Image Upload */}
            <div className="flex items-center mb-6">
              <div className="mr-6 relative">
                {previewUrl || user?.profileImageUrl ? (
                  <Avatar className="h-32 w-32">
                    <AvatarImage 
                      src={previewUrl || user?.profileImageUrl || undefined} 
                      alt={profileData.name} 
                    />
                    <AvatarFallback className="text-2xl bg-[#EFE9FF] text-[#8B4DFF]">
                      {getInitials(profileData.name)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-32 w-32 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center text-2xl font-bold">
                    {getInitials(profileData.name)}
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleProfileImageChange}
                />
              </div>
              <div>
                <h3 className="font-medium mb-1">Profile Picture</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Upload a professional photo to help people recognize you
                </p>
                <p className="text-xs text-gray-500">
                  Recommended: Square image, 300×300 pixels or larger
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input 
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  placeholder="Your name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Job Title</label>
                <Input 
                  name="title"
                  value={profileData.title}
                  onChange={handleInputChange}
                  placeholder="Recruiter"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Company</label>
                <Input 
                  name="company"
                  value={profileData.company}
                  onChange={handleInputChange}
                  placeholder="Your company"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Industry</label>
                <Input 
                  name="industry"
                  value={profileData.industry}
                  onChange={handleInputChange}
                  placeholder="Your industry"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <Textarea 
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself"
                  className="min-h-[100px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Skills</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {skills.map((skill, index) => (
                    <Badge key={index} className="px-3 py-1 flex items-center gap-1 bg-purple-100 text-purple-800 hover:bg-purple-200">
                      {skill}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveSkill(skill)} 
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Add a skill"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                  />
                  <Button
                    type="button"
                    onClick={handleAddSkill}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setProfileData({
                    name: user?.name || "",
                    title: user?.title || "",
                    bio: user?.bio || "",
                    company: user?.company || "",
                    industry: user?.industry || "",
                  });
                  setSkills(user?.skills && typeof user.skills === 'string' 
                    ? JSON.parse(user.skills) 
                    : Array.isArray(user?.skills) ? user.skills : []);
                  setIsEditing(false);
                  setPreviewUrl(null);
                  setProfileImageFile(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleProfileUpdate}
                disabled={updateProfileMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          // Profile view
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
              <div className="flex items-center">
                {user?.profileImageUrl ? (
                  <Avatar className="h-24 w-24 mr-6">
                    <AvatarImage src={user.profileImageUrl} alt={user.name || "User"} />
                    <AvatarFallback className="text-2xl bg-[#EFE9FF] text-[#8B4DFF]">
                      {getInitials(user.name || user.username || "")}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-24 w-24 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center text-2xl font-bold mr-6">
                    {getInitials(user?.name || user?.username || "")}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">{user?.name}</h1>
                  <p className="text-gray-600">{user?.title || "Recruiter"}</p>
                  {user?.company && (
                    <p className="text-gray-600">{user.company}</p>
                  )}
                  {user?.industry && (
                    <p className="text-gray-600 text-sm">{user.industry}</p>
                  )}
                </div>
              </div>
              <Button 
                onClick={() => setIsEditing(true)}
                className="bg-purple-600 hover:bg-purple-700 mt-4 md:mt-0"
              >
                Edit Profile
              </Button>
            </div>
            
            {user?.bio && (
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-2">About</h2>
                <p className="text-gray-600">{user.bio}</p>
              </div>
            )}
            
            {skills.length > 0 && (
              <div>
                <h2 className="text-lg font-medium mb-2">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <Badge key={index} className="px-3 py-1 bg-purple-100 text-purple-800">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Digital CV section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Video className="h-5 w-5 text-purple-600 mr-2" />
              <h2 className="text-lg font-medium">Your Digital CV</h2>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Create Digital CV
            </Button>
          </div>
          
          <Alert className="bg-purple-50 border-purple-100">
            <AlertDescription>
              Stand out with video! Create your Digital CV to get 4x more profile views and better job matches.
            </AlertDescription>
          </Alert>
        </div>
        
        {/* Posts and Activity tabs */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b mb-6">
            <TabsList className="bg-transparent gap-2">
              <TabsTrigger 
                value="posts" 
                className="rounded-full bg-purple-600 text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Posts
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                className="rounded-full bg-transparent text-gray-700 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Activity
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="posts">
            {posts && Array.isArray(posts) && posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post: any) => (
                  <div key={post.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center mb-4">
                      {user?.profileImageUrl ? (
                        <Avatar className="h-12 w-12 mr-3">
                          <AvatarImage src={user.profileImageUrl} alt={user.name || "User"} />
                          <AvatarFallback>
                            {getInitials(user.name || user.username || "")}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-12 w-12 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center font-bold mr-3">
                          {getInitials(user?.name || user?.username || "")}
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium">{user?.name}</h3>
                        <p className="text-sm text-gray-500">
                          {user?.title || "Recruiter"} {post.createdAt ? `• ${format(new Date(post.createdAt), "MMM d, yyyy")}` : ''}
                        </p>
                      </div>
                    </div>
                    
                    <p className="mb-4">{post.content}</p>
                    
                    {post.imageUrl && (
                      <img 
                        src={post.imageUrl} 
                        alt="Post" 
                        className="w-full rounded-lg mb-4" 
                      />
                    )}
                    
                    <div className="flex justify-between border-t pt-4">
                      <Button variant="ghost" className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        Like
                      </Button>
                      <Button variant="ghost" className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        Comment
                      </Button>
                      <Button variant="ghost" className="flex items-center gap-1">
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <div className="bg-gray-50 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-1">No posts yet</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Share updates, insights, and job postings with your professional network.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="activity">
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="bg-gray-50 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-1">No recent activity</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Your connections will see your likes, comments, and other interactions here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}