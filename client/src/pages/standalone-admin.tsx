import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Search, 
  Users, 
  Briefcase, 
  Building2, 
  Shield, 
  LogOut, 
  UserPlus,
  BarChart4,
  Trash,
  Edit,
  Eye,
  Mail,
  Check,
  X,
  Settings,
  Flag,
  MessageSquare,
  Bell,
  Zap,
  Database
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data
const mockUsers = [
  {
    id: 1,
    name: "Test User",
    username: "testuser",
    email: "testuser@example.com",
    profileImageUrl: null,
    isRecruiter: false,
    status: "active",
    createdAt: new Date("2025-01-15")
  },
  {
    id: 3,
    name: "Priya Sharma",
    username: "priyasharma",
    email: "priya.sharma@example.com",
    profileImageUrl: "https://randomuser.me/api/portraits/women/12.jpg",
    isRecruiter: false,
    status: "active",
    createdAt: new Date("2025-02-10")
  },
  {
    id: 4,
    name: "Arjun Patel",
    username: "arjunpatel",
    email: "arjun.patel@example.com",
    profileImageUrl: "https://randomuser.me/api/portraits/men/22.jpg",
    isRecruiter: false,
    status: "active",
    createdAt: new Date("2025-02-22")
  },
  {
    id: 7,
    name: "Ananya Singh",
    username: "ananyasingh",
    email: "ananya.singh@example.com",
    profileImageUrl: "https://randomuser.me/api/portraits/women/52.jpg",
    isRecruiter: true,
    status: "active",
    createdAt: new Date("2025-03-05"),
    company: "BrandConnect"
  },
  {
    id: 8,
    name: "Admin",
    username: "admin",
    email: "admin@example.com",
    profileImageUrl: null,
    isRecruiter: true,
    isAdmin: true,
    status: "active",
    createdAt: new Date("2025-01-01")
  }
];

const mockJobs = [
  {
    id: 1,
    title: "Senior Business Analyst",
    company: "TechSolutions India",
    location: "Bengaluru, Karnataka",
    jobType: "Full-time",
    experienceLevel: "Senior (5+ years)",
    createdAt: new Date("2025-05-13"),
    userId: 7,
    status: "active",
    applicants: 12,
    description: "Looking for an experienced business analyst to join our growing team.",
    user: {
      id: 7,
      name: "Ananya Singh",
      username: "ananyasingh",
      profileImageUrl: "https://randomuser.me/api/portraits/women/52.jpg"
    }
  },
  {
    id: 2,
    title: "Product Analyst",
    company: "InnovateHub",
    location: "Delhi, Remote",
    jobType: "Full-time",
    experienceLevel: "Mid-level (3-5 years)",
    createdAt: new Date("2025-05-10"),
    userId: 7,
    status: "active",
    applicants: 8,
    description: "Help us analyze product metrics and drive data-informed decisions.",
    user: {
      id: 7,
      name: "Ananya Singh",
      username: "ananyasingh",
      profileImageUrl: "https://randomuser.me/api/portraits/women/52.jpg"
    }
  },
  {
    id: 3,
    title: "Full Stack Developer",
    company: "TechMinds Solutions",
    location: "Mumbai, Maharashtra",
    jobType: "Full-time",
    experienceLevel: "Junior (1-3 years)",
    createdAt: new Date("2025-05-09"),
    userId: 7,
    status: "active",
    applicants: 15,
    description: "Join our team of passionate developers building innovative solutions.",
    user: {
      id: 7,
      name: "Ananya Singh",
      username: "ananyasingh",
      profileImageUrl: "https://randomuser.me/api/portraits/women/52.jpg"
    }
  }
];

