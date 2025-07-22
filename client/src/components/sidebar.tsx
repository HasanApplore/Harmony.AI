import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Home, Users, Briefcase, MessageSquare, Settings, UserCircle, ShieldAlert, BookmarkIcon, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import HarmonyLogo from "@/components/harmony-logo";
import { Job } from "@shared/schema";

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fetch saved jobs count
  const { data: savedJobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs/saved"],
    enabled: !!user,
  });
  
  const savedJobsCount = savedJobs?.length || 0;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const navItems = [
    { id: 1, name: "Home", path: "/", icon: <Home className={`w-5 h-5 ${!collapsed ? 'mr-3' : ''}`} /> },
    { id: 2, name: "My Network", path: "/my-network", icon: <Users className={`w-5 h-5 ${!collapsed ? 'mr-3' : ''}`} /> },
    { id: 3, name: "Jobs", path: "/jobs", icon: <Briefcase className={`w-5 h-5 ${!collapsed ? 'mr-3' : ''}`} /> },
    { id: 6, name: "Companies", path: "/companies", icon: <Building2 className={`w-5 h-5 ${!collapsed ? 'mr-3' : ''}`} /> },
    { id: 4, name: "Communities", path: "/communities", icon: <Users className={`w-5 h-5 ${!collapsed ? 'mr-3' : ''}`} /> },
    { id: 5, name: "Messages", path: "/messages", icon: <MessageSquare className={`w-5 h-5 ${!collapsed ? 'mr-3' : ''}`} /> },
  ];

  const userMenuItems = [
    { id: 6, name: "Profile", path: "/profile", icon: <UserCircle className={`w-5 h-5 ${!collapsed ? 'mr-3' : ''}`} /> },
    { id: 7, name: "Settings", path: "/settings", icon: <Settings className={`w-5 h-5 ${!collapsed ? 'mr-3' : ''}`} /> },
  ];

  return (
    <aside 
      className={`desktop-sidebar ${collapsed ? 'w-16' : 'w-64'} bg-white shadow h-screen fixed overflow-y-auto hidden md:block transition-all duration-300`}
    >
      <div className={`${collapsed ? 'p-2' : 'p-4'}`}>
        <div className={`${collapsed ? 'text-center mb-4' : 'flex justify-start mb-8'}`}>
          {collapsed ? (
            <HarmonyLogo size="sm" showText={false} />
          ) : (
            <HarmonyLogo size="lg" showText={false} />
          )}
        </div>

        {user && (
          <div className={`${collapsed ? 'mb-4' : 'mb-8'}`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-center mb-4'}`}>
              <Avatar className={`${collapsed ? 'w-10 h-10' : 'w-20 h-20'}`}>
                <AvatarImage src={user.profileImageUrl || undefined} alt={user.name || user.username || ""} />
                <AvatarFallback className="text-lg bg-[#EFE9FF] text-[#8B4DFF]">
                  {user?.name?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase() || ""}
                </AvatarFallback>
              </Avatar>
            </div>
            {!collapsed && (
              <div className="text-center">
                <h2 className="text-[#8B4DFF] font-semibold">{user.name || user.username}</h2>
                <p className="text-black text-sm font-semibold">{user.title || (user.isRecruiter ? "Recruiter" : "Professional")}</p>
              </div>
            )}
          </div>
        )}

        <TooltipProvider>
          <nav>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => handleNavigation(item.path)}
                          className={`flex items-center justify-center p-2 rounded-md font-medium cursor-pointer ${
                            location === item.path
                              ? "text-purple-600 bg-purple-50"
                              : "text-gray-700 hover:bg-purple-50"
                          }`}
                        >
                          {item.icon}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.name}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <div
                      onClick={() => handleNavigation(item.path)}
                      className={`flex items-center px-4 py-2 rounded-md font-medium cursor-pointer ${
                        location === item.path
                          ? "text-purple-600 bg-purple-50"
                          : "text-gray-700 hover:bg-purple-50"
                      }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <Separator className={`${collapsed ? 'my-2' : 'my-4'}`} />

            {/* Saved Jobs Item with badge */}
            <ul className="space-y-2">
              <li>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() => handleNavigation("/saved-jobs")}
                        className={`flex items-center justify-center p-2 rounded-md font-medium cursor-pointer ${
                          location === "/saved-jobs"
                            ? "text-purple-600 bg-purple-50"
                            : "text-gray-700 hover:bg-purple-50"
                        }`}
                      >
                        <div className="relative">
                          <BookmarkIcon className="w-5 h-5" />
                          {savedJobsCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center bg-purple-600 text-white text-xs font-bold rounded-full h-4 w-4">
                              {savedJobsCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">Saved Jobs</TooltipContent>
                  </Tooltip>
                ) : (
                  <div
                    onClick={() => handleNavigation("/saved-jobs")}
                    className={`flex items-center px-4 py-2 rounded-md font-medium cursor-pointer ${
                      location === "/saved-jobs"
                        ? "text-purple-600 bg-purple-50"
                        : "text-gray-700 hover:bg-purple-50"
                    }`}
                  >
                    <BookmarkIcon className="w-5 h-5 mr-3" />
                    <span>Saved Jobs</span>
                    {savedJobsCount > 0 && (
                      <span className="ml-auto bg-purple-100 text-purple-800 text-xs font-medium rounded-full px-2 py-0.5">
                        {savedJobsCount}
                      </span>
                    )}
                  </div>
                )}
              </li>

              {/* Rest of User Menu Items */}
              {userMenuItems.map((item) => (
                <li key={item.id}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => handleNavigation(item.path)}
                          className={`flex items-center justify-center p-2 rounded-md font-medium cursor-pointer ${
                            location === item.path
                              ? "text-purple-600 bg-purple-50"
                              : "text-gray-700 hover:bg-purple-50"
                          }`}
                        >
                          {item.icon}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.name}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <div
                      onClick={() => handleNavigation(item.path)}
                      className={`flex items-center px-4 py-2 rounded-md font-medium cursor-pointer ${
                        location === item.path
                          ? "text-purple-600 bg-purple-50"
                          : "text-gray-700 hover:bg-purple-50"
                      }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                  )}
                </li>
              ))}
              <li>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        onClick={handleLogout}
                        className="flex items-center justify-center p-2 rounded-md font-medium cursor-pointer text-gray-700 hover:bg-purple-50"
                      >
                        <LogOut className="w-5 h-5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">Logout</TooltipContent>
                  </Tooltip>
                ) : (
                  <div
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 rounded-md font-medium cursor-pointer text-gray-700 hover:bg-purple-50"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span>Logout</span>
                  </div>
                )}
              </li>
            </ul>
          </nav>
        </TooltipProvider>
      </div>
    </aside>
  );
}
