import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Layout from "@/components/layout";
import { Job } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Building2, BookmarkX, BadgeCheck } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function SavedJobsPage() {
  const { toast } = useToast();
  const [expandedJobIds, setExpandedJobIds] = useState<Set<number>>(new Set());
  const [_, navigate] = useLocation();

  // Fetch saved jobs
  const { data: apiSavedJobs, isLoading: isLoadingApi } = useQuery<Job[]>({
    queryKey: ["/api/jobs/saved"],
  });
  
  // Sample saved jobs (only used if API returns empty)
  const sampleSavedJobs = [
    {
      id: 101,
      title: "Data Analyst",
      company: "Tech Innovations Ltd",
      location: "Mumbai, Maharashtra (Remote)",
      description: "Looking for a skilled Data Analyst to join our growing analytics team. The ideal candidate will have experience with SQL, Python, and data visualization tools. You'll be responsible for analyzing customer data, creating reports, and providing insights to drive business decisions.",
      skills: ["SQL", "Python", "Tableau", "Data Visualization", "Statistics"],
      userId: 1,
      createdAt: new Date(),
      salary: "₹10-15 LPA",
      jobType: "Full-time",
      experienceLevel: "Mid-level (2-5 years)"
    },
    {
      id: 102,
      title: "Senior Product Manager",
      company: "GrowthTech Solutions",
      location: "Bangalore, Karnataka",
      description: "We're seeking an experienced Product Manager to lead our flagship SaaS product. You'll work with cross-functional teams to define product strategy, gather requirements, and drive the product roadmap. Experience with B2B products and agile methodologies is required.",
      skills: ["Product Strategy", "Agile", "User Research", "Analytics", "B2B SaaS"],
      userId: 2,
      createdAt: new Date(),
      salary: "₹22-28 LPA",
      jobType: "Full-time",
      experienceLevel: "Senior (5+ years)"
    },
    {
      id: 103,
      title: "UX/UI Designer",
      company: "CreativeTech Studios",
      location: "Hyderabad, Telangana (Hybrid)",
      description: "Join our design team to create beautiful and functional user experiences for our clients in fintech and healthcare. You'll collaborate with product managers and developers to design intuitive interfaces, create wireframes, and conduct user testing.",
      skills: ["Figma", "Adobe XD", "Prototyping", "User Research", "Interaction Design"],
      userId: 3,
      createdAt: new Date(),
      salary: "₹12-18 LPA",
      jobType: "Full-time",
      experienceLevel: "Mid-level (2-4 years)"
    }
  ];
  
  // Use sample jobs if API returns empty
  const isLoading = isLoadingApi;
  const savedJobs = (apiSavedJobs && apiSavedJobs.length > 0) ? apiSavedJobs : sampleSavedJobs;

  // Unsave job mutation
  const unsaveJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("DELETE", `/api/jobs/${jobId}/save`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Job removed",
        description: "The job has been removed from your saved jobs."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/saved"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove job",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Apply for job mutation
  const applyJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("POST", `/api/jobs/${jobId}/apply`, { note: "" });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Application submitted",
        description: "Your job application has been successfully submitted."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit application",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Toggle job description expand/collapse
  const toggleJobExpanded = (jobId: number) => {
    setExpandedJobIds(prevState => {
      const newState = new Set(prevState);
      if (newState.has(jobId)) {
        newState.delete(jobId);
      } else {
        newState.add(jobId);
      }
      return newState;
    });
  };

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-6 px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Saved Jobs</h1>
          <p className="text-gray-600">
            Manage your saved job listings and apply when you're ready
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <Skeleton className="h-6 w-2/3 mb-4" />
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : savedJobs && savedJobs.length > 0 ? (
          <div className="space-y-4">
            {savedJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h2>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Building2 className="h-4 w-4 mr-1" />
                        <span className="mr-3">{job.company}</span>
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{job.location}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3 mb-4">
                        {job.skills && job.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-purple-600 font-medium mb-1">{job.salary}</div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{job.jobType}</span>
                      </div>
                    </div>
                  </div>
                  
                  {expandedJobIds.has(job.id) && (
                    <div className="mt-4">
                      <Separator className="my-3" />
                      <div className="mt-2 text-gray-700">
                        <p>{job.description}</p>
                      </div>
                      
                      <div className="mt-4">
                        <h3 className="font-medium text-gray-900 mb-2">Experience Level</h3>
                        <p className="text-gray-700">{job.experienceLevel}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-5 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleJobExpanded(job.id)}
                      className="text-gray-600"
                    >
                      {expandedJobIds.has(job.id) ? "Show less" : "Show more"}
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unsaveJobMutation.mutate(job.id)}
                        className="text-gray-700"
                        disabled={unsaveJobMutation.isPending}
                      >
                        <BookmarkX className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/apply/${job.id}`)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <BadgeCheck className="h-4 w-4 mr-1" />
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <BookmarkX className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No saved jobs yet</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              When you save jobs you're interested in, they'll appear here for easy access and comparing options.
            </p>
            <Button
              onClick={() => window.location.href = "/jobs"}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Browse Jobs
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}