const mockCommunities = [
  {
    id: 1,
    name: "Tech Innovators",
    description: "A community for tech professionals to share innovations and discuss emerging technologies.",
    membersCount: 124,
    isActive: true,
    createdAt: new Date("2025-03-15"),
    creatorId: 3,
    creator: {
      id: 3,
      name: "Priya Sharma",
      username: "priyasharma",
      profileImageUrl: "https://randomuser.me/api/portraits/women/12.jpg"
    }
  },
  {
    id: 2,
    name: "UI/UX Designers Hub",
    description: "Connect with UI/UX designers, share portfolios, and discuss design trends.",
    membersCount: 78,
    isActive: true,
    createdAt: new Date("2025-04-02"),
    creatorId: 4,
    creator: {
      id: 4,
      name: "Arjun Patel",
      username: "arjunpatel",
      profileImageUrl: "https://randomuser.me/api/portraits/men/22.jpg"
    }
  },
  {
    id: 3,
    name: "Data Science Network",
    description: "A place for data scientists to share knowledge, projects and best practices.",
    membersCount: 95,
    isActive: true,
    createdAt: new Date("2025-03-22"),
    creatorId: 3,
    creator: {
      id: 3,
      name: "Priya Sharma",
      username: "priyasharma",
      profileImageUrl: "https://randomuser.me/api/portraits/women/12.jpg"
    }
  }
];

// Analytics data
const mockAnalytics = {
  userStats: { 
    total: 158, 
    activeToday: 87, 
    growth: 12.5 
  },
  recruiterStats: { 
    total: 42, 
    activeJobs: 76 
  },
  jobStats: { 
    total: 76, 
    applications: 318 
  },
  communityStats: { 
    total: 14, 
    posts: 256 
  }
};

const mockReports = [
  {
    id: 1,
    type: "user",
    reportedId: 4,
    reportedBy: 1,
    reason: "Inappropriate profile content",
    status: "pending",
    createdAt: new Date("2025-05-10")
  },
  {
    id: 2,
    type: "post",
    reportedId: 12,
    reportedBy: 3,
    reason: "Spam content",
    status: "resolved",
    createdAt: new Date("2025-05-08") 
  },
  {
    id: 3,
    type: "community",
    reportedId: 2,
    reportedBy: 7,
    reason: "Offensive community description",
    status: "pending",
    createdAt: new Date("2025-05-12")
  }
];

type AdminSection = "dashboard" | "users" | "recruiters" | "jobs" | "communities" | "reports" | "settings" | "system" | "notifications";

