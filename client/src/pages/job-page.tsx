import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/utils";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

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

// Form schema for job creation
const jobFormSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  skills: z.string().min(1, "Skills are required"),
  salary: z.string().optional(),
  jobType: z.string().min(1, "Job type is required"),
  experienceLevel: z.string().min(1, "Experience level is required"),
  userId: z.number(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

export default function JobPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("browse");
  const [showFilters, setShowFilters] = useState(true);
  const [showAIRecommendations, setShowAIRecommendations] = useState(true);
  const [createJobModalOpen, setCreateJobModalOpen] = useState(false);
  
  // Fetch jobs
  const { data: allJobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });
  
  // Demo saved and applied jobs
  const demoSavedJobs = allJobs.slice(0, 1);
  const appliedJobs = allJobs.slice(1, 2);
  
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
    const matchesLocation = !locationFilter || 
      job.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    // Experience level filter
    const matchesExperience = !experienceFilter || 
      job.experienceLevel.includes(experienceFilter);
    
    // Job type filter
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

  // Form for creating a new job
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      company: user?.company || "",
      location: "",
      description: "",
      skills: "",
      salary: "",
      jobType: "",
      experienceLevel: "",
      userId: user?.id || 0,
    },
  });

  // Job creation mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormValues) => {
      // Convert skills string to array
      const skillsArray = data.skills.split(",").map(skill => skill.trim());
      
      const jobData = {
        ...data,
        skills: skillsArray,
      };
      
      const res = await apiRequest("POST", "/api/jobs", jobData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Job created",
        description: "Your job posting has been created successfully."
      });
      setCreateJobModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Job creation failed",
        description: error instanceof Error ? error.message : "Failed to create job posting",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: JobFormValues) => {
    createJobMutation.mutate(data);
  };



  // Fetch saved jobs - for demo, just use an empty array
  const { data: savedJobs = [] } = useQuery<any[]>({
    queryKey: ["/api/saved-jobs"],
    enabled: activeTab === "saved"
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 pb-16">
        <div className="border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold mb-1">Find Your Perfect Job</h1>
          <p className="text-sm text-gray-500">
            Find your next opportunity with AI-powered job matching
          </p>
        </div>
        
        <div className="tabs-container mb-6">
          <div className="border-b pb-1 mb-6">
            <div className="flex space-x-2">
              <Button 
                variant={jobTypeFilter === "all" ? "default" : "outline"}
                className={`rounded-full ${jobTypeFilter === "all" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                onClick={() => setJobTypeFilter("all")}
              >
                Browse Jobs
              </Button>
              <Button 
                variant={jobTypeFilter === "saved" ? "default" : "outline"}
                className={`rounded-full ${jobTypeFilter === "saved" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                onClick={() => setJobTypeFilter("saved")}
              >
                Saved Jobs
              </Button>
              <Button 
                variant={jobTypeFilter === "applied" ? "default" : "outline"}
                className={`rounded-full ${jobTypeFilter === "applied" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                onClick={() => setJobTypeFilter("applied")}
              >
                Applied Jobs
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex">
          {/* Left sidebar with filters */}
          <div className="w-64 mr-4 bg-white shadow-sm rounded-lg p-4 border border-gray-100 hidden md:block">
            <div className="mb-6">
              <h3 className="font-medium mb-2">Filters</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Search</p>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Job title, company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 text-sm py-1 h-9"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Location</p>
                <div className="relative">
                  <MapPin className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="City, country, remote..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="pl-8 text-sm py-1 h-9"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Job Type</p>
                <Select value={activeJobType} onValueChange={setActiveJobType}>
                  <SelectTrigger className="w-full text-sm h-9">
                    <SelectValue placeholder="All Job Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Job Types</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between pt-4 mt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showAIRecommendations}
                    onCheckedChange={setShowAIRecommendations}
                    id="ai-recommendations"
                  />
                  <Label htmlFor="ai-recommendations" className="text-sm">Show AI Recommendations</Label>
                </div>
              </div>
              
              <Button 
                variant="ghost"
                size="sm"
                className="mt-4 w-full text-purple-600 hover:text-purple-800"
                onClick={() => {
                  setSearchTerm("");
                  setLocationFilter("");
                  setActiveJobType("all");
                  setExperienceFilter("");
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1">
            {/* Mobile filter button */}
            <div className="flex md:hidden justify-end mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
            
            {/* Mobile filters */}
            {showFilters && (
              <div className="md:hidden p-4 bg-white rounded-lg shadow-sm mb-4 border">
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      placeholder="Search jobs, companies, or keywords"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Locations</SelectItem>
                      <SelectItem value="Mumbai">Mumbai</SelectItem>
                      <SelectItem value="Delhi">Delhi</SelectItem>
                      <SelectItem value="Bangalore">Bangalore</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={activeJobType} onValueChange={setActiveJobType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={showAIRecommendations}
                      onCheckedChange={setShowAIRecommendations}
                      id="mobile-ai-recommendations"
                    />
                    <Label htmlFor="mobile-ai-recommendations">Show AI Recommendations</Label>
                  </div>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setLocationFilter("");
                      setActiveJobType("all");
                      setExperienceFilter("");
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            )}
            
            {/* Job Listings */}
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, index) => (
                  <Card key={index} className="bg-white rounded-lg animate-pulse w-full h-40" />
                ))}
              </div>
            ) : jobTypeFilter === "all" && filteredJobs && filteredJobs.length > 0 ? (
              <div className="space-y-4">
                {filteredJobs.map((job: any) => (
                  <Card key={job.id} className="bg-white hover:shadow-md transition-shadow border-0 shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4 text-center">
                          <span className="text-purple-700 font-semibold">
                            {job.company.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-xl">{job.title}</h3>
                              <div className="flex items-center text-gray-500 text-sm mt-1">
                                <Building className="h-4 w-4 mr-1" />
                                <span>{job.company}</span>
                              </div>
                            </div>
                            
                            {showAIRecommendations && (
                              <Badge className={`rounded-full px-3 py-1 bg-purple-100 border-purple-200 text-purple-700 ${getMatchPercentage(job) >= 70 ? 'bg-purple-100 text-purple-700' : ''}`}>
                                {getMatchPercentage(job)}% Match
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-6 mt-3 text-gray-600 text-sm">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center">
                              <Briefcase className="h-4 w-4 mr-1" />
                              <span>{job.jobType || 'Full-time'}</span>
                            </div>
                          </div>
                          
                          {renderSkillTags(job.skills)}
                          
                          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Salary:</span> <span className="text-gray-600">{job.salary}</span>
                              <span className="mx-2">•</span> 
                              <span className="font-medium text-gray-700">Experience:</span> <span className="text-gray-600">{job.experienceLevel}</span>
                            </div>
                            
                            <Button 
                              className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4"
                              onClick={() => window.location.href = `/apply/${job.id}`}
                            >
                              Apply Now
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : jobTypeFilter === "saved" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <Bookmark className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-lg mb-1">No saved jobs</h3>
                <p className="text-gray-500 max-w-md">
                  You haven't saved any jobs yet. Browse jobs and click the bookmark icon to save them for later.
                </p>
              </div>
            ) : jobTypeFilter === "applied" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <Briefcase className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-lg mb-1">No applications yet</h3>
                <p className="text-gray-500 max-w-md">
                  You haven't applied to any jobs yet. Start browsing and applying to jobs to see them here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <Briefcase className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-lg mb-1">No jobs found</h3>
                <p className="text-gray-500 max-w-md">
                  We couldn't find any jobs matching your search criteria. Try adjusting your filters or search terms.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Create Job Modal */}
        <Dialog open={createJobModalOpen} onOpenChange={setCreateJobModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Post a New Job</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Senior UX Designer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Acme Corporation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. San Francisco, CA (Remote)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary Range</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. $80K - $120K" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="jobType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select job type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full-time">Full-time</SelectItem>
                            <SelectItem value="part-time">Part-time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                            <SelectItem value="remote">Remote</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Level</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level</SelectItem>
                          <SelectItem value="mid">Mid Level</SelectItem>
                          <SelectItem value="senior">Senior Level</SelectItem>
                          <SelectItem value="executive">Executive Level</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Skills*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. React, TypeScript, UI Design (comma separated)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description*</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the role, responsibilities, requirements, etc." 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCreateJobModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createJobMutation.isPending}
                  >
                    {createJobMutation.isPending ? "Posting..." : "Post Job"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
