import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout';
import { ChevronRight, Briefcase, MapPin, Clock, DollarSign, Search, Building, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import '../styles/job-page.css';

// Import at top of file
import { useAuth } from '@/hooks/use-auth';

// Add these code somewhere near the top of the component
const JobCard: React.FC<{
  job: any;
  matchPercentage: number;
}> = ({ job, matchPercentage }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSaveJob = async (jobId: number) => {
    try {
      await apiRequest('POST', `/api/jobs/${jobId}/save`);
      toast({
        title: 'Job saved',
        description: 'This job has been added to your saved jobs',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/saved'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save job. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleApplyJob = async (jobId: number) => {
    try {
      await apiRequest('POST', `/api/jobs/${jobId}/apply`);
      toast({
        title: 'Application submitted',
        description: 'Your application has been submitted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/applications'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="job-card">
      <div className="job-card-header">
        <div>
          <h3 className="job-title">{job.title}</h3>
          <div className="job-company">
            <Building className="h-3 w-3 mr-1" />
            {job.company}
          </div>
          <div className="job-location">
            <MapPin className="h-4 w-4" />
            {job.location}
          </div>
        </div>
        <div className={`job-match-badge ${matchPercentage >= 70 ? 'high' : ''}`}>
          {matchPercentage}% Match
        </div>
      </div>
      <div className="job-content">
        <div className="job-skills">
          {job.skills.map((skill: string, index: number) => (
            <span key={index} className="job-skill-badge">
              {skill}
            </span>
          ))}
        </div>
      </div>
      <div className="job-footer">
        <div className="job-meta">
          <div className="job-meta-item">
            <DollarSign className="h-4 w-4" />
            {job.salary}
          </div>
          <div className="job-meta-item">
            <Clock className="h-4 w-4" />
            {job.experienceLevel}
          </div>
        </div>
        <button 
          className="job-apply-button"
          onClick={() => handleApplyJob(job.id)}
        >
          Apply Now
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const JobBoard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showAiRecommendations, setShowAiRecommendations] = useState(true);
  const [experienceFilter, setExperienceFilter] = useState('All');
  const [jobTypeFilter, setJobTypeFilter] = useState('All Job Types');

  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/jobs'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: savedJobs = [] } = useQuery({
    queryKey: ['/api/jobs/saved'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const resetFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setExperienceFilter('All');
    setJobTypeFilter('All Job Types');
  };

  // Calculation of match percentage would typically be done by the AI
  // This is a simple mock implementation for demo purposes
  const getMatchPercentage = (jobId: number) => {
    // In a real scenario, this would be calculated based on user skills and job requirements
    // Here we just use a deterministic formula based on the job ID
    return Math.floor(60 + (jobId * 15) % 30);
  };

  const filteredJobs = jobs.filter((job: any) => {
    // Apply search filter
    const matchesSearch = !searchTerm || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply location filter
    const matchesLocation = !locationFilter || 
      job.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    // Apply experience filter
    const matchesExperience = experienceFilter === 'All' || 
      job.experienceLevel.includes(experienceFilter);
    
    // Apply job type filter
    const matchesJobType = jobTypeFilter === 'All Job Types' || 
      job.jobType.includes(jobTypeFilter);
    
    return matchesSearch && matchesLocation && matchesExperience && matchesJobType;
  });

  return (
    <Layout>
      <div className="job-board-container">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="job-board-header">
            <h1 className="job-board-title">Job Board</h1>
            <p className="job-board-subtitle">Find your next opportunity with AI-powered job matching</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters sidebar */}
            <div className="lg:col-span-1">
              <div className="filter-card">
                <div className="filter-section">
                  <h3 className="filter-heading">Search</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Job title, company..."
                      className="filter-input pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setSearchTerm('')}
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="filter-section">
                  <h3 className="filter-heading">Location</h3>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="City, country, remote..."
                      className="filter-input pl-10"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    />
                    {locationFilter && (
                      <button 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setLocationFilter('')}
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="filter-section">
                  <h3 className="filter-heading">Job Type</h3>
                  <select
                    className="filter-input"
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value)}
                  >
                    <option>All Job Types</option>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Freelance</option>
                    <option>Internship</option>
                  </select>
                </div>
                
                <div className="filter-section">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="filter-heading mb-0">Show AI Recommendations</h3>
                    <Switch 
                      checked={showAiRecommendations}
                      onCheckedChange={setShowAiRecommendations}
                      className="filter-toggle"
                    />
                  </div>
                </div>
                
                <button 
                  className="filter-reset"
                  onClick={resetFilters}
                >
                  Reset Filters
                </button>
              </div>
            </div>
            
            {/* Job listings */}
            <div className="lg:col-span-3">
              {filteredJobs.length === 0 ? (
                <div className="bg-white p-8 rounded-lg text-center">
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No jobs found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((job: any) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      matchPercentage={getMatchPercentage(job.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JobBoard;