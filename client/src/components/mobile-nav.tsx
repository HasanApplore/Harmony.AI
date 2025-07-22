import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Home, Users, Briefcase, MessageSquare, Settings, UserCircle, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import HarmonyLogo from "@/components/harmony-logo";

export default function MobileNav() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };

  const navItems = [
    { id: 1, name: "Home", path: "/", icon: <Home className="w-5 h-5 mr-3" /> },
    { id: 2, name: "My Network", path: "/my-network", icon: <Users className="w-5 h-5 mr-3" /> },
    { id: 3, name: "Jobs", path: "/jobs", icon: <Briefcase className="w-5 h-5 mr-3" /> },
    { id: 4, name: "Communities", path: "/communities", icon: <Users className="w-5 h-5 mr-3" /> },
    { id: 5, name: "Messages", path: "/messages", icon: <MessageSquare className="w-5 h-5 mr-3" /> },
  ];

  const userMenuItems = [
    { id: 6, name: "Profile", path: "/profile", icon: <UserCircle className="w-5 h-5 mr-3" /> },
    { id: 7, name: "Settings", path: "/settings", icon: <Settings className="w-5 h-5 mr-3" /> },
  ];

  return (
    <nav className="bg-white shadow md:hidden sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <HarmonyLogo size="md" />
        </div>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-purple-50 transition-colors"
            >
              <Menu className="h-5 w-5 text-purple-600" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
            <div className="p-6">
              <div className="flex items-center justify-start mb-8">
                <HarmonyLogo size="lg" showText={false} />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full hover:bg-purple-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5 text-purple-600" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>

              {user && (
                <div className="mb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar>
                      <AvatarImage src={user.profileImageUrl || undefined} alt={user.name || user.username} />
                      <AvatarFallback className="bg-[#EFE9FF] text-[#8B4DFF]">
                        {user.name?.substring(0, 2).toUpperCase() || user.username?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-[#8B4DFF] font-semibold">{user.name || user.username}</h2>
                      <p className="text-black text-sm font-semibold">{user.title || (user.isRecruiter ? "Recruiter" : "Professional")}</p>
                    </div>
                  </div>
                </div>
              )}

              <nav>
                <ul className="space-y-2">
                  {navItems.map((item) => (
                    <li key={item.id}>
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
                    </li>
                  ))}
                </ul>

                <Separator className="my-4" />

                <ul className="space-y-2">
                  {userMenuItems.map((item) => (
                    <li key={item.id}>
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
                    </li>
                  ))}
                  <li>
                    <div
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 rounded-md font-medium cursor-pointer text-gray-700 hover:bg-purple-50"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      <span>Logout</span>
                    </div>
                  </li>
                </ul>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
