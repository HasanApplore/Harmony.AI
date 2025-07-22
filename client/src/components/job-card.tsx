import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Job } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { MapPin, Briefcase, Clock, Building, ChevronRight } from "lucide-react";

interface JobCardProps {
  job: Job;
  matchPercentage?: number;
  highlighted?: boolean;
}

export default function JobCard({ job, matchPercentage, highlighted = false }: JobCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const applyMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("POST", `/api/jobs/${jobId}/apply`, {
        note: "Applied via job card"
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Application successful",
        description: `Your application for ${job.title} at ${job.company} has been submitted successfully!`,
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Application failed",
        description: error instanceof Error ? error.message : "Failed to submit application",
        variant: "destructive",
      });
    },
  });

  const handleApply = () => {
    if (!user) return;
    
    // Display a toast notification to inform user
    toast({
      title: "Applying for job",
      description: `Submitting your application for ${job.title} at ${job.company}...`
    });
    
    applyMutation.mutate(job.id);
  };

  return (
    <Card 
      className={`mb-4 overflow-hidden border-0 shadow-md hover:shadow-lg transition-all ${
        highlighted ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''
      }`}
    >
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center">
                <div className="mr-3 bg-purple-100 p-2 rounded-md">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{job.title}</h3>
                  <div className="flex items-center text-gray-600">
                    <Building className="h-3.5 w-3.5 mr-1 text-gray-500" />
                    <span className="text-sm">{job.company}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-1.5 text-purple-500" />
                  <span>{job.location}</span>
                </div>
                {job.jobType && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1.5 text-purple-500" />
                    <span>{job.jobType}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.skills?.map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200 text-xs hover:bg-purple-100 rounded-full px-2.5"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4 flex flex-col items-end">
              {matchPercentage && (
                <div className={`text-sm mb-3 rounded-full px-2.5 py-0.5 font-medium ${
                  matchPercentage > 80 ? 'bg-green-100 text-green-800' : 
                  matchPercentage > 60 ? 'bg-purple-100 text-purple-800' : 
                  'bg-blue-100 text-blue-800'
                }`}>
                  {matchPercentage}% Match
                </div>
              )}
              
              <Button 
                className={`px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-sm hover:shadow transition-all ${
                  !user ? 'opacity-70' : ''
                }`}
                onClick={handleApply}
                disabled={applyMutation.isPending || !user}
              >
                {applyMutation.isPending ? "Applying..." : "Apply Now"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
          
          {job.salary && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-700">Salary: </span>
              <span className="text-sm text-gray-600">{job.salary}</span>
              {job.experienceLevel && (
                <span className="ml-4 text-sm font-medium text-gray-700">Experience: </span>
              )}
              {job.experienceLevel && (
                <span className="text-sm text-gray-600">{job.experienceLevel}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
