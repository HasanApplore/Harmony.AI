import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Job } from "@shared/schema";
import { Briefcase } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SavedJobsCard() {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch saved jobs
  const { data: savedJobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs/saved"],
  });

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

  return (
    <Card>
      <CardHeader className="pb-3 pt-5">
        <CardTitle className="text-base flex items-center">
          <Briefcase className="h-5 w-5 text-primary-600 mr-2" />
          Saved Jobs
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : savedJobs && savedJobs.length > 0 ? (
          <div className="space-y-3">
            {savedJobs.slice(0, isExpanded ? savedJobs.length : 3).map((job) => (
              <div key={job.id} className="flex items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center flex-shrink-0 mr-3 text-sm font-medium text-primary-800">
                  {job.company.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
                  <p className="text-xs text-gray-500">{job.company} • {job.location}</p>
                </div>
                <button 
                  onClick={() => unsaveJobMutation.mutate(job.id)}
                  className="text-gray-400 hover:text-gray-600 text-sm ml-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
            
            {savedJobs.length > 3 && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium w-full text-center pt-1"
              >
                {isExpanded ? "Show less" : `Show ${savedJobs.length - 3} more`}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-sm text-gray-500">You haven't saved any jobs yet.</p>
            <p className="text-xs text-gray-400 mt-1">Jobs you save will appear here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}