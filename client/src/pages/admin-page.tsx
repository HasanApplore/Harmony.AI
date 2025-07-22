import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Search, UserPlus, Users, Briefcase, MessageSquare, User, BookOpen, Shield } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Layout from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Redirect } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Admin page tabs
type AdminTab = "users" | "posts" | "jobs" | "communities";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  // Check if user is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  // Check if user is logged in and is an admin
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // Temporary check for admin status - in the future we'll add an 'isAdmin' field to the user model
  if (!user.isRecruiter) {
    return <Redirect to="/" />;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage users, content, and platform settings</p>
          </div>
          
          <div className="relative mt-4 sm:mt-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              className="pl-10 w-full sm:w-64 bg-white" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Card className="bg-white shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">Admin Controls</CardTitle>
            <CardDescription>
              Manage all aspects of the Harmony.ai platform
            </CardDescription>
          </CardHeader>
          
          <Tabs 
            defaultValue="users"
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as AdminTab)}
            className="w-full"
          >
            <div className="px-6">
              <TabsList className="grid grid-cols-4 mb-6 bg-purple-100/50">
                <TabsTrigger 
                  value="users" 
                  className="data-[state=active]:bg-[#8a3ffc] data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <Users className="h-4 w-4 mr-2" /> Users
                </TabsTrigger>
                <TabsTrigger 
                  value="posts" 
                  className="data-[state=active]:bg-[#8a3ffc] data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" /> Posts
                </TabsTrigger>
                <TabsTrigger 
                  value="jobs" 
                  className="data-[state=active]:bg-[#8a3ffc] data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <Briefcase className="h-4 w-4 mr-2" /> Jobs
                </TabsTrigger>
                <TabsTrigger 
                  value="communities" 
                  className="data-[state=active]:bg-[#8a3ffc] data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <BookOpen className="h-4 w-4 mr-2" /> Communities
                </TabsTrigger>
              </TabsList>
            </div>
            
            <Separator />
            
            <CardContent className="px-6 pt-6">
              <TabsContent value="users" className="mt-0">
                <UsersTab searchQuery={searchQuery} />
              </TabsContent>
              
              <TabsContent value="posts" className="mt-0">
                <PostsTab searchQuery={searchQuery} />
              </TabsContent>
              
              <TabsContent value="jobs" className="mt-0">
                <JobsTab searchQuery={searchQuery} />
              </TabsContent>
              
              <TabsContent value="communities" className="mt-0">
                <CommunitiesTab searchQuery={searchQuery} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
}

// Users Tab Component
function UsersTab({ searchQuery }: { searchQuery: string }) {
  const { toast } = useToast();
  
  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/users");
        return await res.json();
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    }
  });
  
  // Filter users based on search query
  const filteredUsers = searchQuery 
    ? users.filter((user: any) => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    : users;
  
  // Toggle user admin status
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: number, makeAdmin: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, { isAdmin: makeAdmin });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User updated",
        description: "User admin status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deleted",
        description: "User has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Manage Users</h3>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" /> Add User
        </Button>
      </div>
      
      {filteredUsers.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          {searchQuery ? "No users match your search criteria" : "No users found"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {user.profileImageUrl ? (
                          <img 
                            src={user.profileImageUrl} 
                            alt={user.name || user.username} 
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name || "No name"}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.isRecruiter ? "Recruiter" : "Job Seeker"}
                    </div>
                    <div className="text-sm text-gray-500">{user.title || "No title"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={user.isAdmin ? "default" : "secondary"}>
                      {user.isAdmin ? (
                        <Shield className="h-3 w-3 mr-1" />
                      ) : null}
                      {user.isAdmin ? "Admin" : "Regular user"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleAdminMutation.mutate({
                          userId: user.id,
                          makeAdmin: !user.isAdmin
                        })}
                      >
                        {user.isAdmin ? "Remove Admin" : "Make Admin"}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Posts Tab Component
function PostsTab({ searchQuery }: { searchQuery: string }) {
  const { toast } = useToast();
  
  // Fetch all posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["/api/admin/posts"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/posts");
        return await res.json();
      } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
      }
    }
  });
  
  // Filter posts based on search query
  const filteredPosts = searchQuery 
    ? posts.filter((post: any) => 
        post.content?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    : posts;
  
  // Delete post
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("DELETE", `/api/admin/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      toast({
        title: "Post deleted",
        description: "Post has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Manage Posts</h3>
      </div>
      
      {filteredPosts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          {searchQuery ? "No posts match your search criteria" : "No posts found"}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post: any) => (
            <Card key={post.id} className="overflow-hidden border border-gray-200">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">
                        Post by {post.user?.name || post.user?.username || "Unknown user"} • {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                      <h4 className="text-lg font-semibold mt-1">{post.title || "Untitled post"}</h4>
                      <p className="text-gray-700 mt-2 line-clamp-3">{post.content}</p>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
                          deletePostMutation.mutate(post.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Jobs Tab Component
function JobsTab({ searchQuery }: { searchQuery: string }) {
  const { toast } = useToast();
  
  // Fetch all jobs
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["/api/admin/jobs"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/jobs");
        return await res.json();
      } catch (error) {
        console.error("Error fetching jobs:", error);
        return [];
      }
    }
  });
  
  // Filter jobs based on search query
  const filteredJobs = searchQuery 
    ? jobs.filter((job: any) => 
        job.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        job.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : jobs;
  
  // Delete job
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      await apiRequest("DELETE", `/api/admin/jobs/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
      toast({
        title: "Job deleted",
        description: "Job has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting job",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Manage Jobs</h3>
      </div>
      
      {filteredJobs.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          {searchQuery ? "No jobs match your search criteria" : "No jobs found"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Posted By</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs.map((job: any) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{job.title}</div>
                    <div className="text-sm text-gray-500">{job.company} • {job.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{job.user?.name || job.user?.username || "Unknown"}</div>
                    <div className="text-sm text-gray-500">{new Date(job.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={job.status === "active" ? "default" : "secondary"}>
                      {job.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
                            deleteJobMutation.mutate(job.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Communities Tab Component
function CommunitiesTab({ searchQuery }: { searchQuery: string }) {
  const { toast } = useToast();
  
  // Fetch all communities
  const { data: communities = [], isLoading } = useQuery({
    queryKey: ["/api/admin/communities"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/communities");
        return await res.json();
      } catch (error) {
        console.error("Error fetching communities:", error);
        return [];
      }
    }
  });
  
  // Filter communities based on search query
  const filteredCommunities = searchQuery 
    ? communities.filter((community: any) => 
        community.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        community.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : communities;
  
  // Delete community
  const deleteCommunityMutation = useMutation({
    mutationFn: async (communityId: number) => {
      await apiRequest("DELETE", `/api/admin/communities/${communityId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/communities"] });
      toast({
        title: "Community deleted",
        description: "Community has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting community",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Manage Communities</h3>
      </div>
      
      {filteredCommunities.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          {searchQuery ? "No communities match your search criteria" : "No communities found"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCommunities.map((community: any) => (
            <Card key={community.id} className="overflow-hidden border border-gray-200">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-semibold">{community.name}</h4>
                      <p className="text-gray-500 text-sm mt-1">Created by {community.createdBy?.name || "Unknown"} • {new Date(community.createdAt).toLocaleDateString()}</p>
                      <p className="text-gray-700 mt-2 line-clamp-2">{community.description}</p>
                      <div className="mt-3">
                        <Badge variant="outline">{community.memberCount || 0} members</Badge>
                      </div>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this community? This action cannot be undone.")) {
                          deleteCommunityMutation.mutate(community.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}