export default function StandaloneAdminPanel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: number, type: string} | null>(null);
  
  useEffect(() => {
    // Check for admin session in sessionStorage
    const adminLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (!adminLoggedIn) {
      // Redirect to admin login if not logged in
      setLocation("/admin-login");
    }
  }, [setLocation]);

  const handleLogout = () => {
    // Clear admin session
    sessionStorage.removeItem('adminLoggedIn');
    
    toast({
      title: "Logged out",
      description: "You have been logged out of the admin panel",
    });
    
    // Redirect to admin login
    setLocation("/admin-login");
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    const { id, type } = itemToDelete;
    
    // Show success message
    toast({
      title: "Deleted successfully",
      description: `The ${type} has been deleted`,
    });
    
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };
  
  const handleDeleteItem = (id: number, type: string) => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };
  
  const handleToggleRecruiter = (userId: number, makeRecruiter: boolean) => {
    toast({
      title: "User updated",
      description: `User ${userId} is now ${makeRecruiter ? 'a recruiter' : 'a regular user'}`,
    });
  };

  return (
    <div className="min-h-screen bg-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow border-b border-gray-200 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900">Harmony.ai Admin</h1>
        </div>
        
        <div className="flex items-center gap-4">
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
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4">
            <div className="flex items-center mb-6">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={null} alt="Admin" />
                <AvatarFallback className="bg-purple-100 text-purple-800">
                  AD
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">Admin</div>
                <div className="text-xs text-gray-500">admin@example.com</div>
              </div>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <nav className="space-y-1 px-3 pb-3">
              <Button 
                variant={activeSection === "dashboard" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveSection("dashboard")}
              >
                <BarChart4 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              
              <Separator className="my-2" />
              <p className="text-xs font-semibold text-gray-500 px-3 mb-2">USER MANAGEMENT</p>
              
              <Button 
                variant={activeSection === "users" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveSection("users")}
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </Button>
              
              <Button 
                variant={activeSection === "recruiters" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveSection("recruiters")}
              >
                <Shield className="h-4 w-4 mr-2" />
                Recruiters
              </Button>
              
              <Separator className="my-2" />
              <p className="text-xs font-semibold text-gray-500 px-3 mb-2">CONTENT MANAGEMENT</p>
              
              <Button 
                variant={activeSection === "jobs" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveSection("jobs")}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Jobs
              </Button>
              
              <Button 
                variant={activeSection === "communities" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveSection("communities")}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Communities
              </Button>
              
              <Button 
                variant={activeSection === "reports" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveSection("reports")}
              >
                <Flag className="h-4 w-4 mr-2" />
                Reports
                <Badge className="ml-auto" variant="outline">
                  {mockReports.filter(r => r.status === "pending").length}
                </Badge>
              </Button>
              
              <Separator className="my-2" />
              <p className="text-xs font-semibold text-gray-500 px-3 mb-2">SYSTEM</p>
              
              <Button 
                variant={activeSection === "notifications" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveSection("notifications")}
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              
              <Button 
                variant={activeSection === "system" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveSection("system")}
              >
                <Database className="h-4 w-4 mr-2" />
                System Status
              </Button>
              
              <Button 
                variant={activeSection === "settings" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveSection("settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </nav>
          </ScrollArea>
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-auto p-6">
          {activeSection === "dashboard" && (
            <DashboardSection analytics={mockAnalytics} />
          )}
          
          {activeSection === "users" && (
            <UsersSection 
              searchQuery={searchQuery} 
              users={mockUsers} 
              onDelete={(id) => handleDeleteItem(id, "user")}
              onToggleRecruiter={handleToggleRecruiter} 
            />
          )}
          
          {activeSection === "recruiters" && (
            <RecruitersSection
              searchQuery={searchQuery} 
              recruiters={mockUsers.filter(u => u.isRecruiter)}
              onDelete={(id) => handleDeleteItem(id, "recruiter")}
            />
          )}
          
          {activeSection === "jobs" && (
            <JobsSection
              searchQuery={searchQuery} 
              jobs={mockJobs}
              onDelete={(id) => handleDeleteItem(id, "job")}
            />
          )}
          
          {activeSection === "communities" && (
            <CommunitiesSection 
              searchQuery={searchQuery} 
              communities={mockCommunities}
              onDelete={(id) => handleDeleteItem(id, "community")}
            />
          )}
          
          {activeSection === "reports" && (
            <ReportsSection reports={mockReports} />
          )}
          
          {activeSection === "settings" && (
            <SettingsSection />
          )}
          
          {activeSection === "system" && (
            <SystemSection />
          )}
          
          {activeSection === "notifications" && (
            <NotificationsSection />
          )}
        </div>
      </div>
      
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
  );
}

// Dashboard Section
function DashboardSection({ analytics }: { analytics: any }) {
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Overview of platform statistics and activities</p>
        </div>
        
        <div>
          <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
            Last updated: {format(new Date(), "MMM d, yyyy h:mm a")}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
            <CardDescription className="text-2xl font-bold text-gray-900">
              {analytics.userStats.total}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              <span className={`font-medium ${analytics.userStats.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {analytics.userStats.growth >= 0 ? '+' : ''}{analytics.userStats.growth}%
              </span> from last month
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Recruiters</CardTitle>
            <CardDescription className="text-2xl font-bold text-gray-900">
              {analytics.recruiterStats.total}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              {analytics.recruiterStats.activeJobs} active job postings
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Jobs</CardTitle>
            <CardDescription className="text-2xl font-bold text-gray-900">
              {analytics.jobStats.total}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              {analytics.jobStats.applications} total applications
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Communities</CardTitle>
            <CardDescription className="text-2xl font-bold text-gray-900">
              {analytics.communityStats.total}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              {analytics.communityStats.posts} community posts
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Platform Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border rounded p-4">
              <div className="text-center text-gray-500">
                <div className="mb-2">
                  <BarChart4 className="h-8 w-8 mx-auto text-purple-300" />
                </div>
                <p>Platform activities will be displayed here</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockReports.slice(0, 3).map((report) => (
                <div key={report.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between">
                    <div className="font-medium">{report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report</div>
                    <Badge variant={report.status === "pending" ? "outline" : "secondary"}>
                      {report.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{report.reason}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {format(new Date(report.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full">
                View All Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Users Section
function UsersSection({ 
  searchQuery, 
  users, 
  onDelete,
  onToggleRecruiter 
}: { 
  searchQuery: string; 
  users: any[]; 
  onDelete: (id: number) => void;
  onToggleRecruiter: (id: number, makeRecruiter: boolean) => void;
}) {
  // Filter users based on search query
  const filteredUsers = searchQuery 
    ? users.filter((user) => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    : users;
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
          <p className="text-gray-600">View and manage user accounts</p>
        </div>
        
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
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
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={user.profileImageUrl || undefined} alt={user.name} />
                            <AvatarFallback className="bg-purple-100 text-purple-800">
                              {user.name?.substring(0, 2) || user.username?.substring(0, 2) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={user.isRecruiter ? "outline" : "secondary"} className="text-xs">
                          {user.isRecruiter ? "Recruiter" : "User"}
                        </Badge>
                        {user.isAdmin && (
                          <Badge variant="default" className="ml-2 text-xs">
                            Admin
                          </Badge>
                        )}
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
                            onClick={() => onToggleRecruiter(user.id, !user.isRecruiter)}
                          >
                            {user.isRecruiter ? "Make Regular User" : "Make Recruiter"}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => onDelete(user.id)}
                          >
                            <Trash className="h-4 w-4 mr-1" />
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
        </CardContent>
      </Card>
    </div>
  );
}

// Recruiters Section
function RecruitersSection({ 
  searchQuery,
  recruiters,
  onDelete
}: { 
  searchQuery: string; 
  recruiters: any[];
  onDelete: (id: number) => void;
}) {
  // Filter recruiters based on search query
  const filteredRecruiters = searchQuery 
    ? recruiters.filter((recruiter) => 
        recruiter.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        recruiter.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recruiter.company?.toLowerCase().includes(searchQuery.toLowerCase()))
    : recruiters;
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Recruiters</h2>
          <p className="text-gray-600">View and manage recruiter accounts</p>
        </div>
        
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Recruiter
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
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
                  filteredRecruiters.map((recruiter) => (
                    <tr key={recruiter.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={recruiter.profileImageUrl || undefined} alt={recruiter.name} />
                            <AvatarFallback className="bg-purple-100 text-purple-800">
                              {recruiter.name?.substring(0, 2) || recruiter.username?.substring(0, 2) || "R"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{recruiter.name}</div>
                            <div className="text-sm text-gray-500">@{recruiter.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{recruiter.company || "Not specified"}</td>
                      <td className="px-4 py-3 text-sm">{recruiter.email}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        {mockJobs.filter(job => job.userId === recruiter.id).length}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Briefcase className="h-4 w-4 mr-1" />
                            View Jobs
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4 mr-1" />
                            Contact
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => onDelete(recruiter.id)}
                          >
                            <Trash className="h-4 w-4 mr-1" />
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
        </CardContent>
      </Card>
    </div>
  );
}

// Jobs Section
function JobsSection({ 
  searchQuery,
  jobs,
  onDelete
}: { 
  searchQuery: string; 
  jobs: any[];
  onDelete: (id: number) => void;
}) {
  // Filter jobs based on search query
  const filteredJobs = searchQuery 
    ? jobs.filter((job) => 
        job.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        job.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchQuery.toLowerCase()))
    : jobs;
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Jobs</h2>
          <p className="text-gray-600">View and manage job postings</p>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50 text-left">
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Title</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Company</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Location</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Posted By</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Applicants</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Posted On</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
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
                              <AvatarImage src={job.user.profileImageUrl || undefined} alt={job.user.name} />
                              <AvatarFallback className="bg-purple-100 text-purple-800 text-xs">
                                {job.user.name?.substring(0, 2) || job.user.username?.substring(0, 2) || "R"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[120px]">{job.user.name}</span>
                          </div>
                        ) : (
                          "Unknown"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {job.applicants}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {job.createdAt ? format(new Date(job.createdAt), "MMM d, yyyy") : "Unknown"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => onDelete(job.id)}
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      {searchQuery ? "No jobs match your search" : "No jobs found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Communities Section
function CommunitiesSection({ 
  searchQuery,
  communities,
  onDelete
}: { 
  searchQuery: string; 
  communities: any[];
  onDelete: (id: number) => void;
}) {
  // Filter communities based on search query
  const filteredCommunities = searchQuery 
    ? communities.filter((community) => 
        community.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        community.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : communities;
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Communities</h2>
          <p className="text-gray-600">View and manage professional communities</p>
        </div>
        
        <Button>
          <Building2 className="h-4 w-4 mr-2" />
          Add Community
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
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
                  filteredCommunities.map((community) => (
                    <tr key={community.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center mr-2">
                            <Building2 className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium">{community.name}</div>
                            <div className="text-xs text-gray-500">{community.description?.substring(0, 30)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{community.membersCount}</td>
                      <td className="px-4 py-3 text-sm">
                        {community.creator ? (
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-1">
                              <AvatarImage src={community.creator.profileImageUrl || undefined} alt={community.creator.name} />
                              <AvatarFallback className="bg-purple-100 text-purple-800 text-xs">
                                {community.creator.name?.substring(0, 2) || community.creator.username?.substring(0, 2) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span>{community.creator.name}</span>
                          </div>
                        ) : (
                          "Unknown"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {community.createdAt ? format(new Date(community.createdAt), "MMM d, yyyy") : "Unknown"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 text-xs">
                          {community.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="ghost" size="sm">
                            {community.isActive ? (
                              <>
                                <X className="h-4 w-4 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => onDelete(community.id)}
                          >
                            <Trash className="h-4 w-4 mr-1" />
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
        </CardContent>
      </Card>
    </div>
  );
}

// Reports Section
function ReportsSection({ reports }: { reports: any[] }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Content Reports</h2>
        <p className="text-gray-600">Review and manage reported content</p>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50 text-left">
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Report Type</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Reason</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Reported By</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">
                        {report.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{report.reason}</td>
                    <td className="px-4 py-3 text-sm">
                      User #{report.reportedBy}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(report.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge 
                        variant={report.status === "pending" ? "outline" : "secondary"}
                        className={`capitalize ${report.status === "pending" ? "bg-yellow-50 border-yellow-200 text-yellow-700" : ""}`}
                      >
                        {report.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        <Button variant="outline" size="sm">
                          <Check className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                        <Button variant="outline" size="sm">
                          <X className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Settings Section
function SettingsSection() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>
        <p className="text-gray-600">Configure global settings for the platform</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure basic platform settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Platform Name</label>
              </div>
              <Input defaultValue="Harmony.ai" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Admin Contact Email</label>
              </div>
              <Input defaultValue="admin@harmony.ai" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Default Language</label>
              </div>
              <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            
            <Button className="w-full mt-4">Save Settings</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Content Moderation</CardTitle>
            <CardDescription>
              Configure content moderation settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Enable AI Content Moderation</label>
                <div className="h-4 w-8 rounded-full bg-green-500 relative">
                  <div className="h-3 w-3 rounded-full bg-white absolute right-1 top-0.5"></div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Use AI to automatically moderate user-generated content
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Auto-flag Reported Content</label>
                <div className="h-4 w-8 rounded-full bg-green-500 relative">
                  <div className="h-3 w-3 rounded-full bg-white absolute right-1 top-0.5"></div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Automatically flag content that has been reported by users
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Require Approval for New Communities</label>
                <div className="h-4 w-8 rounded-full bg-gray-300 relative">
                  <div className="h-3 w-3 rounded-full bg-white absolute left-1 top-0.5"></div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                New communities require admin approval before becoming active
              </p>
            </div>
            
            <Button className="w-full mt-4">Save Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// System Section
function SystemSection() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">System Status</h2>
        <p className="text-gray-600">Monitor system health and performance</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Server Status</CardTitle>
            <CardDescription className="text-2xl font-bold text-green-500">
              Online
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              Last checked: {format(new Date(), "MMM d, h:mm a")}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Database Status</CardTitle>
            <CardDescription className="text-2xl font-bold text-green-500">
              Connected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              Response time: 42ms
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">API Status</CardTitle>
            <CardDescription className="text-2xl font-bold text-green-500">
              Operational
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              Avg. response time: 126ms
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
          <CardDescription>
            Recent system events and logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 font-mono text-xs p-4 rounded h-64 overflow-y-auto">
            <p>[2025-05-20 08:30:12] INFO: System booted successfully</p>
            <p>[2025-05-20 08:30:15] INFO: Database connection established</p>
            <p>[2025-05-20 08:32:07] INFO: User authentication service started</p>
            <p>[2025-05-20 08:33:22] INFO: API services initialized</p>
            <p>[2025-05-20 08:35:46] WARN: High CPU usage detected (82%)</p>
            <p>[2025-05-20 08:36:12] INFO: CPU usage normalized (45%)</p>
            <p>[2025-05-20 08:42:33] INFO: Scheduled backup initiated</p>
            <p>[2025-05-20 08:45:17] INFO: Backup completed successfully</p>
            <p>[2025-05-20 08:50:02] INFO: 158 active user sessions</p>
            <p>[2025-05-20 08:52:19] INFO: Cache refresh completed</p>
            <p>[2025-05-20 08:55:37] INFO: System health check passed</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Notifications Section
function NotificationsSection() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Platform Notifications</h2>
        <p className="text-gray-600">Manage and send notifications to users</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Send New Notification</CardTitle>
            <CardDescription>
              Create and send a notification to users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipient Group</label>
                <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                  <option value="all">All Users</option>
                  <option value="recruiters">Recruiters Only</option>
                  <option value="jobseekers">Job Seekers Only</option>
                  <option value="admins">Admins Only</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Notification Type</label>
                <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                  <option value="announcement">Announcement</option>
                  <option value="update">Platform Update</option>
                  <option value="maintenance">Maintenance Alert</option>
                  <option value="event">Event Invitation</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input placeholder="Enter notification title" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea 
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[100px]" 
                  placeholder="Enter notification message"
                ></textarea>
              </div>
              
              <div className="space-y-2 flex items-center">
                <input type="checkbox" id="important" className="mr-2" />
                <label htmlFor="important" className="text-sm">Mark as important</label>
              </div>
              
              <Button className="w-full">
                <Bell className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              Recently sent platform notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="flex justify-between">
                  <div className="font-medium">Platform Maintenance</div>
                  <Badge>Announcement</Badge>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Scheduled maintenance on May 22, 2025 from 2:00 AM to 4:00 AM UTC
                </div>
                <div className="text-xs text-gray-400 mt-1 flex justify-between">
                  <span>Sent to: All Users</span>
                  <span>May 18, 2025</span>
                </div>
              </div>
              
              <div className="border-b pb-4">
                <div className="flex justify-between">
                  <div className="font-medium">New Feature: Enhanced Job Matching</div>
                  <Badge>Update</Badge>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  We've improved our AI job matching algorithm for better recommendations
                </div>
                <div className="text-xs text-gray-400 mt-1 flex justify-between">
                  <span>Sent to: All Users</span>
                  <span>May 15, 2025</span>
                </div>
              </div>
              
              <div className="border-b pb-4">
                <div className="flex justify-between">
                  <div className="font-medium">Recruiter Webinar: Advanced Talent Search</div>
                  <Badge>Event</Badge>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Join us for a webinar on advanced talent search techniques
                </div>
                <div className="text-xs text-gray-400 mt-1 flex justify-between">
                  <span>Sent to: Recruiters Only</span>
                  <span>May 10, 2025</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                View All Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Configure global notification settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Enable Email Notifications</div>
                <div className="text-sm text-gray-500">Send notifications via email</div>
              </div>
              <div className="h-4 w-8 rounded-full bg-green-500 relative">
                <div className="h-3 w-3 rounded-full bg-white absolute right-1 top-0.5"></div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Enable Push Notifications</div>
                <div className="text-sm text-gray-500">Send notifications via browser push</div>
              </div>
              <div className="h-4 w-8 rounded-full bg-green-500 relative">
                <div className="h-3 w-3 rounded-full bg-white absolute right-1 top-0.5"></div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Allow Marketing Notifications</div>
                <div className="text-sm text-gray-500">Send marketing and promotional notifications</div>
              </div>
              <div className="h-4 w-8 rounded-full bg-gray-300 relative">
                <div className="h-3 w-3 rounded-full bg-white absolute left-1 top-0.5"></div>
              </div>
            </div>
            
            <Button className="mt-4">Save Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}