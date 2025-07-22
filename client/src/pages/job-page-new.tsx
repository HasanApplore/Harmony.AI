import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Search, 
  Briefcase, 
  MapPin, 
  Filter, 
  Bookmark,
  Building, 
  ChevronRight,
  Clock,
  DollarSign,
  Cpu,
  ArrowUpDown,
  CheckCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Define job type interface
interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  userId: number;
  createdAt: string;
  salary: string;
  jobType: string;
  experienceLevel: string;
}

export default function JobPageNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("browse");
  const [showFilters, setShowFilters] = useState(true);
  const [showAIRecommendations, setShowAIRecommendations] = useState(true);
  
  // Fetch jobs
  const { data: allJobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });
  
  // Fetch saved jobs
  const { data: savedJobs = [], isLoading: savedJobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs/saved"],
  });
  
  // Fetch applied jobs - for demo purposes using slice but in real implementation would be an API call
  const appliedJobs = allJobs.slice(1, 2);
  
  // Save job mutation
  const saveJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("POST", `/api/jobs/${jobId}/save`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/saved"] });
      toast({
        title: "Job saved",
        description: "This job has been added to your saved jobs list",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save job",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Remove saved job mutation
  const removeSavedJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("DELETE", `/api/jobs/${jobId}/save`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to remove saved job");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/saved"] });
      toast({
        title: "Job removed",
        description: "This job has been removed from your saved jobs list",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove job",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Apply for job mutation
  const applyForJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("POST", `/api/jobs/${jobId}/apply`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Application submitted",
        description: "Your job application has been submitted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to apply",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Generate match percentage based on job skills and user skills
  const getMatchPercentage = (job: Job) => {
    if (!job) return 60;
    return job.id === 1 ? 85 : job.id === 2 ? 76 : 60; // Mock match percentages
  };
  
  // Filter jobs based on search criteria
  const filteredJobs = allJobs.filter(job => {
    // Search term filter
    const matchesSearch = !searchTerm || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Location filter
    const matchesLocation = locationFilter === "all" || 
      job.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    // Experience level filter
    const matchesExperience = experienceFilter === "all" || 
      job.experienceLevel.includes(experienceFilter);
    
    // Job type filter - exact match for job types
    const matchesJobType = jobTypeFilter === "all" || 
      job.jobType === jobTypeFilter;
      
    return matchesSearch && matchesLocation && matchesExperience && matchesJobType;
  });
  
  // Format and display skills as tags
  const renderSkillTags = (skills: string[]) => {
    if (!skills || skills.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {skills.map((skill, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100"
          >
            {skill}
          </Badge>
        ))}
      </div>
    );
  };

  // Check if a job is saved
  const isJobSaved = (jobId: number) => {
    return savedJobs.some(savedJob => savedJob.id === jobId);
  };
  
  // Handle saving or removing a job
  const handleSaveJob = (jobId: number) => {
    if (isJobSaved(jobId)) {
      removeSavedJobMutation.mutate(jobId);
    } else {
      saveJobMutation.mutate(jobId);
    }
  };
  
  // Handle applying for a job
  const handleApplyForJob = (jobId: number) => {
    applyForJobMutation.mutate(jobId);
  };
  
  // Render a job card with match percentage
  const renderJobCard = (job: Job, view: 'browse' | 'saved' | 'applied' = 'browse') => {
    const matchPercentage = getMatchPercentage(job);
    const isSaved = isJobSaved(job.id);
    
    return (
      <Card key={job.id} className="mb-4 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {/* Match percentage section on left */}
            {showAIRecommendations && view === 'browse' && (
              <div className="w-24 bg-purple-100 flex flex-col items-center justify-center p-4">
                <div className="text-3xl font-bold text-purple-700">{matchPercentage}%</div>
                <div className="text-xs text-purple-600 text-center mt-1">Match</div>
              </div>
            )}
            
            {/* Job content section */}
            <div className="flex-1 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{job.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Building className="h-4 w-4 mr-1" />
                    <span>{job.company}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{job.location}</span>
                  </div>
                </div>
                <Button 
                  variant={isSaved ? "default" : "outline"} 
                  size="sm" 
                  className={isSaved ? "bg-purple-600 text-white" : "text-purple-600 border-purple-200"}
                  onClick={() => handleSaveJob(job.id)}
                  disabled={saveJobMutation.isPending || removeSavedJobMutation.isPending}
                >
                  <Bookmark className="h-4 w-4 mr-1" />
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
              </div>
              
              <div className="mt-3">
                <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mt-2 space-x-6">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span>{job.salary}</span>
                </div>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-1" />
                  <span>{job.jobType}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{job.experienceLevel}</span>
                </div>
              </div>
              
              {/* Skills section */}
              {renderSkillTags(job.skills)}
              
              <div className="mt-4 flex justify-end">
                {view === 'applied' ? (
                  <div className="text-sm text-green-600 flex items-center mr-3">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Applied
                  </div>
                ) : (
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => handleApplyForJob(job.id)}
                    disabled={applyForJobMutation.isPending}
                  >
                    Apply Now <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 pb-16">
        <h1 className="text-2xl font-bold mb-6">Find Your Perfect Job</h1>
        
        <div className="flex gap-6">
          {/* Filters sidebar */}
          {showFilters && (
            <div className="w-64 space-y-6">
              {/* Search box */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Search</h3>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Job title or keyword"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Location filter */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Location</h3>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any location</SelectItem>
                    <SelectItem value="Bengaluru">Bengaluru</SelectItem>
                    <SelectItem value="Delhi">Delhi</SelectItem>
                    <SelectItem value="Mumbai">Mumbai</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              {/* Experience level filter */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Experience</h3>
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any experience</SelectItem>
                    <SelectItem value="Entry">Entry level</SelectItem>
                    <SelectItem value="Mid-level">Mid-level</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              {/* Job type filter */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Job Type</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Button
                      variant={jobTypeFilter === "all" ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setJobTypeFilter("all")}
                    >
                      All Jobs
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant={jobTypeFilter === "Full-time" ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setJobTypeFilter("Full-time")}
                    >
                      Full-time
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant={jobTypeFilter === "Part-time" ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setJobTypeFilter("Part-time")}
                    >
                      Part-time
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant={jobTypeFilter === "Contract" ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setJobTypeFilter("Contract")}
                    >
                      Contract
                    </Button>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* AI recommendations toggle */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">AI Recommendations</h3>
                  <Switch
                    checked={showAIRecommendations}
                    onCheckedChange={setShowAIRecommendations}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Show personalized job matches based on your profile
                </p>
              </div>
            </div>
          )}
          
          {/* Main content area */}
          <div className="flex-1">
            {/* Toggle filters on mobile */}
            <div className="flex justify-end mb-4 lg:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
            
            {/* Tabs for different job views */}
            <Tabs defaultValue="browse" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="browse">Browse Jobs</TabsTrigger>
                <TabsTrigger value="saved">Saved Jobs</TabsTrigger>
                <TabsTrigger value="applied">Applied Jobs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="browse">
                {jobsLoading ? (
                  // Loading skeletons
                  Array(3).fill(0).map((_, i) => (
                    <Card key={i} className="mb-4">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <Skeleton className="h-16 w-16 rounded-md" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-5/6" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No jobs match your filters.</p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setSearchTerm("");
                        setLocationFilter("");
                        setExperienceFilter("");
                        setJobTypeFilter("all");
                      }}
                    >
                      Clear all filters
                    </Button>
                  </div>
                ) : (
                  filteredJobs.map(job => renderJobCard(job))
                )}
              </TabsContent>
              
              <TabsContent value="saved">
                {savedJobsLoading ? (
                  // Loading skeletons for saved jobs
                  Array(2).fill(0).map((_, i) => (
                    <Card key={i} className="mb-4">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <Skeleton className="h-16 w-16 rounded-md" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-5/6" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : savedJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">You haven't saved any jobs yet.</p>
                    <Button
                      variant="link"
                      onClick={() => setActiveTab("browse")}
                    >
                      Browse jobs
                    </Button>
                  </div>
                ) : (
                  savedJobs.map(job => renderJobCard(job, 'saved'))
                )}
              </TabsContent>
              
              <TabsContent value="applied">
                {appliedJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">You haven't applied to any jobs yet.</p>
                    <Button
                      variant="link"
                      onClick={() => setActiveTab("browse")}
                    >
                      Browse jobs
                    </Button>
                  </div>
                ) : (
                  appliedJobs.map(job => renderJobCard(job, 'applied'))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}