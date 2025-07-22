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
import { Search, UserPlus, Mail, ArrowLeft, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

export default function MyNetworkPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Define states
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("connections");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [connectionRequestDialogOpen, setConnectionRequestDialogOpen] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");
  
  // Sort and filter states
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  
  // Interfaces
  interface Connection {
    connection: {
      id: number;
      requesterId: number;
      receiverId: number;
      status: string;
      createdAt: string;
    };
    user: User;
  }

  // API Queries
  const { data: connections, isLoading: loadingConnections } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !!user
  });
  
  const { data: pendingConnections, isLoading: loadingPending } = useQuery<Connection[]>({
    queryKey: ["/api/connections/pending"],
    enabled: !!user
  });

  const { data: allUsers, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user
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

  // Filter users
  const connectedUserIds = new Set(connections?.map(conn => conn.user.id) || []);
  const pendingUserIds = new Set(pendingConnections?.map(conn => conn.user.id) || []);
  
  const filteredUsers = allUsers?.filter(u => 
    (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.title?.toLowerCase().includes(searchTerm.toLowerCase())) && 
    u.id !== user?.id &&
    !connectedUserIds.has(u.id) &&
    !pendingUserIds.has(u.id)
  ) || [];

  // Get initials for avatar
  const getInitials = (name: string | null | undefined, username: string): string => {
    if (name && name.trim()) {
      return name.substring(0, 2).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  };

  // Get professional category
  const getUserCategory = (user: User): string => {
    const title = (user.title || '').toLowerCase();
    if (title.includes('engineer') || title.includes('developer')) return 'Engineering';
    if (title.includes('design') || title.includes('ux')) return 'Design';
    if (title.includes('manager') || title.includes('head') || title.includes('lead')) return 'Management';
    if (title.includes('market')) return 'Marketing';
    if (title.includes('finance') || title.includes('account')) return 'Finance';
    if (title.includes('health') || title.includes('doctor') || title.includes('nurs')) return 'Healthcare';
    if (title.includes('teach') || title.includes('professor') || title.includes('tutor')) return 'Education';
    if (title.includes('tech') || title.includes('it') || title.includes('data')) return 'Technology';
    if (title.includes('analyst')) return 'Business Analysis';
    return 'Professional';
  };
  
  // Get sorted connections
  const getSortedAndFilteredConnections = (): Connection[] => {
    if (!connections || !Array.isArray(connections)) return [];
    
    let filteredConnections = [...connections];
    
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

  // Open connection dialog with message
  const openConnectionDialog = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    setConnectionRequestDialogOpen(true);
    
    // Generate suggested message
    const suggestedMessages = [
      `Hi ${selectedUser.name || selectedUser.username}, I'd like to connect with you on Harmony.ai.`,
      `Hello ${selectedUser.name || selectedUser.username}, I noticed your profile and would love to add you to my professional network.`,
      `Hi ${selectedUser.name || selectedUser.username}, I'm building my network of ${selectedUser.title || 'professionals'} and would like to connect.`
    ];
    
    setConnectionMessage(suggestedMessages[Math.floor(Math.random() * suggestedMessages.length)]);
  };

  // Send connection request
  const handleSendConnectionRequest = () => {
    if (!selectedUser) return;
    sendConnectionMutation.mutate(selectedUser.id);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto p-6 pb-16">
          {/* Header Section */}
          <div className="flex items-center mb-8">
            <Link href="/" className="mr-4">
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-blue-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Network</h1>
              <p className="text-gray-600 mt-1">Connect and grow your professional network</p>
            </div>
          </div>
        
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Enhanced Tab Navigation */}
            <div className="mb-8">
              <div className="bg-white p-1.5 rounded-2xl shadow-lg border border-gray-100 inline-flex">
                <TabsTrigger 
                  value="connections" 
                  className="px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-700 font-medium transition-all duration-200 hover:bg-blue-50"
                >
                  My Connections
                  {connections?.length ? (
                    <span className="ml-2 bg-blue-100 data-[state=active]:bg-blue-500 text-blue-700 data-[state=active]:text-white px-2 py-0.5 rounded-full text-xs font-medium">
                      {connections.length}
                    </span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger 
                  value="pending" 
                  className="px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-700 font-medium transition-all duration-200 hover:bg-orange-50"
                >
                  Pending Requests
                  {pendingConnections?.length ? (
                    <span className="ml-2 bg-orange-100 data-[state=active]:bg-orange-500 text-orange-700 data-[state=active]:text-white px-2 py-0.5 rounded-full text-xs font-medium">
                      {pendingConnections.length}
                    </span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger 
                  value="discover" 
                  className="px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-700 font-medium transition-all duration-200 hover:bg-emerald-50"
                >
                  Discover People
                </TabsTrigger>
              </div>
            </div>
          
          {/* My Connections Tab */}
          <TabsContent value="connections">
            <div className="mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Your professional network</h3>
                <p className="text-gray-600 mb-6">
                  Connect with professionals to build your network, discover new opportunities, and stay up to date with your industry
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-blue-600">
                      {connections?.length || 0} connections
                    </span>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant={sortBy === "recent" ? "default" : "outline"}
                      size="sm" 
                      className="rounded-xl px-4 py-2"
                      onClick={() => setSortBy("recent")}
                    >
                      Most Recent
                    </Button>
                    <Button 
                      variant={sortBy === "name" ? "default" : "outline"}
                      size="sm" 
                      className="rounded-xl px-4 py-2"
                      onClick={() => setSortBy("name")}
                    >
                      By Name
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl px-4 py-2 flex items-center gap-2"
                      onClick={() => setFilterDialogOpen(true)}
                    >
                      <Filter className="h-4 w-4" />
                      Filter
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {loadingConnections ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                        <Skeleton className="h-5 w-32 mx-auto mb-2" />
                        <Skeleton className="h-4 w-24 mx-auto mb-4" />
                        <div className="flex gap-2">
                          <Skeleton className="h-8 flex-1 rounded-lg" />
                          <Skeleton className="h-8 flex-1 rounded-lg" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : connections?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {getSortedAndFilteredConnections().map((conn) => (
                  <Card key={conn.connection.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 group">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="relative mb-4">
                          <Avatar
                            className="h-16 w-16 mx-auto cursor-pointer ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all"
                            onClick={() => setLocation(`/profile/${conn.user.id}`)}
                          >
                            <AvatarImage 
                              src={conn.user.profileImageUrl || undefined} 
                              alt={conn.user.name || conn.user.username} 
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-semibold text-lg">
                              {getInitials(conn.user.name, conn.user.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white"></div>
                        </div>
                        
                        <h3 
                          className="font-semibold text-gray-900 mb-1 cursor-pointer hover:text-blue-700 transition-colors line-clamp-1"
                          onClick={() => setLocation(`/profile/${conn.user.id}`)}
                        >
                          {conn.user.name || conn.user.username}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-1">{conn.user.title || 'Professional'}</p>
                        
                        <div className="mb-4">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-200 shadow-sm">
                            {getUserCategory(conn.user)}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-500 mb-4">
                          Connected {new Date(conn.connection.createdAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                        </p>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1 rounded-lg h-9 text-xs font-medium border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:text-blue-700"
                            onClick={() => setLocation(`/messages?userId=${conn.user.id}`)}
                          >
                            <Mail className="mr-1.5 h-3.5 w-3.5" />
                            Message
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1 rounded-lg h-9 text-xs font-medium border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-300 hover:text-emerald-700"
                            onClick={() => setLocation(`/profile/${conn.user.id}`)}
                          >
                            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                            Profile
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <UserPlus className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Build your professional network</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Connect with professionals to grow your network and discover new opportunities
                </p>
                <Button
                  onClick={() => setActiveTab("discover")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  Discover People
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Pending Tab */}
          <TabsContent value="pending">
            <div className="mb-6">
              <h3 className="text-md font-medium mb-3">Pending connection requests</h3>
              <p className="text-sm text-gray-500 mb-4">
                Accept or decline connection requests from professionals
              </p>
            </div>
            {loadingPending ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-4 w-[100px]" />
                          <div className="flex gap-2 mt-3">
                            <Skeleton className="h-8 w-24 rounded-full" />
                            <Skeleton className="h-8 w-24 rounded-full" />
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
                  <Card key={conn.connection.id} className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        <Avatar className="cursor-pointer" onClick={() => setLocation(`/profile/${conn.user.id}`)}>
                          <AvatarImage 
                            src={conn.user.profileImageUrl || undefined} 
                            alt={conn.user.name || conn.user.username} 
                          />
                          <AvatarFallback>
                            {getInitials(conn.user.name, conn.user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <h3 
                            className="font-medium cursor-pointer hover:text-purple-700"
                            onClick={() => setLocation(`/profile/${conn.user.id}`)}
                          >{conn.user.name || conn.user.username}</h3>
                          <p className="text-sm text-gray-500">{conn.user.title || 'Professional'}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 mb-4">
                        <span className="text-xs bg-white text-gray-600 font-medium px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                          {getUserCategory(conn.user)}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 hover:text-white border-emerald-500"
                          onClick={() => acceptConnectionMutation.mutate(conn.connection.id)}
                          disabled={acceptConnectionMutation.isPending}
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 border-gray-300 hover:bg-gray-50"
                          onClick={() => rejectConnectionMutation.mutate(conn.connection.id)}
                          disabled={rejectConnectionMutation.isPending}
                        >
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <UserPlus className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  When professionals send you connection requests, they'll appear here for you to review
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* Discover Tab */}
          <TabsContent value="discover">
            <div className="mb-6">
              <h3 className="text-md font-medium mb-3">Discover people</h3>
              <p className="text-sm text-gray-500 mb-4">
                Find and connect with professionals in your industry
              </p>
              
              <div className="relative mb-6">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search by name, title, or skills..."
                  className="pl-9 bg-white border-gray-200 rounded-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {loadingUsers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-4 w-[100px]" />
                          <Skeleton className="h-8 w-32 mt-2 rounded-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredUsers.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((u) => (
                  <Card key={u.id} className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        <Avatar className="cursor-pointer" onClick={() => setLocation(`/profile/${u.id}`)}>
                          <AvatarImage 
                            src={u.profileImageUrl || undefined} 
                            alt={u.name || u.username} 
                          />
                          <AvatarFallback>
                            {getInitials(u.name, u.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <h3 
                            className="font-medium cursor-pointer hover:text-purple-700"
                            onClick={() => setLocation(`/profile/${u.id}`)}
                          >{u.name || u.username}</h3>
                          <p className="text-sm text-gray-500">{u.title || 'Professional'}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 mb-4">
                        <span className="text-xs text-purple-600 font-medium">
                          {getUserCategory(u)}
                        </span>
                      </div>
                      
                      <Button 
                        className="w-full bg-white text-purple-600 border border-purple-600 hover:bg-purple-50"
                        onClick={() => openConnectionDialog(u)}
                      >
                        <UserPlus className="mr-1 h-4 w-4" />
                        Connect
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Search className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-4">
                  Try adjusting your search or browse popular categories below
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                  {['Engineering', 'Design', 'Management', 'Marketing', 'Technology'].map(category => (
                    <Button
                      key={category}
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchTerm(category)}
                      className="rounded-full"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          </Tabs>
        
        {/* Connection request dialog */}
        <Dialog open={connectionRequestDialogOpen} onOpenChange={setConnectionRequestDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send connection request</DialogTitle>
              <DialogDescription>
                Add a personalized message to introduce yourself
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedUser && (
                <div className="flex items-center mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <Avatar>
                    <AvatarImage 
                      src={selectedUser.profileImageUrl || undefined} 
                      alt={selectedUser.name || selectedUser.username} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
                      {getInitials(selectedUser.name, selectedUser.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <h4 className="font-medium">{selectedUser.name || selectedUser.username}</h4>
                    <p className="text-sm text-gray-500">{selectedUser.title || 'Professional'}</p>
                  </div>
                </div>
              )}
              <Textarea
                placeholder="Your message..."
                className="min-h-[120px]"
                value={connectionMessage}
                onChange={(e) => setConnectionMessage(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setConnectionRequestDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleSendConnectionRequest}
                disabled={sendConnectionMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {sendConnectionMutation.isPending ? 'Sending...' : 'Send Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </Layout>
  );
}