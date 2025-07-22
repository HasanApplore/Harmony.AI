import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Pencil, Plus, X, CheckCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function ProfileEditPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    title: user?.title || "",
    bio: user?.bio || "",
    mobileNumber: user?.mobileNumber || "",
    company: user?.company || "",
    industry: user?.industry || "",
    skills: user?.skills ? [...user.skills] : [],
    newSkill: "",
    isEditingSkills: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setLocation("/profile");
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Filter out UI-only fields before submitting
    const { newSkill, isEditingSkills, ...dataToSubmit } = profileData;
    
    updateProfileMutation.mutate(dataToSubmit);
  }

  function calculateProfileCompletion(): number {
    const fields = [
      profileData.name,
      profileData.email,
      profileData.title,
      profileData.bio,
      profileData.mobileNumber,
      profileData.company,
      profileData.industry,
    ];
    
    const filledFields = fields.filter(field => field && field.trim() !== "").length;
    const totalFields = fields.length;
    
    const hasSkills = profileData.skills && profileData.skills.length > 0;
    
    // Weight basic fields as 80% and skills as 20% of profile completeness
    const fieldScore = (filledFields / totalFields) * 0.8;
    const skillsScore = hasSkills ? 0.2 : 0;
    
    return Math.round((fieldScore + skillsScore) * 100);
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white"
              onClick={() => setLocation("/profile")}
            >
              <ArrowLeft className="h-4 w-4" /> Back to Profile
            </Button>
          </div>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <div className="w-[150px]"></div> {/* Empty div for layout balance */}
        </div>
        
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-4 rounded-lg mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-primary-800">Profile Completion</h2>
            <p className="text-sm text-primary-700">Complete your profile to maximize visibility to recruiters.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white border-4 border-primary-200">
              <span className="text-xl font-bold text-primary-700">{calculateProfileCompletion()}%</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 mb-8">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center">
                    <Avatar className="w-24 h-24 md:w-32 md:h-32">
                      <AvatarImage src={user?.profileImageUrl || ""} alt={user?.name || ""} />
                      <AvatarFallback className="text-2xl bg-[#EFE9FF] text-[#8B4DFF]">
                        {user?.name?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="mt-4 text-sm text-gray-500">
                      Profile photo update coming soon
                    </div>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input 
                        name="name" 
                        value={profileData.name} 
                        onChange={handleInputChange} 
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input 
                        name="email" 
                        value={profileData.email} 
                        onChange={handleInputChange} 
                        placeholder="Your email address"
                        type="email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Professional Title</label>
                      <Input 
                        name="title" 
                        value={profileData.title} 
                        onChange={handleInputChange} 
                        placeholder="e.g. Senior Software Engineer"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mobile Number</label>
                      <Input 
                        name="mobileNumber" 
                        value={profileData.mobileNumber || ""} 
                        onChange={handleInputChange} 
                        placeholder="Your contact number"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-2">
                  <label className="text-sm font-medium">Professional Bio</label>
                  <Textarea 
                    name="bio" 
                    value={profileData.bio || ""} 
                    onChange={handleInputChange} 
                    placeholder="Write a brief professional summary" 
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company</label>
                    <Input 
                      name="company" 
                      value={profileData.company || ""} 
                      onChange={handleInputChange} 
                      placeholder="Your current company"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Industry</label>
                    <Input 
                      name="industry" 
                      value={profileData.industry || ""} 
                      onChange={handleInputChange} 
                      placeholder="e.g. Information Technology"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Skills</CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setProfileData((prev) => ({ ...prev, isEditingSkills: !prev.isEditingSkills }))}
                >
                  {profileData.isEditingSkills ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Done
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Pencil className="h-4 w-4" /> Edit
                    </span>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {profileData.skills && profileData.skills.length > 0 ? (
                    profileData.skills.map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                        {skill}
                        {profileData.isEditingSkills && (
                          <button
                            type="button"
                            className="ml-2 text-gray-500 hover:text-red-500"
                            onClick={() => {
                              const updatedSkills = [...profileData.skills];
                              updatedSkills.splice(index, 1);
                              setProfileData((prev) => ({ ...prev, skills: updatedSkills }));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No skills added yet. Add some skills to showcase your expertise.</p>
                  )}
                </div>
                
                {profileData.isEditingSkills && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill"
                      value={profileData.newSkill}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, newSkill: e.target.value }))}
                      className="max-w-md"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (profileData.newSkill.trim()) {
                          setProfileData((prev) => ({
                            ...prev,
                            skills: [...(prev.skills || []), prev.newSkill.trim()],
                            newSkill: "",
                          }));
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="flex justify-between gap-2">
              <Button 
                type="button" 
                variant="default" 
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white" 
                onClick={() => setLocation("/profile")}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Profile
              </Button>
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}