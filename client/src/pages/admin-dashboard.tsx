import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
import { Loader2, Search, Users, Briefcase, Building2, User, PlusCircle, Shield, LogOut } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

type AdminTab = "users" | "recruiters" | "jobs" | "communities" | "reports" | "password-resets";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: number, type: string} | null>(null);
  
  // Check for admin session
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/session");
        if (!response.ok) {
          throw new Error("Admin session invalid");
        }
      } catch (error) {
        sessionStorage.removeItem('adminLoggedIn');
        setLocation("/admin-login");
      }
    };
    
    const adminLoginSuccess = sessionStorage.getItem('adminLoggedIn');
    if (!adminLoginSuccess) {
      setLocation("/admin-login");
    } else {
      checkAdminSession();
    }
  }, [setLocation]);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout");
      sessionStorage.removeItem('adminLoggedIn');
      toast({
        title: "Logged out",
        description: "You have been logged out of the admin panel",
      });
      setLocation("/admin-login");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    const { id, type } = itemToDelete;
    
    // Based on type, call appropriate delete endpoint
    const deleteEndpoint = {
      user: `/api/admin/users/${id}`,
      job: `/api/admin/jobs/${id}`,
      community: `/api/admin/communities/${id}`,
      post: `/api/admin/posts/${id}`,
    }[type];
    
    if (!deleteEndpoint) {
      toast({
        title: "Error",
        description: "Invalid delete type",
        variant: "destructive",
      });
      return;
    }
    
    // Execute delete
    apiRequest("DELETE", deleteEndpoint)
      .then(() => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [`/api/admin/${type}s`] });
        
        toast({
          title: "Deleted successfully",
          description: `The ${type} has been deleted`,
        });
      })
      .catch((error) => {
        toast({
          title: "Delete failed",
          description: error.message || "There was an error processing your request",
          variant: "destructive",
        });
      })
      .finally(() => {
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      });
  };

  return (
    <div className="min-h-screen bg-purple-soft">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage users, content, and platform settings</p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                className="pl-10 w-full sm:w-64 bg-white" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
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
              <TabsList className="grid grid-cols-6 mb-6 bg-purple-100/50">
                <TabsTrigger value="users">
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="recruiters">
                  <Shield className="h-4 w-4 mr-2" />
                  Recruiters
                </TabsTrigger>
                <TabsTrigger value="jobs">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Jobs
                </TabsTrigger>
                <TabsTrigger value="communities">
                  <Building2 className="h-4 w-4 mr-2" />
                  Communities
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Reports
                </TabsTrigger>
                <TabsTrigger value="password-resets">
                  <Shield className="h-4 w-4 mr-2" />
                  Password Resets
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="users" className="px-6 pb-6">
              <UsersTab searchQuery={searchQuery} />
            </TabsContent>
            
            <TabsContent value="recruiters" className="px-6 pb-6">
              <RecruitersTab searchQuery={searchQuery} />
            </TabsContent>
            
            <TabsContent value="jobs" className="px-6 pb-6">
              <JobsTab searchQuery={searchQuery} />
            </TabsContent>
            
            <TabsContent value="communities" className="px-6 pb-6">
              <CommunitiesTab searchQuery={searchQuery} />
            </TabsContent>
            
            <TabsContent value="reports" className="px-6 pb-6">
              <ReportsTab />
            </TabsContent>
            
            <TabsContent value="password-resets" className="px-6 pb-6">
              <PasswordResetsTab />
            </TabsContent>
          </Tabs>
        </Card>
        
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this item? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
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
  
  // Toggle user recruiter status
  const toggleRecruiterMutation = useMutation({
    mutationFn: async ({ userId, makeRecruiter }: { userId: number, makeRecruiter: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, { isRecruiter: makeRecruiter });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User updated",
        description: "User recruiter status has been updated successfully.",
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
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Manage Users</h3>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
      
      <div className="bg-white rounded-md shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-purple-50 text-left">
                <th className="px-4 py-3 text-sm font-medium text-gray-600">User</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={user.profileImageUrl} alt={user.name || user.username} />
                          <AvatarFallback className="bg-purple-100 text-purple-800">
                            {user.name?.substring(0, 2) || user.username?.substring(0, 2) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || user.username}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isRecruiter ? "outline" : "secondary"} className="text-xs">
                        {user.isRecruiter ? "Recruiter" : "User"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 text-xs">
                        Active
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleRecruiterMutation.mutate({ 
                            userId: user.id, 
                            makeRecruiter: !user.isRecruiter 
                          })}
                        >
                          {user.isRecruiter ? "Make Regular User" : "Make Recruiter"}
                        </Button>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    {searchQuery ? "No users match your search" : "No users found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Recruiters Tab Component
function RecruitersTab({ searchQuery }: { searchQuery: string }) {
  const { toast } = useToast();
  
  // Fetch all recruiters
  const { data: recruiters = [], isLoading } = useQuery({
    queryKey: ["/api/admin/recruiters"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/recruiters");
        return await res.json();
      } catch (error) {
        console.error("Error fetching recruiters:", error);
        return [];
      }
    }
  });
  
  // Filter recruiters based on search query
  const filteredRecruiters = searchQuery 
    ? recruiters.filter((recruiter: any) => 
        recruiter.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        recruiter.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recruiter.company?.toLowerCase().includes(searchQuery.toLowerCase()))
    : recruiters;
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Manage Recruiters</h3>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Recruiter
        </Button>
      </div>
      
      <div className="bg-white rounded-md shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-purple-50 text-left">
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Recruiter</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Company</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Jobs Posted</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecruiters.length > 0 ? (
                filteredRecruiters.map((recruiter: any) => (
                  <tr key={recruiter.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={recruiter.profileImageUrl} alt={recruiter.name || recruiter.username} />
                          <AvatarFallback className="bg-purple-100 text-purple-800">
                            {recruiter.name?.substring(0, 2) || recruiter.username?.substring(0, 2) || "R"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{recruiter.name || recruiter.username}</div>
                          <div className="text-sm text-gray-500">@{recruiter.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{recruiter.company || "Not specified"}</td>
                    <td className="px-4 py-3 text-sm">{recruiter.email}</td>
                    <td className="px-4 py-3 text-sm text-center">{recruiter.jobsCount || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          View Jobs
                        </Button>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm">
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    {searchQuery ? "No recruiters match your search" : "No recruiters found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
        job.location?.toLowerCase().includes(searchQuery.toLowerCase()))
    : jobs;
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium">Manage Job Postings</h3>
      </div>
      
      <div className="bg-white rounded-md shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-purple-50 text-left">
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Title</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Company</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Location</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Posted By</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Posted On</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{job.title}</div>
                      <div className="text-xs text-gray-500">{job.jobType} • {job.experienceLevel}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{job.company}</td>
                    <td className="px-4 py-3 text-sm">{job.location}</td>
                    <td className="px-4 py-3 text-sm">
                      {job.user ? (
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-1">
                            <AvatarImage src={job.user.profileImageUrl} alt={job.user.name || job.user.username} />
                            <AvatarFallback className="bg-purple-100 text-purple-800 text-xs">
                              {job.user.name?.substring(0, 2) || job.user.username?.substring(0, 2) || "R"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{job.user.name || job.user.username}</span>
                        </div>
                      ) : (
                        "Unknown"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {job.createdAt ? format(new Date(job.createdAt), "MMM d, yyyy") : "Unknown"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                        <Button variant="destructive" size="sm">
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    {searchQuery ? "No jobs match your search" : "No jobs found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Manage Communities</h3>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Community
        </Button>
      </div>
      
      <div className="bg-white rounded-md shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-purple-50 text-left">
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Community</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Members</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Created By</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Created On</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCommunities.length > 0 ? (
                filteredCommunities.map((community: any) => (
                  <tr key={community.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center mr-2">
                          {community.iconUrl ? (
                            <img src={community.iconUrl} alt={community.name} className="h-6 w-6" />
                          ) : (
                            <Building2 className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{community.name}</div>
                          <div className="text-xs text-gray-500">{community.description?.substring(0, 30)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">{community.membersCount || 0}</td>
                    <td className="px-4 py-3 text-sm">
                      {community.creator ? (
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-1">
                            <AvatarImage src={community.creator.profileImageUrl} alt={community.creator.name} />
                            <AvatarFallback className="bg-purple-100 text-purple-800 text-xs">
                              {community.creator.name?.substring(0, 2) || community.creator.username?.substring(0, 2) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{community.creator.name || community.creator.username}</span>
                        </div>
                      ) : (
                        "Unknown"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {community.createdAt ? format(new Date(community.createdAt), "MMM d, yyyy") : "Unknown"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`bg-${community.isActive ? 'green' : 'red'}-50 border-${community.isActive ? 'green' : 'red'}-200 text-${community.isActive ? 'green' : 'red'}-700 text-xs`}>
                        {community.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          {community.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    {searchQuery ? "No communities match your search" : "No communities found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Reports Tab Component with analytics
function ReportsTab() {
  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/analytics");
        return await res.json();
      } catch (error) {
        console.error("Error fetching analytics:", error);
        return {
          userStats: { total: 0, activeToday: 0, growth: 0 },
          recruiterStats: { total: 0, activeJobs: 0 },
          jobStats: { total: 0, applications: 0 },
          communityStats: { total: 0, posts: 0 },
        };
      }
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }
  
  const { userStats, recruiterStats, jobStats, communityStats } = analytics || {
    userStats: { total: 0, activeToday: 0, growth: 0 },
    recruiterStats: { total: 0, activeJobs: 0 },
    jobStats: { total: 0, applications: 0 },
    communityStats: { total: 0, posts: 0 },
  };
  
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium">Platform Analytics</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
            <CardDescription className="text-2xl font-bold text-gray-900">
              {userStats.total}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              <span className={`font-medium ${userStats.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {userStats.growth >= 0 ? '+' : ''}{userStats.growth}%
              </span> from last month
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Recruiters</CardTitle>
            <CardDescription className="text-2xl font-bold text-gray-900">
              {recruiterStats.total}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              {recruiterStats.activeJobs} active job postings
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Jobs</CardTitle>
            <CardDescription className="text-2xl font-bold text-gray-900">
              {jobStats.total}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              {jobStats.applications} total applications
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Communities</CardTitle>
            <CardDescription className="text-2xl font-bold text-gray-900">
              {communityStats.total}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              {communityStats.posts} community posts
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Platform Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border rounded p-4">
              <div className="text-center text-gray-500">
                <div className="mb-2">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-purple-500" />
                </div>
                <p>Loading chart data...</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Jobs by Industry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border rounded p-4">
              <div className="text-center text-gray-500">
                <div className="mb-2">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-purple-500" />
                </div>
                <p>Loading chart data...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Password Resets Tab Component
function PasswordResetsTab() {
  const { toast } = useToast();
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [action, setAction] = useState<'approve' | 'deny'>('approve');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch password reset requests
  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/password-reset-requests"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/password-reset-requests");
        return await res.json();
      } catch (error) {
        console.error("Error fetching password reset requests:", error);
        return [];
      }
    }
  });

  // Process request mutation
  const processRequestMutation = useMutation({
    mutationFn: async ({ requestId, action, adminNotes, temporaryPassword }: {
      requestId: number;
      action: 'approve' | 'deny';
      adminNotes?: string;
      temporaryPassword?: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/password-reset-requests/${requestId}`, {
        action,
        adminNotes,
        temporaryPassword
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request processed",
        description: `Password reset request has been ${action}d successfully`,
      });
      setProcessDialogOpen(false);
      setSelectedRequest(null);
      setAction('approve');
      setTemporaryPassword('');
      setAdminNotes('');
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
    }
  });

  const handleProcessRequest = (request: any, actionType: 'approve' | 'deny') => {
    setSelectedRequest(request);
    setAction(actionType);
    setProcessDialogOpen(true);
  };

  const handleConfirmProcess = () => {
    if (!selectedRequest) return;

    const payload: any = {
      requestId: selectedRequest.id,
      action,
      adminNotes: adminNotes || undefined
    };

    if (action === 'approve' && temporaryPassword) {
      payload.temporaryPassword = temporaryPassword;
    }

    processRequestMutation.mutate(payload);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      approved: "bg-green-50 text-green-700 border-green-200",
      denied: "bg-red-50 text-red-700 border-red-200"
    };
    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants] || "bg-gray-50 text-gray-700 border-gray-200"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium">Password Reset Requests</h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage user password reset requests. Only admins can approve and set temporary passwords.
        </p>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processed
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests && requests.length > 0 ? (
                requests.map((request: any) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage src={request.user?.profileImageUrl} alt={request.user?.name} />
                          <AvatarFallback className="bg-purple-100 text-purple-800 text-xs">
                            {request.user?.name?.substring(0, 2) || request.user?.username?.substring(0, 2) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{request.user?.name || request.user?.username}</div>
                          <div className="text-xs text-gray-500">@{request.user?.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{request.email}</td>
                    <td className="px-4 py-3">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {request.createdAt ? format(new Date(request.createdAt), "MMM d, yyyy 'at' h:mm a") : "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {request.processedAt ? (
                        <div>
                          <div>{format(new Date(request.processedAt), "MMM d, yyyy 'at' h:mm a")}</div>
                          <div className="text-xs text-gray-500">
                            by {request.processedBy?.name || request.processedBy?.username || "Admin"}
                          </div>
                        </div>
                      ) : (
                        "Pending"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {request.status === 'pending' ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleProcessRequest(request, 'approve')}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleProcessRequest(request, 'deny')}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Deny
                            </Button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">
                            {request.status === 'approved' ? 'Approved' : 'Denied'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No password reset requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Request Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve Password Reset' : 'Deny Password Reset'}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve' 
                ? 'This will set a temporary password for the user. They will be notified via email.'
                : 'This will deny the password reset request. The user will need to submit a new request.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {action === 'approve' && (
              <div>
                <Label htmlFor="temporary-password">Temporary Password</Label>
                <Input
                  id="temporary-password"
                  type="text"
                  placeholder="Enter temporary password"
                  value={temporaryPassword}
                  onChange={(e) => setTemporaryPassword(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This password will be sent to the user via email
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
              <textarea
                id="admin-notes"
                placeholder="Add any notes about this request..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmProcess}
              disabled={action === 'approve' && !temporaryPassword}
              className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {action === 'approve' ? 'Approve' : 'Deny'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}