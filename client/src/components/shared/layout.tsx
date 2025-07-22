import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  UserCircle,
  BriefcaseBusiness,
  Menu,
  X
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-30">
        <Link href="/">
          <a className="font-bold text-xl text-primary flex items-center">
            Harmony.ai
          </a>
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
        <div className="fixed inset-0 z-40 bg-white md:hidden flex flex-col pt-20">
          <div className="flex flex-col items-center px-6 py-4 border-b">
            <Avatar className="h-20 w-20 mb-3">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.name || "User"} />
              <AvatarFallback className="bg-[#EFE9FF] text-[#8B4DFF] text-xl">
                {user?.name?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="font-medium">{user?.name || user?.username}</h3>
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
                      <BriefcaseBusiness className="mr-2 h-5 w-5" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/create-job-posting">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/create-job-posting" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Briefcase className="mr-2 h-5 w-5" />
                      Post Job
                    </Button>
                  </Link>
                  <Link href="/applicant-tracking">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/applicant-tracking" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Applicants
                    </Button>
                  </Link>
                  <Link href="/talent-pool">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/talent-pool" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <UserCircle className="mr-2 h-5 w-5" />
                      Talent Pool
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
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-64 bg-white border-r">
          {/* Logo */}
          <div className="p-6">
            <Link href="/">
              <a className="font-bold text-xl text-primary">Harmony.ai</a>
            </Link>
          </div>
          
          {/* User Profile */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.name || "User"} />
                <AvatarFallback className="bg-[#EFE9FF] text-[#8B4DFF]">
                  {user?.name?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <h3 className="font-medium">{user?.name || user?.username}</h3>
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
                      <BriefcaseBusiness className="mr-2 h-5 w-5" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/create-job-posting">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/create-job-posting" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Briefcase className="mr-2 h-5 w-5" />
                      Post Job
                    </Button>
                  </Link>
                  <Link href="/applicant-tracking">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/applicant-tracking" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Applicants
                    </Button>
                  </Link>
                  <Link href="/talent-pool">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        location === "/talent-pool" ? "bg-purple-50 text-purple-800" : ""
                      }`}
                    >
                      <UserCircle className="mr-2 h-5 w-5" />
                      Talent Pool
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
            </nav>
            
            <div className="pt-8">
              <h4 className="text-xs uppercase font-semibold text-gray-500 px-3 mb-2">Account</h4>
              <nav className="flex flex-col gap-1">
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
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}