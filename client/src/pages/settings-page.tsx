import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import TwoFactorAuthModal from "@/components/two-factor-auth-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Bell, Eye, EyeOff, SmartphoneCharging } from "lucide-react";

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  
  // Extract privacy settings from user or use defaults
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: user?.privacySettings?.profileVisibility || 'all',
    digitalCvVisibility: user?.privacySettings?.digitalCvVisibility || 'all'
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    jobAlerts: true,
    messageNotifications: true,
    connectionRequests: true,
    communityUpdates: true
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/users/change-password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully."
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast({
        title: "Password change failed",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      });
    },
  });

  // Update privacy settings mutation
  const updatePrivacyMutation = useMutation({
    mutationFn: async (settings: any) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, {
        privacySettings: settings
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Privacy settings updated",
        description: "Your privacy settings have been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update privacy settings",
        variant: "destructive",
      });
    },
  });

  // Update notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const res = await apiRequest("POST", "/api/users/notification-settings", settings);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved."
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update notification settings",
        variant: "destructive",
      });
    },
  });

  // Toggle 2FA mutation
  const toggleTwoFactorMutation = useMutation({
    mutationFn: async (enable: boolean) => {
      if (enable) {
        // This would initiate 2FA setup and send verification code
        setIsTwoFactorModalOpen(true);
        return null;
      } else {
        // This would disable 2FA
        const res = await apiRequest("POST", "/api/users/disable-2fa", {});
        return await res.json();
      }
    },
    onSuccess: (_, variables) => {
      if (!variables) { // If disabling 2FA
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        toast({
          title: "Two-factor authentication disabled",
          description: "Two-factor authentication has been turned off."
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Two-factor authentication update failed",
        description: error instanceof Error ? error.message : "Failed to update two-factor authentication",
        variant: "destructive",
      });
    },
  });

  // Handle password change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword,
      newPassword
    });
  };

  // Handle privacy settings update
  const handlePrivacyUpdate = () => {
    updatePrivacyMutation.mutate(privacySettings);
  };

  // Handle notification settings update
  const handleNotificationUpdate = () => {
    updateNotificationsMutation.mutate(notificationSettings);
  };

  // Handle 2FA verification
  const handleVerify2FA = (code: string) => {
    // Simulate successful 2FA verification
    setTimeout(() => {
      setIsTwoFactorModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Two-factor authentication enabled",
        description: "Your account is now protected with two-factor authentication."
      });
    }, 1500);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="grid gap-6 grid-cols-12">
            {/* Sidebar */}
            <div className="col-span-12 md:col-span-3">
              <Card>
                <CardContent className="p-0">
                  <TabsList className="flex flex-col h-auto justify-start items-stretch p-0 bg-transparent">
                    <TabsTrigger 
                      value="account" 
                      className="justify-start px-4 py-3 data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700 rounded-none border-b"
                    >
                      Account Settings
                    </TabsTrigger>
                    <TabsTrigger 
                      value="privacy" 
                      className="justify-start px-4 py-3 data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700 rounded-none border-b"
                    >
                      Privacy
                    </TabsTrigger>
                    <TabsTrigger 
                      value="notifications" 
                      className="justify-start px-4 py-3 data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700 rounded-none border-b"
                    >
                      Notifications
                    </TabsTrigger>
                    <TabsTrigger 
                      value="security" 
                      className="justify-start px-4 py-3 data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700 rounded-none border-b"
                    >
                      Security
                    </TabsTrigger>
                  </TabsList>
                </CardContent>
              </Card>
            </div>
            
            {/* Main content */}
            <div className="col-span-12 md:col-span-9">
              <TabsContent value="account" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your account details and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" value={user?.email} disabled />
                      <p className="text-sm text-gray-500">Your email is used for login and notifications</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" value={user?.username} disabled />
                      <p className="text-sm text-gray-500">Your unique username on Harmony.ai</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <Input id="mobile" value={user?.mobileNumber || ""} placeholder="Add mobile number" />
                      <p className="text-sm text-gray-500">Used for account recovery and two-factor authentication</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Danger Zone</h3>
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Delete Account</AlertTitle>
                        <AlertDescription>
                          This action is irreversible. All your data will be permanently deleted.
                        </AlertDescription>
                        <div className="mt-4">
                          <Button variant="destructive">Delete My Account</Button>
                        </div>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="privacy" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>
                      Control who can see your profile and Digital CV
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-medium mb-2">Profile Visibility</h3>
                        <p className="text-sm text-gray-500 mb-4">Control who can view your profile information</p>
                        
                        <RadioGroup 
                          value={privacySettings.profileVisibility}
                          onValueChange={(value) => setPrivacySettings({...privacySettings, profileVisibility: value})}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <RadioGroupItem value="all" id="profile-all" />
                            <Label htmlFor="profile-all" className="flex items-center">
                              <Eye className="h-4 w-4 mr-2 text-gray-500" />
                              <span>All Harmony.ai Users</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <RadioGroupItem value="connections" id="profile-connections" />
                            <Label htmlFor="profile-connections" className="flex items-center">
                              <Eye className="h-4 w-4 mr-2 text-gray-500" />
                              <span>Connections Only</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="recruiters" id="profile-recruiters" />
                            <Label htmlFor="profile-recruiters" className="flex items-center">
                              <Eye className="h-4 w-4 mr-2 text-gray-500" />
                              <span>Recruiters Only</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-base font-medium mb-2">Digital CV Visibility</h3>
                        <p className="text-sm text-gray-500 mb-4">Control who can view your Digital CV video</p>
                        
                        <RadioGroup 
                          value={privacySettings.digitalCvVisibility}
                          onValueChange={(value) => setPrivacySettings({...privacySettings, digitalCvVisibility: value})}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <RadioGroupItem value="all" id="cv-all" />
                            <Label htmlFor="cv-all" className="flex items-center">
                              <Eye className="h-4 w-4 mr-2 text-gray-500" />
                              <span>All Harmony.ai Users</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <RadioGroupItem value="connections" id="cv-connections" />
                            <Label htmlFor="cv-connections" className="flex items-center">
                              <Eye className="h-4 w-4 mr-2 text-gray-500" />
                              <span>Connections Only</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <RadioGroupItem value="applied" id="cv-applied" />
                            <Label htmlFor="cv-applied" className="flex items-center">
                              <EyeOff className="h-4 w-4 mr-2 text-gray-500" />
                              <span>Only When I Apply (Recruiters of jobs I've applied to)</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="recruiters" id="cv-recruiters" />
                            <Label htmlFor="cv-recruiters" className="flex items-center">
                              <Eye className="h-4 w-4 mr-2 text-gray-500" />
                              <span>All Recruiters</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handlePrivacyUpdate}
                        disabled={updatePrivacyMutation.isPending}
                      >
                        {updatePrivacyMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Control how and when Harmony.ai notifies you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-notifications">Email Notifications</Label>
                          <p className="text-sm text-gray-500">Receive updates via email</p>
                        </div>
                        <Switch 
                          id="email-notifications"
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="push-notifications">Push Notifications</Label>
                          <p className="text-sm text-gray-500">Receive notifications in your browser</p>
                        </div>
                        <Switch 
                          id="push-notifications"
                          checked={notificationSettings.pushNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, pushNotifications: checked})}
                        />
                      </div>
                      
                      <Separator />
                      
                      <h3 className="text-base font-medium pt-2">Notification Types</h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="job-alerts">Job Alerts</Label>
                          <p className="text-sm text-gray-500">Notifications about new job postings matching your profile</p>
                        </div>
                        <Switch 
                          id="job-alerts"
                          checked={notificationSettings.jobAlerts}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, jobAlerts: checked})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="message-notifications">Messages</Label>
                          <p className="text-sm text-gray-500">Notifications about new messages</p>
                        </div>
                        <Switch 
                          id="message-notifications"
                          checked={notificationSettings.messageNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, messageNotifications: checked})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="connection-requests">Connection Requests</Label>
                          <p className="text-sm text-gray-500">Notifications when someone wants to connect with you</p>
                        </div>
                        <Switch 
                          id="connection-requests"
                          checked={notificationSettings.connectionRequests}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, connectionRequests: checked})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="community-updates">Community Updates</Label>
                          <p className="text-sm text-gray-500">Notifications about activity in your communities</p>
                        </div>
                        <Switch 
                          id="community-updates"
                          checked={notificationSettings.communityUpdates}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, communityUpdates: checked})}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleNotificationUpdate}
                        disabled={updateNotificationsMutation.isPending}
                      >
                        {updateNotificationsMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="security" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Manage your account security and password
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-medium mb-4">Change Password</h3>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input 
                              id="current-password" 
                              type="password" 
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input 
                              id="new-password" 
                              type="password" 
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input 
                              id="confirm-password" 
                              type="password" 
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                            />
                          </div>
                          
                          <Button 
                            type="submit" 
                            disabled={changePasswordMutation.isPending}
                          >
                            {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                          </Button>
                        </form>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-base font-medium mb-4">Two-Factor Authentication</h3>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <p className="font-medium">Protect your account with 2FA</p>
                            <p className="text-sm text-gray-500">
                              Add an extra layer of security by requiring a verification code in addition to your password
                            </p>
                          </div>
                          <Switch 
                            checked={user?.twoFactorEnabled || false}
                            onCheckedChange={(checked) => toggleTwoFactorMutation.mutate(checked)}
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-base font-medium mb-4">Login Sessions</h3>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">Current Session</h4>
                                <p className="text-sm text-gray-500">
                                  {`Browser: ${navigator.userAgent.split(' ').slice(-1)[0].split('/')[0]}`} <br />
                                  {`IP Address: XXX.XXX.X.XXX`} <br />
                                  {`Last Access: ${new Date().toLocaleDateString()}`}
                                </p>
                              </div>
                              <Badge className="bg-green-100 text-green-800">Active Now</Badge>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <div className="mt-4 flex justify-between">
                          <Button variant="outline">View All Sessions</Button>
                          <Button variant="destructive" onClick={() => logoutMutation.mutate()}>
                            Logout of All Devices
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
      
      {/* Two-Factor Authentication Modal */}
      <TwoFactorAuthModal
        isOpen={isTwoFactorModalOpen}
        onClose={() => setIsTwoFactorModalOpen(false)}
        onVerify={handleVerify2FA}
      />
    </Layout>
  );
}