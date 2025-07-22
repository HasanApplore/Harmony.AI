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

export default function NetworkPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Custom card styling
  const cardStyle = "rounded-lg shadow-sm hover:shadow-md transition-shadow";
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("connections");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [connectionRequestDialogOpen, setConnectionRequestDialogOpen] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");

  // Fetch connections
  const { data: connections, isLoading: loadingConnections } = useQuery<{connection: any, user: User}[]>({
    queryKey: ["/api/connections"],
    enabled: !!user,
    onSuccess: (data) => {
      console.log("Connections fetched:", data);
    },
    onError: (error) => {
      console.error("Error fetching connections:", error);
    }
  });
  
  // Fetch connection requests
  const { data: pendingConnections, isLoading: loadingPending } = useQuery<{connection: any, user: User}[]>({
    queryKey: ["/api/connections/pending"],
    enabled: !!user,
    onSuccess: (data) => {
      console.log("Pending connections fetched:", data);
    },
    onError: (error) => {
      console.error("Error fetching pending connections:", error);
    }
  });

  // Fetch users for suggestions
  const { data: allUsers, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
    onSuccess: (data) => {
      console.log("Users fetched:", data);
    },
    onError: (error) => {
      console.error("Error fetching users:", error);
    }
  });

  // Send connection request mutation
  const sendConnectionMutation = useMutation({
    mutationFn: async (receiverId: number) => {
      const res = await apiRequest("POST", "/api/connections", {
        receiverId
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      toast({
        title: "Connection request sent",
        description: "Your connection request has been sent successfully."
      });
      setConnectionRequestDialogOpen(false);
      setConnectionMessage("");
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to send request",
        description: error instanceof Error ? error.message : "Failed to send connection request",
        variant: "destructive",
      });
    },
  });

  // Accept connection request mutation
  const acceptConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      const res = await apiRequest("PATCH", `/api/connections/${connectionId}`, {
        status: "accepted"
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      toast({
        title: "Connection accepted",
        description: "You've successfully accepted the connection request."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to accept connection",
        description: error instanceof Error ? error.message : "Failed to accept connection request",
        variant: "destructive",
      });
    },
  });

  // Reject connection request mutation
  const rejectConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      const res = await apiRequest("PATCH", `/api/connections/${connectionId}`, {
        status: "rejected"
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      toast({
        title: "Connection rejected",
        description: "You've rejected the connection request."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to reject connection",
        description: error instanceof Error ? error.message : "Failed to reject connection request",
        variant: "destructive",
      });
    },
  });

  // Filter users based on search term and exclude those already connected
  const connectedUserIds = new Set(connections?.map(conn => conn.user.id) || []);
  const pendingUserIds = new Set(pendingConnections?.map(conn => conn.user.id) || []);
  
  const filteredUsers = allUsers?.filter(u => 
    // Search term filter
    (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.title?.toLowerCase().includes(searchTerm.toLowerCase())) && 
    // Exclude current user
    u.id !== user?.id &&
    // Exclude already connected users
    !connectedUserIds.has(u.id) &&
    // Exclude users with pending connection requests
    !pendingUserIds.has(u.id)
  );

  // Get initials for avatar fallback
  const getInitials = (name: string | null | undefined, username: string): string => {
    if (name && name.trim()) {
      return name.substring(0, 2).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  };

  // Function to open connection request dialog
  const openConnectionDialog = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    setConnectionRequestDialogOpen(true);
    
    // Generate AI suggested message
    const suggestedMessages = [
      `Hi ${selectedUser.name || selectedUser.username}, I'd like to connect with you on Harmony.ai.`,
      `Hello ${selectedUser.name || selectedUser.username}, I noticed your profile and would love to add you to my professional network.`,
      `Hi ${selectedUser.name || selectedUser.username}, I'm building my network of ${selectedUser.title || 'professionals'} and would like to connect.`
    ];
    
    setConnectionMessage(suggestedMessages[Math.floor(Math.random() * suggestedMessages.length)]);
  };

  // Handle sending connection request
  const handleSendConnectionRequest = () => {
    if (!selectedUser) return;
    sendConnectionMutation.mutate(selectedUser.id);
  };

  return (
    <Layout>
      <div className="p-4 pb-16">
        <h1 className="text-2xl font-bold mb-6">My Network</h1>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-8">
            <TabsList className="bg-white p-1 rounded-full shadow-md w-auto inline-flex border border-gray-100">
              <TabsTrigger 
                value="connections" 
                className="px-6 py-2 rounded-full data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-700 text-sm font-medium transition-colors"
              >
                My Connections
              </TabsTrigger>
              <TabsTrigger 
                value="pending" 
                className="px-6 py-2 rounded-full data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-700 text-sm font-medium transition-colors"
              >
                Pending Requests {pendingConnections?.length ? `(${pendingConnections.length})` : ''}
              </TabsTrigger>
              <TabsTrigger 
                value="discover" 
                className="px-6 py-2 rounded-full data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-700 text-sm font-medium transition-colors"
              >
                Discover People
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* My Connections Tab */}
          <TabsContent value="connections">
            <div className="mb-6">
              <h3 className="text-md font-medium mb-3">Your professional network</h3>
              <p className="text-sm text-gray-500 mb-4">
                Connect with professionals to grow your network and discover new opportunities
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Button variant="outline" size="sm" className="rounded-full">
                  Sort by Recent
                </Button>
                <Button variant="outline" size="sm" className="rounded-full">
                  Sort by Name
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  Filter
                </Button>
              </div>
            </div>
            
            {loadingConnections ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-4 w-[100px]" />
                          <Skeleton className="h-8 w-24 mt-2 rounded-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : connections?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connections.map((conn) => (
                  <Card key={conn.connection.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarImage 
                            src={conn.user.profileImageUrl || undefined} 
                            alt={conn.user.name || conn.user.username} 
                          />
                          <AvatarFallback>
                            {getInitials(conn.user.name, conn.user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{conn.user.name || conn.user.username}</h3>
                          <p className="text-sm text-gray-500">{conn.user.title || 'Professional'}</p>
                          
                          <div className="mt-2">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mr-1">
                              {conn.user.title?.includes('Engineer') ? 'Engineering' : 
                               conn.user.title?.includes('Manager') ? 'Management' : 
                               conn.user.title?.includes('Design') ? 'Design' : 'Professional'}
                            </Badge>
                          </div>
                          
                          <p className="text-sm mt-2 text-gray-600">
                            Connected since {new Date(conn.connection.createdAt).toLocaleDateString()}
                          </p>
                          
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" className="rounded-full">
                              <Mail className="mr-1 h-4 w-4" />
                              Message
                            </Button>
                            <Button size="sm" variant="ghost" className="rounded-full">
                              <UserPlus className="mr-1 h-4 w-4" />
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-16">
                <h3 className="text-lg font-medium mb-2">No connections yet</h3>
                <p className="text-gray-500 mb-6">Start connecting with professionals on Harmony.ai</p>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 rounded-full px-6 py-2 text-white font-medium text-sm" 
                  onClick={() => setActiveTab("discover")}
                >
                  Discover People
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Pending Requests Tab */}
          <TabsContent value="pending">
            <div className="mb-6">
              <h3 className="text-md font-medium mb-3">Connection requests</h3>
              <p className="text-sm text-gray-500 mb-4">
                Review and respond to professionals who want to connect with you
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-purple-600 font-medium">
                  {pendingConnections?.length || 0} pending connection requests
                </span>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-full">
                    Sort by Date
                  </Button>
                </div>
              </div>
            </div>
            
            {loadingPending ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-4 w-[100px]" />
                          <div className="flex gap-2 mt-3">
                            <Skeleton className="h-8 w-20 rounded-full" />
                            <Skeleton className="h-8 w-20 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pendingConnections?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingConnections.map((conn) => (
                  <Card key={conn.connection.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarImage 
                            src={conn.user.profileImageUrl || undefined} 
                            alt={conn.user.name || conn.user.username} 
                          />
                          <AvatarFallback>
                            {getInitials(conn.user.name, conn.user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{conn.user.name || conn.user.username}</h3>
                          <p className="text-sm text-gray-500">{conn.user.title || 'Professional'}</p>
                          
                          <div className="mt-2">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mr-1">
                              {conn.user.title?.includes('Engineer') ? 'Engineering' : 
                               conn.user.title?.includes('Manager') ? 'Management' : 
                               conn.user.title?.includes('Design') ? 'Design' : 'Professional'}
                            </Badge>
                          </div>
                          
                          <p className="text-sm mt-2 text-gray-600">
                            Requested to connect {new Date(conn.connection.createdAt).toLocaleDateString()}
                          </p>
                          
                          <div className="flex mt-3 space-x-2">
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="bg-green-600 hover:bg-green-700 rounded-full"
                              onClick={() => acceptConnectionMutation.mutate(conn.connection.id)}
                            >
                              <Check className="mr-1 h-4 w-4" />
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-300 text-red-600 hover:bg-red-50 rounded-full"
                              onClick={() => rejectConnectionMutation.mutate(conn.connection.id)}
                            >
                              <X className="mr-1 h-4 w-4" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-16">
                <h3 className="text-lg font-medium mb-2">No pending requests</h3>
                <p className="text-gray-500">When someone sends you a connection request, it will appear here</p>
              </div>
            )}
          </TabsContent>

          {/* Discover People Tab */}
          <TabsContent value="discover">
            <div className="mb-6">
              <h3 className="text-md font-medium mb-3">Find professionals to connect with</h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search professionals by name or role..."
                  className="pl-10 bg-white border-gray-200 rounded-full shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Button variant="outline" size="sm" className="rounded-full">
                  All Professionals
                </Button>
                <Button variant="outline" size="sm" className="rounded-full">
                  Data Science
                </Button>
                <Button variant="outline" size="sm" className="rounded-full">
                  Software Engineering
                </Button>
                <Button variant="outline" size="sm" className="rounded-full">
                  Marketing
                </Button>
                <Button variant="outline" size="sm" className="rounded-full">
                  Product Management
                </Button>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500">{filteredUsers?.length || 0} professionals found</span>
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  Filter
                </Button>
              </div>
            </div>
            
            {loadingUsers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-4 w-[100px]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredUsers?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage 
                            src={user.profileImageUrl || undefined} 
                            alt={user.name || user.username} 
                          />
                          <AvatarFallback>
                            {getInitials(user.name, user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{user.name || user.username}</h3>
                          <p className="text-sm text-gray-500">{user.title || 'Professional'}</p>
                          <Button 
                            size="sm" 
                            className="mt-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={() => openConnectionDialog(user)}
                          >
                            <UserPlus className="mr-1 h-4 w-4" />
                            Connect
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-16">
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Connection Request Dialog */}
      <Dialog open={connectionRequestDialogOpen} onOpenChange={setConnectionRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect with {selectedUser?.name || selectedUser?.username}</DialogTitle>
            <DialogDescription>
              Send a personalized message to introduce yourself.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-4 mb-4">
            <Avatar>
              <AvatarImage 
                src={selectedUser?.profileImageUrl || undefined} 
                alt={selectedUser?.name || selectedUser?.username || 'User'} 
              />
              <AvatarFallback>
                {selectedUser && getInitials(selectedUser.name, selectedUser.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{selectedUser?.name || selectedUser?.username}</h3>
              <p className="text-sm text-gray-500">{selectedUser?.title || 'Professional'}</p>
            </div>
          </div>
          
          <Textarea
            placeholder="Write a personalized message..."
            className="w-full"
            value={connectionMessage}
            onChange={(e) => setConnectionMessage(e.target.value)}
            rows={4}
          />
          
          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={() => setConnectionRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendConnectionRequest}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}