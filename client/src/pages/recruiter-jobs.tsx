import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Search, Briefcase, Plus, MapPin, Clock, Building, Calendar, Archive, Edit, Trash2, Eye, Filter, Users, Bookmark } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RecruiterJobsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [confirmDeleteJobId, setConfirmDeleteJobId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [archiveJobId, setArchiveJobId] = useState<number | null>(null);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  
  // Fetch user's jobs
  const { data: jobs, isLoading: isJobsLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "jobs"],
    enabled: !!user,
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      await apiRequest("DELETE", `/api/jobs/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "jobs"] });
      toast({
        title: "Job deleted",
        description: "The job has been permanently deleted.",
      });
      setIsDeleteDialogOpen(false);
      setConfirmDeleteJobId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Archive job mutation
  const archiveJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      await apiRequest("PATCH", `/api/jobs/${jobId}/archive`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "jobs"] });
      toast({
        title: "Job archived",
        description: "The job has been moved to the archive.",
      });
      setIsArchiveDialogOpen(false);
      setArchiveJobId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Unarchive job mutation
  const unarchiveJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      await apiRequest("PATCH", `/api/jobs/${jobId}/unarchive`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "jobs"] });
      toast({
        title: "Job unarchived",
        description: "The job has been restored to active listings.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filter active jobs
  const activeJobs = jobs ? jobs.filter((job: any) => !job.isArchived) : [];
  const archivedJobs = jobs ? jobs.filter((job: any) => job.isArchived) : [];

  // Filter jobs based on search and filters
  const filteredActiveJobs = activeJobs.filter((job: any) => {
    const matchesSearch = !searchTerm || 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !locationFilter || 
      job.location?.toLowerCase().includes(locationFilter.toLowerCase());
    
    const matchesJobType = !jobTypeFilter || 
      job.jobType?.toLowerCase() === jobTypeFilter.toLowerCase();
    
    return matchesSearch && matchesLocation && matchesJobType;
  });

  // Filter archived jobs based on search
  const filteredArchivedJobs = archivedJobs.filter((job: any) => {
    const matchesSearch = !searchTerm || 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Handle job archive
  const handleArchiveJob = (jobId: number) => {
    setArchiveJobId(jobId);
    setIsArchiveDialogOpen(true);
  };

  // Handle job delete
  const handleDeleteJob = (jobId: number) => {
    setConfirmDeleteJobId(jobId);
    setIsDeleteDialogOpen(true);
  };

  return (
    <Layout>
      <div className="p-4 pb-16 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Job Postings</h1>
          
          <Button 
            className="mt-4 sm:mt-0 bg-purple-600 hover:bg-purple-700"
            onClick={() => setLocation("/create-job-posting")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Post New Job
          </Button>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b pb-1 mb-6">
            <TabsList className="bg-transparent gap-2">
              <TabsTrigger 
                value="active" 
                className="rounded-full bg-purple-600 text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Active Jobs
              </TabsTrigger>
              <TabsTrigger 
                value="archived" 
                className="rounded-full bg-transparent text-gray-700 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Archived Jobs
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="active" className="mt-0">
            {/* Search and filters */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex flex-col md:flex-row items-start gap-4">
                <div className="relative w-full flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search job postings"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </div>
              </div>
              
              {showFilters && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Locations</SelectItem>
                      <SelectItem value="Mumbai">Mumbai</SelectItem>
                      <SelectItem value="Delhi">Delhi</SelectItem>
                      <SelectItem value="Bangalore">Bangalore</SelectItem>
                      <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                      <SelectItem value="Chennai">Chennai</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            {/* Active job listings */}
            {isJobsLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, index) => (
                  <Skeleton key={index} className="h-40 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredActiveJobs.length > 0 ? (
              <div className="space-y-4">
                {filteredActiveJobs.map((job: any) => (
                  <Card key={job.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-grow p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-medium">{job.title}</h3>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
                            </div>
                            <div className="flex items-center text-gray-500 mb-4">
                              <Building size={16} className="mr-1" />
                              <span>{job.company}</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-3 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin size={15} className="mr-1" />
                                {job.location}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Briefcase size={15} className="mr-1" />
                                {job.jobType}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar size={15} className="mr-1" />
                                Posted {new Date(job.postedDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center"
                              onClick={() => setLocation(`/applicant-tracking?jobId=${job.id}`)}
                            >
                              <Users className="h-4 w-4 mr-1" />
                              View Applicants
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center"
                              onClick={() => setLocation(`/jobs/${job.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap mt-4 justify-between items-center">
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="h-4 w-4 mr-1" />
                            {job.applicantCount || 0} Applicants
                          </div>
                          
                          <div className="flex space-x-2 mt-2 md:mt-0">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center"
                              onClick={() => setLocation(`/edit-job/${job.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center text-amber-600 border-amber-600 hover:bg-amber-50"
                              onClick={() => handleArchiveJob(job.id)}
                            >
                              <Archive className="h-4 w-4 mr-1" />
                              Archive
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteJob(job.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <div className="bg-gray-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No active job listings</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || locationFilter || jobTypeFilter ? 
                    "No jobs found matching your search criteria. Try adjusting your filters." : 
                    "You haven't posted any jobs yet. Create your first job posting to find the right talent."}
                </p>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => setLocation("/create-job-posting")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="archived" className="mt-0">
            {/* Search for archived jobs */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search archived job postings"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Archived job listings */}
            {isJobsLoading ? (
              <div className="space-y-4">
                {Array(2).fill(0).map((_, index) => (
                  <Skeleton key={index} className="h-40 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredArchivedJobs.length > 0 ? (
              <div className="space-y-4">
                {filteredArchivedJobs.map((job: any) => (
                  <Card key={job.id} className="overflow-hidden border-gray-200 bg-gray-50">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-grow p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-medium text-gray-700">{job.title}</h3>
                              <Badge className="bg-gray-200 text-gray-600 hover:bg-gray-300">Archived</Badge>
                            </div>
                            <div className="flex items-center text-gray-500 mb-4">
                              <Building size={16} className="mr-1" />
                              <span>{job.company}</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-3 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin size={15} className="mr-1" />
                                {job.location}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Briefcase size={15} className="mr-1" />
                                {job.jobType}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar size={15} className="mr-1" />
                                Archived on {new Date(job.archivedDate || job.updatedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap mt-4 justify-between items-center">
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="h-4 w-4 mr-1" />
                            {job.applicantCount || 0} Total Applicants
                          </div>
                          
                          <div className="flex space-x-2 mt-2 md:mt-0">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center"
                              onClick={() => unarchiveJobMutation.mutate(job.id)}
                            >
                              <Bookmark className="h-4 w-4 mr-1" />
                              Unarchive
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteJob(job.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <div className="bg-gray-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Archive className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No archived job listings</h3>
                <p className="text-gray-500">
                  {searchTerm ? 
                    "No archived jobs found matching your search. Try different search terms." : 
                    "You don't have any archived job postings."}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Job Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Job Posting</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job posting? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => confirmDeleteJobId && deleteJobMutation.mutate(confirmDeleteJobId)}
              disabled={deleteJobMutation.isPending}
            >
              {deleteJobMutation.isPending ? "Deleting..." : "Delete Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Job Confirmation Dialog */}
      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive Job Posting</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive this job posting? It will no longer be visible to job seekers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsArchiveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => archiveJobId && archiveJobMutation.mutate(archiveJobId)}
              disabled={archiveJobMutation.isPending}
            >
              {archiveJobMutation.isPending ? "Archiving..." : "Archive Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}