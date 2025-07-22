import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import HarmonyLogo from "@/components/harmony-logo";
import { 
  Home, 
  Users, 
  Briefcase, 
  MessageSquare, 
  Settings, 
  LogOut,
  User,
  Bookmark,
  Building2,
  BriefcaseBusiness,
  Menu,
  X,
  UserCheck,
  PlusCircle
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Check if current user is a recruiter
  const isRecruiter = user?.isRecruiter;
  
  // For getting initials for avatar
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ")
      .map(part => part.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen main-container">
      {/* Mobile Header */}
      <div className="md:hidden bg-purple-50 border-b border-purple-100 p-4 flex justify-between items-center sticky top-0 z-30">
        <Link href="/">
          <HarmonyLogo size="lg" />
        </Link>
        
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Navigation Menu (overlay) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-purple-50 md:hidden flex flex-col pt-20">
          <div className="flex flex-col items-center px-6 py-4 border-b">
            <Avatar className="h-20 w-20 mb-3">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.name || "User"} />
              <AvatarFallback className="bg-[#EFE9FF] text-[#8B4DFF] text-xl">
                {getInitials(user?.name || user?.username)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="font-semibold text-[#8B4DFF]">{user?.name || user?.username}</h3>
              <p className="text-sm text-black font-semibold">{user?.title || (isRecruiter ? "Recruiter" : "")}</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="flex flex-col gap-2">
              {isRecruiter ? (
                <>
                  <Link href="/recruiter-dashboard">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/recruiter-dashboard" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Home className="mr-2 h-5 w-5" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/recruiter-network">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/recruiter-network" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Users className="mr-2 h-5 w-5" />
                      My Network
                    </Button>
                  </Link>
                  <Link href="/recruiter-jobs">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/recruiter-jobs" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Briefcase className="mr-2 h-5 w-5" />
                      Jobs
                    </Button>
                  </Link>
                  <Link href="/applicant-tracking">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/applicant-tracking" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <UserCheck className="mr-2 h-5 w-5" />
                      Applicants
                    </Button>
                  </Link>
                  <Link href="/create-job-posting">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/create-job-posting" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Post Job
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Home className="mr-2 h-5 w-5" />
                      Home
                    </Button>
                  </Link>
                  <Link href="/my-network">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/my-network" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Users className="mr-2 h-5 w-5" />
                      My Network
                    </Button>
                  </Link>
                  <Link href="/jobs">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/jobs" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Briefcase className="mr-2 h-5 w-5" />
                      Jobs
                    </Button>
                  </Link>
                  <Link href="/saved-jobs">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/saved-jobs" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Bookmark className="mr-2 h-5 w-5" />
                      Saved Jobs
                    </Button>
                  </Link>
                </>
              )}
              
              <Link href="/messages">
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    location === "/messages" ? "bg-purple-50 text-purple-800" : ""
                  }`}
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Messages
                </Button>
              </Link>
              <Link href="/communities">
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    location === "/communities" ? "bg-purple-50 text-purple-800" : ""
                  }`}
                >
                  <Building2 className="mr-2 h-5 w-5" />
                  Communities
                </Button>
              </Link>
              <Link href="/companies">
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    location.includes("/companies") ? "bg-purple-50 text-purple-800" : ""
                  }`}
                >
                  <BriefcaseBusiness className="mr-2 h-5 w-5" />
                  Companies
                </Button>
              </Link>
              <Link href="/profile">
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    location === "/profile" ? "bg-purple-50 text-purple-800" : ""
                  }`}
                >
                  <User className="mr-2 h-5 w-5" />
                  Profile
                </Button>
              </Link>
              <Link href="/settings">
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    location === "/settings" ? "bg-purple-50 text-purple-800" : ""
                  }`}
                >
                  <Settings className="mr-2 h-5 w-5" />
                  Settings
                </Button>
              </Link>
              <Link href="/companies/create">
                <Button
                  variant="outline" 
                  className="w-full justify-start mt-4 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create Company
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      )}
      
      {/* Desktop layout */}
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-64 bg-purple-50 border-r border-purple-100 shadow-sm">
          {/* Logo */}
          <div className="p-6">
            <Link href={isRecruiter ? "/recruiter-dashboard" : "/"}>
              <HarmonyLogo size="lg" />
            </Link>
          </div>
          
          {/* User Profile */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.name || "User"} />
                <AvatarFallback className="bg-[#EFE9FF] text-[#8B4DFF]">
                  {getInitials(user?.name || user?.username)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <h3 className="font-semibold text-[#8B4DFF]">{user?.name || user?.username}</h3>
                <p className="text-sm text-black font-semibold">{user?.title || (isRecruiter ? "Recruiter" : "")}</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6 px-4">
            <nav className="flex flex-col gap-1">
              {isRecruiter ? (
                <>
                  <Link href="/recruiter-dashboard">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/recruiter-dashboard" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Home className="mr-2 h-5 w-5" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/recruiter-network">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/recruiter-network" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Users className="mr-2 h-5 w-5" />
                      My Network
                    </Button>
                  </Link>
                  <Link href="/recruiter-jobs">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/recruiter-jobs" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Briefcase className="mr-2 h-5 w-5" />
                      Jobs
                    </Button>
                  </Link>
                  <Link href="/applicant-tracking">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/applicant-tracking" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <UserCheck className="mr-2 h-5 w-5" />
                      Applicants
                    </Button>
                  </Link>
                  <Link href="/create-job-posting">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/create-job-posting" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Post Job
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Home className="mr-2 h-5 w-5" />
                      Home
                    </Button>
                  </Link>
                  <Link href="/my-network">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/my-network" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Users className="mr-2 h-5 w-5" />
                      My Network
                    </Button>
                  </Link>
                  <Link href="/jobs">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/jobs" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Briefcase className="mr-2 h-5 w-5" />
                      Jobs
                    </Button>
                  </Link>
                  <Link href="/saved-jobs">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/saved-jobs" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Bookmark className="mr-2 h-5 w-5" />
                      Saved Jobs
                    </Button>
                  </Link>
                </>
              )}
              
              <Link href="/messages">
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    location === "/messages" ? "bg-purple-50 text-purple-800" : ""
                  }`}
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Messages
                </Button>
              </Link>
              <Link href="/communities">
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    location === "/communities" ? "bg-purple-50 text-purple-800" : ""
                  }`}
                >
                  <Building2 className="mr-2 h-5 w-5" />
                  Communities
                </Button>
              </Link>
              <Link href="/companies">
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    location.includes("/companies") ? "bg-purple-50 text-purple-800" : ""
                  }`}
                >
                  <BriefcaseBusiness className="mr-2 h-5 w-5" />
                  Companies
                </Button>
              </Link>
            </nav>
            
            <div className="pt-8">
              <h4 className="text-xs uppercase font-semibold text-gray-500 px-3 mb-2">Account</h4>
              <nav className="flex flex-col gap-1">
                <Link href={isRecruiter ? "/recruiter-profile" : "/profile"}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      location === "/profile" || location === "/recruiter-profile" ? "bg-purple-50 text-purple-800" : ""
                    }`}
                  >
                    <User className="mr-2 h-5 w-5" />
                    Profile
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      location === "/settings" ? "bg-purple-50 text-purple-800" : ""
                    }`}
                  >
                    <Settings className="mr-2 h-5 w-5" />
                    Settings
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 mt-2"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Logout
                </Button>
              </nav>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main content header */}
          <header className="bg-white border-b py-4 px-6">
            <h1 className="text-xl font-semibold text-gray-800">
              {location === "/" && "Feed"}
              {location === "/my-network" && "My Network"}
              {location === "/recruiter-network" && "My Network"}
              {location === "/jobs" && "Jobs"}
              {location === "/recruiter-jobs" && "Jobs"}
              {location === "/applicant-tracking" && "Applicant Tracking"}
              {location === "/create-job-posting" && "Post a Job"}
              {location === "/messages" && "Messages"}
              {location === "/communities" && "Communities"}
              {location === "/profile" && "Profile"}
              {location === "/settings" && "Settings"}
              {location === "/recruiter-dashboard" && "Dashboard"}
              {location.startsWith("/candidate/") && "Candidate Profile"}
            </h1>
          </header>
          
          {/* Page content */}
          <main className="flex-1 overflow-auto bg-purple-soft">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}