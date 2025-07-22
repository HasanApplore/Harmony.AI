import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import ProfileEditPage from "@/pages/profile-edit-page";
import ProfileView from "@/pages/profile-view";
import UserProfilePage from "@/pages/user-profile-page";
import JobPage from "@/pages/job-page-new";
import JobBoard from "@/pages/job-board";
import NetworkPage from "@/pages/network-page-new";
import CommunityPage from "@/pages/community-page";
import MessagesPage from "@/pages/messages-page-new";
import SettingsPage from "@/pages/settings-page";
import SavedJobsPage from "@/pages/saved-jobs-page";
import JobApplicationPage from "@/pages/job-application-page";
import TrendingTopicsPage from "@/pages/trending-topics-page";
import AdminLoginPage from "@/pages/admin-login";
import AdminDashboardPage from "@/pages/admin-dashboard";
import AdminPanelPage from "@/pages/admin-panel";
import StandaloneAdminPanel from "@/pages/standalone-admin";
import { CompanyPage, CreateCompanyPage } from "@/pages/company-page";
import CompaniesPage from "@/pages/companies-page";
// Recruiter pages
import RecruiterDashboard from "@/pages/recruiter-dashboard";
import RecruiterNetworkPage from "@/pages/recruiter-network";
import RecruiterJobsPage from "@/pages/recruiter-jobs";
import RecruiterProfilePage from "@/pages/recruiter-profile";
import CreateJobPosting from "@/pages/create-job-posting";
import CandidateProfileView from "@/pages/candidate-profile-view";
import ApplicantTracking from "@/pages/applicant-tracking";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import RecruiterRedirect from "./components/recruiter-redirect";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/profile" component={ProfileView} />
      <ProtectedRoute path="/profile/edit" component={ProfileEditPage} />
      <ProtectedRoute path="/profile-old" component={ProfilePage} />
      <ProtectedRoute path="/profile/:id" component={UserProfilePage} />
      <ProtectedRoute path="/jobs" component={JobBoard} />
      <ProtectedRoute path="/jobs-old" component={JobPage} />
      <ProtectedRoute path="/my-network" component={NetworkPage} />
      <ProtectedRoute path="/communities" component={CommunityPage} />
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/saved-jobs" component={SavedJobsPage} />
      <ProtectedRoute path="/apply/:id" component={JobApplicationPage} />
      <ProtectedRoute path="/trending-topics" component={TrendingTopicsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/companies/create" component={CreateCompanyPage} />
      <ProtectedRoute path="/companies/:id" component={CompanyPage} />
      <ProtectedRoute path="/companies" component={CompaniesPage} />
      
      {/* Recruiter routes */}
      <ProtectedRoute path="/recruiter-dashboard" component={RecruiterDashboard} />
      <ProtectedRoute path="/recruiter-network" component={RecruiterNetworkPage} />
      <ProtectedRoute path="/recruiter-jobs" component={RecruiterJobsPage} />
      <ProtectedRoute path="/recruiter-profile" component={RecruiterProfilePage} />
      <ProtectedRoute path="/create-job-posting" component={CreateJobPosting} />
      <ProtectedRoute path="/applicant-tracking" component={ApplicantTracking} />
      <ProtectedRoute path="/candidate/:id" component={CandidateProfileView} />
      
      {/* Admin routes */}
      <Route path="/admin-login" component={AdminLoginPage} />
      <Route path="/admin-dashboard" component={AdminDashboardPage} />
      <Route path="/admin-panel" component={AdminPanelPage} />
      <Route path="/standalone-admin" component={StandaloneAdminPanel} />
      
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <RecruiterRedirect />
        <Router />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
