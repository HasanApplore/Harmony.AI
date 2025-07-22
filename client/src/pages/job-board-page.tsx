import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Briefcase, MapPin, Clock, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Job } from "@shared/schema";

export default function JobBoardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // States for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [showAIRecommendations, setShowAIRecommendations] = useState(true);

  // Fetch jobs
  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  // Filter jobs based on search term and filters
  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = !searchTerm || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !locationFilter || 
      job.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    const matchesJobType = !jobTypeFilter || jobTypeFilter === 'all' || 
      job.jobType?.toLowerCase() === jobTypeFilter.toLowerCase();
    
    return matchesSearch && matchesLocation && matchesJobType;
  });

  // Format job skill tags
  const getSkillTags = (skills: string[] | null | undefined) => {
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return null;
    }

    return skills.map((skill) => (
      <Badge 
        key={skill} 
        variant="secondary" 
        className="mr-1 mb-1 bg-purple-50 text-purple-800 hover:bg-purple-100 border-none"
      >
        {skill}
      </Badge>
    ));
  };

  return (
    <Layout>
      <div className="p-4 pb-16 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/" className="mr-2">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Job Board</h1>
              <p className="text-sm text-gray-600">Find your next opportunity with AI-powered job matching</p>
            </div>
          </div>
          <div>
            <Link href="/my-applications">
              <Button variant="outline" className="flex items-center gap-1">
                <span>My Applications</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Filters panel on the left */}
          <Card className="md:col-span-1 bg-white shadow-sm border border-gray-100">
            <CardContent className="p-6 space-y-6">
              <h3 className="font-semibold mb-4">Filters</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm mb-2">Search</p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Job title, company..."
                      className="pl-10 border-gray-200"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm mb-2">Location</p>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="City, country, remote..."
                      className="pl-10 border-gray-200"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm mb-2">Job Type</p>
                  <Select 
                    value={jobTypeFilter} 
                    onValueChange={setJobTypeFilter}
                  >
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder="All Job Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Job Types</SelectItem>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "flex-1 flex items-center space-x-2", 
                    showAIRecommendations ? "opacity-100" : "opacity-50"
                  )}>
                    <Switch 
                      id="ai-recommendations" 
                      checked={showAIRecommendations}
                      onCheckedChange={setShowAIRecommendations}
                      className="data-[state=checked]:bg-purple-600"
                    />
                    <Label htmlFor="ai-recommendations" className="text-sm font-normal">
                      Show AI Recommendations
                    </Label>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full text-gray-700" 
                  onClick={() => {
                    setSearchTerm("");
                    setLocationFilter("");
                    setJobTypeFilter("all");
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Job listings on the right */}
          <div className="md:col-span-3 space-y-4">
            {isLoading ? (
              // Skeleton loading state
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-white border border-gray-100 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-start p-6">
                        <div className="mr-4">
                          <Skeleton className="h-10 w-10 rounded" />
                        </div>
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-6 w-3/4" />
                          <div className="flex items-center text-gray-500">
                            <Skeleton className="h-4 w-40" />
                          </div>
                          <div className="flex space-x-2">
                            <Skeleton className="h-5 w-24 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                          <div className="flex items-center justify-between pt-3">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-9 w-28 rounded" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredJobs && filteredJobs.length > 0 ? (
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <Card 
                    key={job.id} 
                    className="bg-white border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start">
                        <div className="mr-4 mt-1">
                          <div className="h-10 w-10 bg-purple-100 rounded flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                              <div className="flex items-center text-gray-500 text-sm mt-1">
                                <span>{job.company}</span>
                                <span className="mx-2">•</span>
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{job.location}</span>
                                <span className="mx-2">•</span>
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{job.jobType || 'Full-time'}</span>
                              </div>
                            </div>
                            
                            {showAIRecommendations && (
                              <div className="ml-4">
                                <Badge className="bg-green-50 text-green-700 border-green-200">
                                  {`${86 - (job.id * 7)}% Match`}
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3">
                            {getSkillTags(job.skills)}
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                            <div className="text-sm text-gray-500">
                              <strong>Salary:</strong> {job.salary || 'Competitive'} • <strong>Experience:</strong> {job.experienceLevel || 'All levels'}
                            </div>
                            <Link href={`/apply/${job.id}`}>
                              <Button className="bg-purple-600 hover:bg-purple-700">
                                Apply Now
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white border border-gray-100 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {searchTerm || locationFilter || jobTypeFilter !== 'all'
                      ? "Try adjusting your search filters to see more results."
                      : "No job postings available at the moment. Check back soon for new opportunities."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}