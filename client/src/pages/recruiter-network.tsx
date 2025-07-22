import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { Search, UserPlus, Check, X, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function RecruiterNetworkPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Custom card styling
  const cardStyle = "rounded-lg shadow-sm hover:shadow-md transition-shadow";
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("connections");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [connectionRequestDialogOpen, setConnectionRequestDialogOpen] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [filterValue, setFilterValue] = useState("");

  // Fetch connections
  const { data: connections, isLoading: isConnectionsLoading } = useQuery<any[]>({
    queryKey: ["/api/connections"],
  });

  // Fetch pending connection requests
  const { data: pendingConnections, isLoading: isPendingLoading } = useQuery<any[]>({
    queryKey: ["/api/connections/pending"],
  });

  // Fetch all users for discover tab
  const { data: allUsers, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Connection request mutation
  const sendConnectionMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("POST", "/api/connections", {
        receiverId: userId,
        message: connectionMessage,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      toast({
        title: "Connection request sent",
        description: "Your connection request has been sent successfully.",
      });
      setConnectionRequestDialogOpen(false);
      setConnectionMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Accept connection mutation
  const acceptConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      await apiRequest("PATCH", `/api/connections/${connectionId}/accept`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      toast({
        title: "Connection accepted",
        description: "You are now connected with this user.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject connection mutation
  const rejectConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      await apiRequest("PATCH", `/api/connections/${connectionId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      toast({
        title: "Connection rejected",
        description: "You have rejected this connection request.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter connections by search term
  const filteredConnections = connections?.filter(connection => {
    return connection.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           connection.user.title?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Filter pending connections by search term
  const filteredPendingConnections = pendingConnections?.filter(connection => {
    return connection.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           connection.user.title?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Filter users for discover tab by search term
  const filteredUsers = allUsers?.filter(otherUser => {
    // Don't show current user
    if (otherUser.id === user?.id) return false;
    
    // Don't show users we're already connected with
    const isConnected = connections?.some(connection => 
      connection.user.id === otherUser.id
    );
    if (isConnected) return false;
    
    // Don't show users with pending connections
    const isPending = pendingConnections?.some(connection => 
      connection.user.id === otherUser.id
    );
    if (isPending) return false;
    
    // Filter by search term
    return (
      otherUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      otherUser.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Get user category for filtering
  const getUserCategory = (user: User): string => {
    if (user.isRecruiter) return "Recruiter";
    
    const userTitle = user.title?.toLowerCase() || "";
    
    if (userTitle.includes("engineer") || userTitle.includes("developer")) return "Tech";
    if (userTitle.includes("design") || userTitle.includes("ux")) return "Design";
    if (userTitle.includes("product") || userTitle.includes("manager")) return "Management";
    if (userTitle.includes("marketing") || userTitle.includes("sales")) return "Marketing";
    if (userTitle.includes("data") || userTitle.includes("analyst")) return "Data";
    
    return "Other";
  };

  // Open connection dialog
  const openConnectionDialog = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    setConnectionRequestDialogOpen(true);
  };

  // Send connection request
  const sendConnectionRequest = () => {
    if (!selectedUser) return;
    sendConnectionMutation.mutate(selectedUser.id);
  };

  return (
    <Layout>
      <div className="p-4 pb-16 max-w-7xl mx-auto gradient-bg">
        <h1 className="text-2xl font-bold mb-6">My Network</h1>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b pb-1 mb-6">
            <TabsList className="bg-transparent gap-2">
              <TabsTrigger 
                value="connections" 
                className="rounded-full bg-purple-600 text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                My Connections
              </TabsTrigger>
              <TabsTrigger 
                value="pending" 
                className="rounded-full bg-transparent text-gray-700 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Pending Requests
              </TabsTrigger>
              <TabsTrigger 
                value="discover" 
                className="rounded-full bg-transparent text-gray-700 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Discover People
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* My Connections Tab */}
          <TabsContent value="connections">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                  placeholder="Search connections" 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
            
            {isConnectionsLoading ? (
              // Loading skeletons
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <Card key={i} className={cn(cardStyle, "p-5")}>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredConnections && filteredConnections.length > 0 ? (
              // Connection cards
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredConnections.map((connection) => (
                  <Card key={connection.connection.id} className={cardStyle}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center space-x-3 cursor-pointer" 
                          onClick={() => setLocation(`/profile/${connection.user.id}`)}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage 
                              src={connection.user.profileImageUrl || undefined} 
                              alt={connection.user.name} 
                            />
                            <AvatarFallback>{connection.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{connection.user.name}</h3>
                            <p className="text-sm text-gray-600 truncate max-w-[180px]">
                              {connection.user.title || "No title"}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setLocation(`/messages?userId=${connection.user.id}`)}
                        >
                          <Mail className="h-5 w-5 text-gray-500 hover:text-primary" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // No connections
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <UserPlus size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-1">No connections yet</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Start building your professional network by connecting with other professionals.
                </p>
                <Button 
                  onClick={() => setActiveTab("discover")}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Discover People
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Pending Requests Tab */}
          <TabsContent value="pending">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                  placeholder="Search pending requests" 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
            
            {isPendingLoading ? (
              // Loading skeletons
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(3).fill(0).map((_, i) => (
                  <Card key={i} className={cn(cardStyle, "p-5")}>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredPendingConnections && filteredPendingConnections.length > 0 ? (
              // Pending connection cards
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPendingConnections.map((connection) => (
                  <Card key={connection.connection.id} className={cardStyle}>
                    <CardContent className="p-5">
                      <div className="flex items-center mb-4">
                        <Avatar className="h-12 w-12 mr-3">
                          <AvatarImage 
                            src={connection.user.profileImageUrl || undefined} 
                            alt={connection.user.name} 
                          />
                          <AvatarFallback>{connection.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{connection.user.name}</h3>
                          <p className="text-sm text-gray-600 truncate max-w-[220px]">
                            {connection.user.title || "No title"}
                          </p>
                        </div>
                      </div>
                      
                      {connection.connection.message && (
                        <div className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-md">
                          "{connection.connection.message}"
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button 
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                          onClick={() => acceptConnectionMutation.mutate(connection.connection.id)}
                        >
                          <Check className="h-4 w-4 mr-1" /> Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => rejectConnectionMutation.mutate(connection.connection.id)}
                        >
                          <X className="h-4 w-4 mr-1" /> Ignore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // No pending requests
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <UserPlus size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-1">No pending requests</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  You don't have any pending connection requests at the moment.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Discover People Tab */}
          <TabsContent value="discover">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                  placeholder="Search for people" 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <Button 
                variant={filterValue === "" ? "default" : "outline"}
                className={`rounded-full ${filterValue === "" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                onClick={() => setFilterValue("")}
              >
                All
              </Button>
              <Button 
                variant={filterValue === "Tech" ? "default" : "outline"}
                className={`rounded-full ${filterValue === "Tech" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                onClick={() => setFilterValue("Tech")}
              >
                Tech
              </Button>
              <Button 
                variant={filterValue === "Design" ? "default" : "outline"}
                className={`rounded-full ${filterValue === "Design" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                onClick={() => setFilterValue("Design")}
              >
                Design
              </Button>
              <Button 
                variant={filterValue === "Management" ? "default" : "outline"}
                className={`rounded-full ${filterValue === "Management" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                onClick={() => setFilterValue("Management")}
              >
                Management
              </Button>
              <Button 
                variant={filterValue === "Data" ? "default" : "outline"}
                className={`rounded-full ${filterValue === "Data" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                onClick={() => setFilterValue("Data")}
              >
                Data
              </Button>
              <Button 
                variant={filterValue === "Marketing" ? "default" : "outline"}
                className={`rounded-full ${filterValue === "Marketing" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                onClick={() => setFilterValue("Marketing")}
              >
                Marketing
              </Button>
              <Button 
                variant={filterValue === "Recruiter" ? "default" : "outline"}
                className={`rounded-full ${filterValue === "Recruiter" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                onClick={() => setFilterValue("Recruiter")}
              >
                Recruiters
              </Button>
            </div>
            
            {isUsersLoading ? (
              // Loading skeletons
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <Card key={i} className={cn(cardStyle, "p-5")}>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              // User cards
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers
                  .filter(user => !filterValue || getUserCategory(user) === filterValue)
                  .map((user) => (
                  <Card key={user.id} className={cardStyle}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage 
                              src={user.profileImageUrl || undefined} 
                              alt={user.name} 
                            />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{user.name}</h3>
                            <p className="text-sm text-gray-600 truncate max-w-[180px]">
                              {user.title || "No title"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={() => openConnectionDialog(user)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // No users found
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-1">No users found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  We couldn't find any users matching your search criteria. Try adjusting your search.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Connection Request Dialog */}
      <Dialog open={connectionRequestDialogOpen} onOpenChange={setConnectionRequestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect with {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Send a personalized message to introduce yourself and explain why you'd like to connect.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="I'd like to connect because..."
              value={connectionMessage}
              onChange={(e) => setConnectionMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectionRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={sendConnectionRequest}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={sendConnectionMutation.isPending}
            >
              {sendConnectionMutation.isPending ? "Sending..." : "Send Connection Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}