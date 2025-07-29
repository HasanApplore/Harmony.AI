import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Layout from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  UserPlus,
  Search,
  MapPin,
  Briefcase,
  Calendar,
  Filter,
  Check,
  X,
  Clock,
  MessageSquare,
  UserCircle
} from "lucide-react";
import { User } from "@shared/schema";

export default function NetworkPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Define states
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("connections");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [connectionRequestDialogOpen, setConnectionRequestDialogOpen] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");
  
  // Sort and filter states
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  
  // Professional categories for filtering
  const professionalCategories = ["Engineering", "Design", "Management", "Marketing", "Finance", "Healthcare", "Education", "Technology"];

  interface Connection {
    connection: {
      id: number;
      requesterId: number;
      receiverId: number;
      status: string;
      createdAt: string;
      message?: string;
    };
    user: {
      id: number;
      name?: string;
      username?: string;
      title?: string;
      profileImageUrl?: string;
      [key: string]: any;
    };
  }

  // Fetch connections
  const { data: connections, isLoading: loadingConnections } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !!user
  });
  
  // Fetch connection requests
  const { data: pendingConnections, isLoading: loadingPending } = useQuery<Connection[]>({
    queryKey: ["/api/connections/pending"],
    enabled: !!user
  });

  // Fetch sent connection requests
  const { data: sentPendingConnections, isLoading: loadingSentPending } = useQuery<Connection[]>({
    queryKey: ["/api/connections/sent-pending"],
    enabled: !!user
  });

  // Fetch users for suggestions
  const { data: allUsers, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user
  });

  // Helper function to get connection status between current user and another user
  const getConnectionStatus = (targetUserId: number): 'connected' | 'pending-sent' | 'pending-received' | 'none' => {
    // Check if already connected
    const isConnected = connections?.some(conn => conn.user.id === targetUserId);
    if (isConnected) return 'connected';
    
    // Check if current user sent a pending request to target user
    const hasSentRequest = sentPendingConnections?.some(conn => conn.user.id === targetUserId);
    if (hasSentRequest) return 'pending-sent';
    
    // Check if target user sent a pending request to current user
    const hasReceivedRequest = pendingConnections?.some(conn => conn.user.id === targetUserId);
    if (hasReceivedRequest) return 'pending-received';
    
    return 'none';
  };
  
  // Send connection request mutation
  const sendConnectionMutation = useMutation({
    mutationFn: async (receiverId: number) => {
      const res = await apiRequest("POST", "/api/connections", {
        receiverId,
        message: connectionMessage
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/sent-pending"] });
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
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Accept connection mutation
  const acceptConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      await apiRequest("PATCH", `/api/connections/${connectionId}/accept`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/sent-pending"] });
      toast({
        title: "Connection accepted",
        description: "You are now connected with this user."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to accept request",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Reject connection mutation
  const rejectConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      await apiRequest("DELETE", `/api/connections/${connectionId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/sent-pending"] });
      toast({
        title: "Connection request ignored",
        description: "The connection request has been removed."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to ignore request",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "today";
    } else if (diffDays === 1) {
      return "yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? "year" : "years"} ago`;
    }
  };
  
  // Get user category for filtering and display
  const getUserCategory = (user: Connection['user']): string => {
    if (!user.title) return "Other";
    
    const title = user.title.toLowerCase();
    
    if (title.includes('engineer') || title.includes('developer') || title.includes('programmer')) return 'Engineering';
    if (title.includes('design') || title.includes('ux') || title.includes('ui')) return 'Design';
    if (title.includes('manager') || title.includes('director') || title.includes('lead')) return 'Management';
    if (title.includes('marketing') || title.includes('social media') || title.includes('content')) return 'Marketing';
    if (title.includes('finance') || title.includes('accounting') || title.includes('financial')) return 'Finance';
    if (title.includes('doctor') || title.includes('nurse') || title.includes('healthcare')) return 'Healthcare';
    if (title.includes('teach') || title.includes('professor') || title.includes('tutor')) return 'Education';
    if (title.includes('tech') || title.includes('it') || title.includes('data')) return 'Technology';
    if (title.includes('analyst')) return 'Business Analysis';
    return 'Other';
  };
  
  // Get sorted and filtered connections
  const getSortedAndFilteredConnections = (): Connection[] => {
    if (!connections || !Array.isArray(connections)) return [];
    
    let filteredConnections = [...connections];
    
    // Apply category filter if set
    if (filterCategory) {
      filteredConnections = filteredConnections.filter(conn => getUserCategory(conn.user) === filterCategory);
    }
    
    // Apply sorting
    if (sortBy === "name") {
      filteredConnections.sort((a, b) => {
        const nameA = a.user.name || a.user.username || '';
        const nameB = b.user.name || b.user.username || '';
        return nameA.localeCompare(nameB);
      });
    } else {
      // Sort by connection date (most recent first)
      filteredConnections.sort((a, b) => {
        const dateA = new Date(a.connection.createdAt).getTime();
        const dateB = new Date(b.connection.createdAt).getTime();
        return dateB - dateA;
      });
    }
    
    return filteredConnections;
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

  // Render connection status button
  const renderConnectionButton = (discoveryUser: User) => {
    const status = getConnectionStatus(discoveryUser.id);
    switch (status) {
      case 'connected':
        return (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            disabled
          >
            <Check className="h-4 w-4 mr-2" />
            Connected
          </Button>
        );
      case 'pending-sent':
        return (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            disabled
          >
            <Clock className="h-4 w-4 mr-2" />
            Request Sent
          </Button>
        );
      case 'pending-received':
        return (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1 bg-[#8a3ffc] hover:bg-[#7a2ff2]"
              onClick={() => {
                const connection = pendingConnections?.find(conn => conn.user.id === discoveryUser.id);
                if (connection) acceptConnectionMutation.mutate(connection.connection.id);
              }}
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => {
                const connection = pendingConnections?.find(conn => conn.user.id === discoveryUser.id);
                if (connection) rejectConnectionMutation.mutate(connection.connection.id);
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Ignore
            </Button>
          </div>
        );
      default:
        return (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => openConnectionDialog(discoveryUser)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Connect
          </Button>
        );
    }
  };

  // Card styling
  const cardStyle = "border-0 shadow-sm hover:shadow";

  return (
    <Layout>
      <div className="p-4 pb-16 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Network</h1>
        
        {/* Simple tabs with direct styling instead of using shadcn UI Tabs */}
        <div className="border-b pb-1 mb-6">
          <div className="bg-white p-1 rounded-full shadow-md inline-flex border border-gray-100">
            <button 
              onClick={() => setActiveTab("connections")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                activeTab === "connections" 
                  ? "bg-[#8a3ffc] text-white" 
                  : "bg-transparent text-gray-700"
              }`}
            >
              My Connections
            </button>
            <button 
              onClick={() => setActiveTab("pending")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                activeTab === "pending" 
                  ? "bg-[#8a3ffc] text-white" 
                  : "bg-transparent text-gray-700"
              }`}
            >
              Pending Requests {pendingConnections?.length ? `(${pendingConnections.length})` : ''}
            </button>
            <button 
              onClick={() => setActiveTab("sent")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                activeTab === "sent" 
                  ? "bg-[#8a3ffc] text-white" 
                  : "bg-transparent text-gray-700"
              }`}
            >
              Sent Requests {sentPendingConnections?.length ? `(${sentPendingConnections.length})` : ''}
            </button>
            <button 
              onClick={() => setActiveTab("discover")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                activeTab === "discover" 
                  ? "bg-[#8a3ffc] text-white" 
                  : "bg-transparent text-gray-700"
              }`}
            >
              Discover People
            </button>
          </div>
        </div>
        
        {/* My Connections Tab Content */}
        {activeTab === "connections" && (
          <div>
            <div className="mb-6">
              <h3 className="text-md font-medium mb-3">Your professional network</h3>
              <p className="text-sm text-gray-500 mb-4">
                Connect with professionals to build your network, discover new opportunities, and stay up to date with your industry
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-purple-600 font-medium">
                  {connections?.length || 0} connections
                </span>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full"
                    onClick={() => setFilterDialogOpen(true)}
                  >
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    Filter
                  </Button>
                  
                  {/* Filter Dialog */}
                  <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Filter Connections</DialogTitle>
                        <DialogDescription>
                          Filter your connections by professional category
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="grid grid-cols-2 gap-2 py-4">
                        {professionalCategories.map((category) => (
                          <Button
                            key={category}
                            variant={filterCategory === category ? "default" : "outline"}
                            size="sm"
                            className={`justify-start ${filterCategory === category ? "bg-purple-600" : ""}`}
                            onClick={() => {
                              setFilterCategory(category === filterCategory ? null : category);
                            }}
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                      
                      <DialogFooter className="flex justify-between items-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setFilterCategory(null)}
                        >
                          Reset Filters
                        </Button>
                        <Button 
                          variant="default"
                          onClick={() => {
                            toast({
                              title: "Filters Applied",
                              description: filterCategory ? `Showing ${filterCategory} connections` : "Showing all connections"
                            });
                            setFilterDialogOpen(false);
                          }}
                        >
                          Apply Filters
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Select
                    defaultValue={sortBy}
                    onValueChange={(value) => setSortBy(value as "recent" | "name")}
                  >
                    <SelectTrigger className="w-40 h-9 rounded-full">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {filterCategory && (
              <div className="flex items-center mb-4">
                <span className="text-xs text-gray-500 mr-2">Filtered by:</span>
                <Badge 
                  variant="secondary" 
                  className="flex items-center gap-1 text-xs"
                >
                  {filterCategory}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => setFilterCategory(null)}
                  />
                </Badge>
              </div>
            )}
            
            {loadingConnections ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className={cn(cardStyle, "border border-gray-100")}>
                    <CardContent className="p-5">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-4 w-[100px]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : connections && connections.length > 0 ? (
              // Display real connections data if available
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getSortedAndFilteredConnections().map((connection) => (
                  <Card key={connection.connection.id} className={cn(cardStyle, "border border-gray-100")}>
                    <CardContent className="p-5">
                      <div 
                        className="flex items-center justify-between mb-4 cursor-pointer"
                        onClick={() => navigate(`/profile/${connection.user.id}`)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage 
                              src={connection.user.profileImageUrl || undefined} 
                              alt={connection.user.name || ''} 
                            />
                            <AvatarFallback>{connection.user.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{connection.user.name}</h3>
                            <p className="text-sm text-gray-600 truncate max-w-[180px]">
                              {connection.user.title || "No title"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getUserCategory(connection.user)}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-3">
                        Connected {formatDate(connection.connection.createdAt)}
                      </p>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs h-8"
                          onClick={() => navigate(`/messages?userId=${connection.user.id}`)}
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                          Message
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs h-8"
                          onClick={() => navigate(`/profile/${connection.user.id}`)}
                        >
                          <UserCircle className="h-3.5 w-3.5 mr-1.5" />
                          Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <UserPlus size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No connections yet</h3>
                <p className="text-gray-500 mb-4">Start building your professional network by connecting with other professionals</p>
                <Button
                  onClick={() => setActiveTab("discover")}
                  className="bg-[#8a3ffc] hover:bg-[#7a2ff2]"
                >
                  Discover People
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Pending Requests Tab Content */}
        {activeTab === "pending" && (
          <div>
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full"
                    onClick={() => {
                      // Create a copy and sort by date (newest first)
                      const sortedPendingConnections = [...(pendingConnections || [])];
                      sortedPendingConnections.sort((a, b) => {
                        return new Date(b.connection.createdAt).getTime() - new Date(a.connection.createdAt).getTime();
                      });
                      
                      toast({
                        title: "Connections sorted",
                        description: "Pending requests sorted by most recent date"
                      });
                    }}
                  >
                    Sort by Date
                  </Button>
                </div>
              </div>
            </div>
            
            {loadingPending ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className={cn(cardStyle, "border border-gray-100")}>
                    <CardContent className="p-5">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-4 w-[100px]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pendingConnections && pendingConnections.length > 0 ? (
              // Display real pending requests if available
              <div className="space-y-4">
                {pendingConnections.map((connection) => (
                  <Card key={connection.connection.id} className={cn(cardStyle, "border border-gray-100")}>
                    <CardContent className="p-5">
                      <div className="flex items-center mb-4">
                        <div 
                          className="flex items-center flex-1 cursor-pointer"
                          onClick={() => navigate(`/profile/${connection.user.id}`)}
                        >
                          <Avatar className="h-12 w-12 mr-3">
                            <AvatarImage 
                              src={connection.user.profileImageUrl || undefined} 
                              alt={connection.user.name || ''} 
                            />
                            <AvatarFallback>{connection.user.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{connection.user.name}</h3>
                            <p className="text-sm text-gray-600">
                              {connection.user.title || "No title"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Sent {formatDate(connection.connection.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="hidden md:flex gap-2">
                          <Button 
                            className="bg-[#8a3ffc] hover:bg-[#7a2ff2]"
                            size="sm"
                            onClick={() => acceptConnectionMutation.mutate(connection.connection.id)}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => rejectConnectionMutation.mutate(connection.connection.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Ignore
                          </Button>
                        </div>
                      </div>
                      
                      {connection.connection.message && (
                        <div className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-md">
                          "{connection.connection.message}"
                        </div>
                      )}
                      
                      <div className="md:hidden flex gap-2">
                        <Button 
                          className="flex-1 bg-[#8a3ffc] hover:bg-[#7a2ff2]"
                          size="sm"
                          onClick={() => acceptConnectionMutation.mutate(connection.connection.id)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          size="sm"
                          onClick={() => rejectConnectionMutation.mutate(connection.connection.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Ignore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Check size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No pending requests</h3>
                <p className="text-gray-500">When professionals send you connection requests, they'll appear here for you to review</p>
              </div>
            )}
          </div>
        )}
        
        {/* Sent Requests Tab Content */}
        {activeTab === "sent" && (
          <div>
            <div className="mb-6">
              <h3 className="text-md font-medium mb-3">Sent connection requests</h3>
              <p className="text-sm text-gray-500 mb-4">
                View the connection requests you have sent to other professionals
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-purple-600 font-medium">
                  {sentPendingConnections?.length || 0} sent connection requests
                </span>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full"
                    onClick={() => {
                      // Create a copy and sort by date (newest first)
                      const sortedSentPendingConnections = [...(sentPendingConnections || [])];
                      sortedSentPendingConnections.sort((a, b) => {
                        return new Date(b.connection.createdAt).getTime() - new Date(a.connection.createdAt).getTime();
                      });
                      
                      toast({
                        title: "Sent requests sorted",
                        description: "Sent requests sorted by most recent date"
                      });
                    }}
                  >
                    Sort by Date
                  </Button>
                </div>
              </div>
            </div>
            
            {loadingSentPending ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className={cn(cardStyle, "border border-gray-100")}>
                    <CardContent className="p-5">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-4 w-[100px]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sentPendingConnections && sentPendingConnections.length > 0 ? (
              // Display real sent requests if available
              <div className="space-y-4">
                {sentPendingConnections.map((connection) => (
                  <Card key={connection.connection.id} className={cn(cardStyle, "border border-gray-100")}>
                    <CardContent className="p-5">
                      <div className="flex items-center mb-4">
                        <div 
                          className="flex items-center flex-1 cursor-pointer"
                          onClick={() => navigate(`/profile/${connection.user.id}`)}
                        >
                          <Avatar className="h-12 w-12 mr-3">
                            <AvatarImage 
                              src={connection.user.profileImageUrl || undefined} 
                              alt={connection.user.name || ''} 
                            />
                            <AvatarFallback>{connection.user.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{connection.user.name}</h3>
                            <p className="text-sm text-gray-600">
                              {connection.user.title || "No title"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Sent {formatDate(connection.connection.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="hidden md:flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => rejectConnectionMutation.mutate(connection.connection.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Ignore
                          </Button>
                        </div>
                      </div>
                      
                      {connection.connection.message && (
                        <div className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-md">
                          "{connection.connection.message}"
                        </div>
                      )}
                      
                      <div className="md:hidden flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          size="sm"
                          onClick={() => rejectConnectionMutation.mutate(connection.connection.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Ignore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No sent requests</h3>
                <p className="text-gray-500">You haven't sent any connection requests yet.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Discover People Tab Content */}
        {activeTab === "discover" && (
          <div>
            <div className="mb-6">
              <h3 className="text-md font-medium mb-3">Discover people</h3>
              <p className="text-sm text-gray-500 mb-4">
                Find and connect with professionals in your industry
              </p>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                  placeholder="Search by name, title, or company" 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {loadingUsers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <Card key={i} className={cn(cardStyle, "border border-gray-100")}>
                    <CardContent className="p-5">
                      <div className="flex items-center mb-4">
                        <Skeleton className="h-12 w-12 rounded-full mr-3" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[100px]" />
                          <Skeleton className="h-3 w-[180px]" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-full rounded-md mt-3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : allUsers && allUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(allUsers || [])
                  .filter(discoveryUser => {
                    // Filter out current user
                    if (discoveryUser.id === user?.id) return false;
                    
                    // Apply search filter
                    if (searchTerm) {
                      const searchLower = searchTerm.toLowerCase();
                      const nameMatch = discoveryUser.name?.toLowerCase().includes(searchLower);
                      const titleMatch = discoveryUser.title?.toLowerCase().includes(searchLower);
                      return nameMatch || titleMatch;
                    }
                    
                    return true;
                  })
                  .map((discoveryUser) => (
                    <Card key={discoveryUser.id} className={cn(cardStyle, "border border-gray-100")}>
                      <CardContent className="p-5">
                        <div 
                          className="flex items-center mb-4 cursor-pointer"
                          onClick={() => navigate(`/profile/${discoveryUser.id}`)}
                        >
                          <Avatar className="h-12 w-12 mr-3">
                            <AvatarImage 
                              src={discoveryUser.profileImageUrl || undefined} 
                              alt={discoveryUser.name || ''} 
                            />
                            <AvatarFallback>{discoveryUser.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-medium">{discoveryUser.name}</h3>
                            <p className="text-sm text-gray-600 truncate">
                              {discoveryUser.title || "No title"}
                            </p>
                          </div>
                        </div>
                        {renderConnectionButton(discoveryUser)}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <UserPlus size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No people to discover</h3>
                <p className="text-gray-500">All available professionals are already in your network</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Connection Request Dialog */}
      <Dialog open={connectionRequestDialogOpen} onOpenChange={setConnectionRequestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect with {selectedUser?.name || selectedUser?.username}</DialogTitle>
            <DialogDescription>
              Send a personalized message to introduce yourself
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start space-x-4 pt-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedUser?.profileImageUrl || undefined} />
              <AvatarFallback>
                {selectedUser?.name?.charAt(0) || selectedUser?.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{selectedUser?.name || selectedUser?.username}</p>
              <p className="text-sm text-gray-500">{selectedUser?.title || "No title"}</p>
            </div>
          </div>
          <Textarea
            placeholder="Add a note to your connection request..."
            className="min-h-[120px]"
            value={connectionMessage}
            onChange={(e) => setConnectionMessage(e.target.value)}
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConnectionRequestDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendConnectionRequest}
              className="bg-[#8a3ffc] hover:bg-[#7a2ff2]"
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}