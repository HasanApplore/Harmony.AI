import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { User, Message, InsertMessage } from "@shared/schema";
import { Search, Send, ChevronDown, Paperclip, Image, File, X, MoreVertical, Phone, Video, Info, ArrowLeft, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get URL parameters to check if we should open a specific conversation
  const getUrlParams = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('userId');
    }
    return null;
  };

  // Fetch all users (needed to find a specific user by ID)
  const { data: allUsers, isLoading: loadingAllUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && !!getUrlParams(),
  });

  // Fetch user connections to use as contacts
  const { data: connections, isLoading: loadingConnections } = useQuery<{connection: any, user: User}[]>({
    queryKey: ["/api/connections"],
    enabled: !!user,
  });

  // Fetch messages between current user and selected contact
  const { data: messages, isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: [`/api/messages/${selectedContact?.id}`],
    enabled: !!user && !!selectedContact,
    refetchInterval: selectedContact ? 5000 : false, // Poll for new messages every 5 seconds when a contact is selected
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: InsertMessage) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate messages query to refresh the conversation
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedContact?.id}`] });
      setMessageText("");
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Failed to send your message",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Handle opening specific conversation based on URL parameters
  useEffect(() => {
    const targetUserId = getUrlParams();
    
    if (targetUserId && connections) {
      // First check if the user is in our connections
      const targetConnection = connections.find(conn => conn.user.id === parseInt(targetUserId));
      
      if (targetConnection) {
        // If found in connections, set as selected contact
        setSelectedContact(targetConnection.user);
      } else if (allUsers) {
        // If not in connections but we have user data, find them and set as selected
        const targetUser = allUsers.find(u => u.id === parseInt(targetUserId));
        if (targetUser) {
          setSelectedContact(targetUser);
        }
      }
    }
  }, [connections, allUsers]);

  // Handle file selection
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setFilePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Show file icon for non-images
      setFilePreview('file');
    }
  };
  
  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!user || !selectedContact || (!messageText.trim() && !selectedFile)) return;
    
    // For now, we'll just mention the file in the message
    // In a real implementation, you would upload the file to a server
    let content = messageText.trim();
    
    if (selectedFile) {
      // Append file information to the message
      if (content) {
        content += `\n[Attached file: ${selectedFile.name}]`;
      } else {
        content = `[Attached file: ${selectedFile.name}]`;
      }
    }
    
    sendMessageMutation.mutate({
      senderId: user.id,
      receiverId: selectedContact.id,
      content: content
    });
    
    // Clear the file after sending
    clearSelectedFile();
  };

  // Filter contacts based on search term
  const filteredContacts = connections?.filter(conn => 
    conn.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    conn.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.user.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex h-[calc(100vh-80px)] bg-gray-50">
        {/* Contacts sidebar */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 bg-white border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contacts..."
                className="pl-10 bg-gray-50 border-gray-200 rounded-lg focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
            
            <div className="flex-1 overflow-y-auto">
              {loadingConnections ? (
                <div className="p-3 space-y-3">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              ) : (
                <>
                  {filteredContacts && filteredContacts.length > 0 ? (
                    <div className="space-y-1 p-2">
                      {filteredContacts.map(conn => (
                        <div 
                          key={conn.connection.id}
                          className={cn(
                            "flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200",
                            selectedContact?.id === conn.user.id && "bg-green-50 border-l-4 border-green-500"
                          )}
                          onClick={() => setSelectedContact(conn.user)}
                        >
                          <div className="relative">
                            <Avatar className="h-12 w-12 mr-3">
                              <AvatarImage src={conn.user.profileImageUrl || ""} alt={conn.user.name || conn.user.username} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                {conn.user.name?.substring(0, 2).toUpperCase() || conn.user.username?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {/* Online status indicator */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-center">
                              <h3 className="font-semibold text-gray-900 truncate">{conn.user.name || conn.user.username}</h3>
                              <span className="text-xs text-gray-500 font-medium">12m</span>
                            </div>
                            <p className="text-sm text-gray-600 truncate mt-0.5">
                              {conn.user.title || "Hey there! I'm using Harmony.ai"}
                            </p>
                          </div>
                          {/* Unread message indicator */}
                          <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">
                        {searchTerm 
                          ? "No contacts match your search" 
                          : "No connections available. Connect with professionals to start messaging."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Chat area */}
          <div className="flex-1 flex flex-col h-full bg-white">
            {selectedContact ? (
              <>
                {/* Chat header - WhatsApp style */}
                <div className="bg-purple-600 text-white p-4 flex items-center justify-between shadow-md">
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-white hover:bg-purple-700 mr-2"
                      onClick={() => setSelectedContact(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={selectedContact.profileImageUrl || ""} alt={selectedContact.name || selectedContact.username} />
                      <AvatarFallback className="bg-white text-purple-600 font-semibold">
                        {selectedContact.name?.substring(0, 2).toUpperCase() || selectedContact.username?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-white">{selectedContact.name || selectedContact.username}</h3>
                      <p className="text-sm text-purple-200">{selectedContact.title || "Professional"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-purple-700">
                      <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-purple-700">
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-purple-700">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                {/* Messages - WhatsApp style background */}
                <div 
                  className="flex-1 overflow-y-auto p-4" 
                  style={{ backgroundColor: '#ece5dd' }}
                >
                  {loadingMessages ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-2/3" />
                      <Skeleton className="h-12 w-2/3 ml-auto" />
                      <Skeleton className="h-12 w-2/3" />
                    </div>
                  ) : (
                    <>
                      {messages && messages.length > 0 ? (
                        <div className="space-y-2">
                          {messages.map((message, index) => {
                            const isOwnMessage = message.senderId === user?.id;
                            const previousMessage = index > 0 ? messages[index - 1] : null;
                            const showSenderName = !isOwnMessage && (!previousMessage || previousMessage.senderId !== message.senderId);
                            
                            return (
                              <div key={message.id}>
                                {/* Sender name and avatar for message groups */}
                                {showSenderName && (
                                  <div className="flex items-center mb-1 ml-2">
                                    <Avatar className="h-6 w-6 mr-2">
                                      <AvatarImage src={selectedContact.profileImageUrl || ""} alt={selectedContact.name || selectedContact.username} />
                                      <AvatarFallback className="bg-gray-400 text-white text-xs">
                                        {selectedContact.name?.substring(0, 2).toUpperCase() || selectedContact.username?.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-gray-700">
                                      {selectedContact.name || selectedContact.username}
                                    </span>
                                  </div>
                                )}
                                
                                <div 
                                  className={cn(
                                    "flex mb-1",
                                    isOwnMessage ? "justify-end" : "justify-start"
                                  )}
                                >
                                  {/* "You" label for own messages */}
                                  {isOwnMessage && (
                                    <div className="text-right mr-2">
                                      <span className="text-xs text-gray-600 font-medium">You</span>
                                    </div>
                                  )}
                                  
                                  <div 
                                    className={cn(
                                      "max-w-[75%] px-3 py-2 shadow-sm",
                                      isOwnMessage 
                                        ? "bg-purple-500 text-white" 
                                        : "bg-white text-gray-800"
                                    )}
                                    style={{
                                      borderRadius: isOwnMessage 
                                        ? "18px 18px 4px 18px" 
                                        : "18px 18px 18px 4px"
                                    }}
                                  >
                                {/* Render message content with support for file attachments */}
                                {message.content.includes('[Attached file:') ? (
                                  <>
                                    {message.content.split('\n').map((line, i) => (
                                      <div key={i}>
                                        {line.includes('[Attached file:') ? (
                                          <div className="flex items-center mt-1 p-2 bg-gray-100 rounded">
                                            <File className="h-4 w-4 mr-2 text-primary-500" />
                                            <span className="text-xs">{line.replace('[Attached file:', '').replace(']', '')}</span>
                                          </div>
                                        ) : (
                                          <p>{line}</p>
                                        )}
                                      </div>
                                    ))}
                                  </>
                                ) : (
                                  <p>{message.content}</p>
                                )}
                                  <div className={cn(
                                    "flex items-center justify-end text-xs mt-1",
                                    isOwnMessage ? "text-purple-200" : "text-gray-500"
                                  )}>
                                    <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-medium text-gray-800 mb-2">No messages yet</h3>
                            <p className="text-gray-500 text-sm">
                              Send a message to start the conversation with {selectedContact.name || selectedContact.username}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Message input - WhatsApp style */}
                <div className="p-4 bg-gray-100 border-t border-gray-200">
                  {/* File preview */}
                  {selectedFile && (
                    <div className="mb-3 p-2 bg-gray-50 rounded border flex items-center justify-between">
                      <div className="flex items-center">
                        {filePreview && filePreview !== 'file' ? (
                          <div className="w-10 h-10 rounded overflow-hidden mr-2">
                            <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <File className="h-5 w-5 mr-2 text-primary-500" />
                        )}
                        <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={clearSelectedFile}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Input area */}
                  <div className="flex items-end space-x-2">
                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    
                    {/* Attachment button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    
                    {/* Message input container - Clean style */}
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type your message..."
                        className="rounded-3xl border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-700 h-11"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                    </div>
                    
                    {/* Send button */}
                    <Button
                      onClick={handleSendMessage}
                      disabled={(!messageText.trim() && !selectedFile) || sendMessageMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-full h-11 w-11 p-0 transition-all duration-200"
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex px-6 py-8">
                <div className="max-w-xl w-full">
                  <div className="flex items-center mb-6">
                    <svg className="h-12 w-12 text-purple-600 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="text-2xl font-medium text-gray-800">Your Messages</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-6 text-lg">
                    Select a contact from the sidebar to start a conversation or continue an existing one.
                  </p>
                  
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6" onClick={() => {
                    // Set the first contact as selected if available
                    if (filteredContacts && filteredContacts.length > 0) {
                      setSelectedContact(filteredContacts[0].user);
                    }
                  }}>
                    <ChevronDown className="h-4 w-4 mr-1 md:hidden" />
                    <span className="md:hidden">Select Contact</span>
                    <span className="hidden md:inline">Start a conversation</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
    </Layout>
  );
}