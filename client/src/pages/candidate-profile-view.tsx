import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Calendar,
  CheckCircle,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  PlayCircle,
  Printer,
  Shield,
  Sparkles,
  Star,
  ThumbsUp,
  UserCheck,
  Volume2,
  VolumeX
} from "lucide-react";

export default function CandidateProfileView() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [notes, setNotes] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoSpeed, setVideoSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  
  // AI Analysis State
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<null | {
    technicalSkills: { name: string; score: number; recommendation: string }[];
    softSkills: { name: string; score: number; recommendation: string }[];
    communicationScore: number;
    overallRecommendation: string;
    jobFitScore: number;
  }>(null);

  // Fetch candidate data
  const { data: candidate, isLoading } = useQuery({
    queryKey: [`/api/users/${id}`],
    queryFn: () => {
      // For demo purposes, using mock data
      return {
        id: parseInt(id as string),
        name: "Arjun Patel",
        username: "arjunpatel",
        title: "Full Stack Developer",
        profileImageUrl: "https://randomuser.me/api/portraits/men/32.jpg",
        bio: "Experienced full-stack developer with 5+ years of experience building scalable web applications. Passionate about clean code and user-centered design.",
        email: "arjun.patel@example.com",
        phone: "+91 98765 43210",
        location: "Bangalore, Karnataka",
        skills: ["JavaScript", "React", "Node.js", "TypeScript", "MongoDB", "Express", "GraphQL", "AWS", "Docker", "CI/CD"],
        digitalCvUrl: "https://example.com/digital-cv-video.mp4",
        education: [
          {
            id: 1,
            institution: "Indian Institute of Technology, Delhi",
            degree: "B.Tech, Computer Science",
            startDate: "2015-08-01",
            endDate: "2019-05-01"
          }
        ],
        experience: [
          {
            id: 1,
            company: "TechSolutions India",
            position: "Senior Developer",
            startDate: "2022-03-01",
            endDate: null,
            current: true,
            description: "Leading development of cloud-based enterprise solutions."
          },
          {
            id: 2,
            company: "WebApps Innovate",
            position: "Developer",
            startDate: "2019-06-01",
            endDate: "2022-02-28",
            current: false,
            description: "Worked on full-stack development using MERN stack."
          }
        ],
        certifications: [
          {
            id: 1,
            name: "AWS Certified Developer - Associate",
            issuer: "Amazon Web Services",
            issueDate: "2021-05-01",
            expiryDate: "2024-05-01"
          },
          {
            id: 2,
            name: "MongoDB Certified Developer",
            issuer: "MongoDB Inc.",
            issueDate: "2020-09-15",
            expiryDate: null
          }
        ],
        projects: [
          {
            id: 1,
            title: "E-commerce Platform",
            description: "Built a full-stack e-commerce platform with React, Node.js, and MongoDB.",
            url: "https://github.com/arjunpatel/ecommerce-platform"
          },
          {
            id: 2,
            title: "Task Management App",
            description: "Developed a collaborative task management application with real-time updates.",
            url: "https://github.com/arjunpatel/task-manager"
          }
        ]
      };
    }
  });

  // Add to shortlist mutation
  const shortlistMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/recruiter/shortlist/${id}`, {
        jobId: 1, // In a real implementation, this would be the actual job ID
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Candidate Shortlisted",
        description: "Candidate has been added to your shortlist.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/shortlist"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to shortlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Schedule interview mutation
  const scheduleMutation = useMutation({
    mutationFn: async (data: { date: string; time: string; type: string }) => {
      const res = await apiRequest("POST", `/api/recruiter/schedule-interview/${id}`, {
        ...data,
        jobId: 1, // In a real implementation, this would be the actual job ID
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Interview Scheduled",
        description: "Interview has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/interviews"] });
      setInterviewModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to schedule interview",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save notes mutation
  const saveNotesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/recruiter/notes/${id}`, {
        notes,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notes Saved",
        description: "Your notes have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save notes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Run AI analysis on Digital CV
  const runAiAnalysis = () => {
    setAiAnalysisLoading(true);
    
    // In a real implementation, this would call an API
    setTimeout(() => {
      setAiAnalysis({
        technicalSkills: [
          { name: "React", score: 85, recommendation: "Strong understanding of React concepts and patterns." },
          { name: "Node.js", score: 82, recommendation: "Good server-side knowledge but could improve on security aspects." },
          { name: "TypeScript", score: 78, recommendation: "Proficient but could benefit from more advanced typing techniques." },
          { name: "MongoDB", score: 73, recommendation: "Basic knowledge present, consider deepening database optimization skills." },
        ],
        softSkills: [
          { name: "Communication", score: 90, recommendation: "Excellent verbal communication skills, very articulate." },
          { name: "Problem Solving", score: 88, recommendation: "Strong analytical thinking and solution-oriented approach." },
          { name: "Teamwork", score: 85, recommendation: "References collaborative experience well." },
          { name: "Time Management", score: 75, recommendation: "Adequate, but could improve prioritization techniques." },
        ],
        communicationScore: 90,
        overallRecommendation: "Arjun presents as a strong candidate with excellent technical skills, particularly in frontend development. His communication is clear and professional, making him suitable for roles requiring client interaction. Consider him for roles that need both technical expertise and communication skills. Recommend proceeding to technical interview stage.",
        jobFitScore: 87
      });
      setAiAnalysisLoading(false);
    }, 2000);
  };

  // Handle interview scheduling
  const scheduleInterview = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const type = formData.get("interviewType") as string;
    
    scheduleMutation.mutate({ date, time, type });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="rounded-lg overflow-hidden mb-6">
            <div className="h-64 bg-gray-200 animate-pulse"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!candidate) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-4 text-center py-12">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Candidate Not Found</h1>
          <p className="text-gray-600 mb-6">The candidate you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate("/talent-pool")}>Back to Talent Pool</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button variant="outline" className="mr-2" onClick={() => navigate("/applicant-tracking")}>
              Back
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">Candidate Profile</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.print()}
              className="hidden md:flex"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print CV
            </Button>
            
            <Button
              variant="outline"
              className="bg-primary/10 text-primary hover:bg-primary/20"
              onClick={() => setInterviewModalOpen(true)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Interview
            </Button>
            
            <Button
              onClick={() => shortlistMutation.mutate()}
              disabled={shortlistMutation.isPending}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {shortlistMutation.isPending ? "Shortlisting..." : "Shortlist"}
            </Button>
          </div>
        </div>

        {/* Profile Header Card */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                  <AvatarImage src={candidate.profileImageUrl} alt={candidate.name} />
                  <AvatarFallback className="text-2xl bg-[#EFE9FF] text-[#8B4DFF]">
                    {candidate.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{candidate.name}</h2>
                      <p className="text-gray-600">{candidate.title}</p>
                      
                      <div className="flex items-center text-gray-500 mt-2">
                        <MapPin className="h-4 w-4 mr-1.5" />
                        <span>{candidate.location}</span>
                      </div>
                    </div>
                    
                    {aiAnalysis && (
                      <div className="mt-4 md:mt-0 bg-white shadow-sm border rounded-md px-4 py-3">
                        <div className="flex items-center">
                          <div className="mr-3">
                            <div className="text-2xl font-bold text-primary">{aiAnalysis.jobFitScore}%</div>
                            <div className="text-xs text-gray-500">Match Score</div>
                          </div>
                          <Sparkles className="h-5 w-5 text-amber-500" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {candidate.skills?.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-white">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="digitalcv" className="flex-1">Digital CV</TabsTrigger>
                <TabsTrigger value="ai" className="flex-1">AI Analysis</TabsTrigger>
              </TabsList>
              
              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                {/* Bio Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{candidate.bio}</p>
                  </CardContent>
                </Card>
                
                {/* Experience Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Experience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {candidate.experience?.map((exp) => (
                        <div key={exp.id} className="border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-medium">{exp.position}</h4>
                              <p className="text-gray-600">{exp.company}</p>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {
                                exp.current 
                                  ? 'Present' 
                                  : exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'
                              }
                            </div>
                          </div>
                          <p className="mt-2 text-gray-700">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Education Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Education</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {candidate.education?.map((edu) => (
                        <div key={edu.id} className="border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-medium">{edu.degree}</h4>
                              <p className="text-gray-600">{edu.institution}</p>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {
                                edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'
                              }
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Certifications Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Certifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {candidate.certifications?.map((cert) => (
                        <div key={cert.id} className="border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-medium">{cert.name}</h4>
                              <p className="text-gray-600">{cert.issuer}</p>
                            </div>
                            <div className="text-sm text-gray-500">
                              Issued: {new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              {cert.expiryDate && ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Projects Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {candidate.projects?.map((project) => (
                        <div key={project.id} className="border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{project.title}</h4>
                              <p className="mt-1 text-gray-700">{project.description}</p>
                            </div>
                            {project.url && (
                              <a 
                                href={project.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 flex items-center"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* DIGITAL CV TAB */}
              <TabsContent value="digitalcv" className="mt-6 space-y-6">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Video Introduction</span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setMuted(!muted)}>
                          {muted ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="text-sm font-normal">
                          Speed: 
                          <select
                            value={videoSpeed}
                            onChange={(e) => setVideoSpeed(parseFloat(e.target.value))}
                            className="ml-1 border-none bg-transparent focus:ring-0 focus:outline-none px-1 py-0 text-sm"
                          >
                            <option value="0.5">0.5x</option>
                            <option value="0.75">0.75x</option>
                            <option value="1">1x</option>
                            <option value="1.25">1.25x</option>
                            <option value="1.5">1.5x</option>
                            <option value="2">2x</option>
                          </select>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowTranscript(!showTranscript)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          {showTranscript ? "Hide Transcript" : "Show Transcript"}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative aspect-video bg-black">
                      {/* This would be an actual video player in a real implementation */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-20 w-20 rounded-full text-white bg-black/50 hover:bg-black/60"
                            onClick={() => setIsPlaying(!isPlaying)}
                          >
                            {isPlaying ? (
                              <span className="text-4xl">||</span>
                            ) : (
                              <PlayCircle className="h-12 w-12" />
                            )}
                          </Button>
                          {!isPlaying && (
                            <p className="text-white mt-4">Click to watch {candidate.name}'s introduction</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Video security notice */}
                      <div className="absolute bottom-2 right-2 flex items-center bg-black/70 text-white text-xs px-3 py-1 rounded-full">
                        <Shield className="h-3 w-3 mr-1" />
                        Protected Video
                      </div>
                    </div>
                    
                    {/* Video Progress */}
                    <div className="p-4">
                      <Progress value={isPlaying ? 45 : 0} className="h-1.5" />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>{isPlaying ? "1:12" : "0:00"}</span>
                        <span>2:30</span>
                      </div>
                    </div>
                    
                    {/* Transcript */}
                    {showTranscript && (
                      <div className="border-t p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Transcript</h4>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="max-h-60 overflow-y-auto text-gray-700 text-sm space-y-2">
                          <p><span className="text-gray-500 inline-block w-12">0:00</span> Hi, I'm Arjun Patel, a full-stack developer with over 5 years of experience building web applications.</p>
                          <p><span className="text-gray-500 inline-block w-12">0:15</span> I specialize in JavaScript frameworks like React and have extensive experience with Node.js backend development.</p>
                          <p><span className="text-gray-500 inline-block w-12">0:30</span> In my current role at TechSolutions, I'm leading the development of cloud-based enterprise solutions.</p>
                          <p><span className="text-gray-500 inline-block w-12">0:45</span> One of my recent achievements was optimizing our application's performance, reducing load times by 40%.</p>
                          <p><span className="text-gray-500 inline-block w-12">1:00</span> I'm passionate about clean code, user-centered design, and staying up-to-date with the latest web technologies.</p>
                          <p><span className="text-gray-500 inline-block w-12">1:15</span> I'm looking for a role where I can further develop my skills in scalable application architecture and team leadership.</p>
                          <p><span className="text-gray-500 inline-block w-12">1:30</span> I believe my expertise in both frontend and backend development, combined with my problem-solving abilities, make me a good fit for your team.</p>
                          <p><span className="text-gray-500 inline-block w-12">1:45</span> I'm particularly interested in opportunities that involve emerging technologies and complex challenges.</p>
                          <p><span className="text-gray-500 inline-block w-12">2:00</span> Thank you for considering my application. I look forward to potentially discussing how I can contribute to your organization.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-gray-50 text-sm text-gray-500 flex justify-between items-center py-3">
                    <div className="flex items-center">
                      <ThumbsUp className="h-4 w-4 mr-1 text-primary" />
                      Video profile verified
                    </div>
                    <div>
                      Created: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* AI ANALYSIS TAB */}
              <TabsContent value="ai" className="mt-6 space-y-6">
                {!aiAnalysis ? (
                  <Card>
                    <CardContent className="pt-6 text-center py-12">
                      <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
                      <h3 className="text-xl font-medium mb-2">AI-Powered Candidate Analysis</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Get a comprehensive analysis of the candidate's skills, communication style, and job fit based on their Digital CV.
                      </p>
                      <Button 
                        onClick={runAiAnalysis} 
                        disabled={aiAnalysisLoading}
                        className="mx-auto"
                      >
                        {aiAnalysisLoading ? "Analyzing..." : "Analyze Candidate"}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Overall Match Score */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Overall Assessment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-lg">Job Fit Score</h4>
                            <p className="text-gray-600">Based on skills match and communication assessment</p>
                          </div>
                          <div className="text-4xl font-bold text-primary">{aiAnalysis.jobFitScore}%</div>
                        </div>
                        <Progress value={aiAnalysis.jobFitScore} className="h-2.5 mb-4" />
                        <div className="p-4 bg-gray-50 rounded-md">
                          <h4 className="font-medium mb-2">AI Recommendation</h4>
                          <p className="text-gray-700">{aiAnalysis.overallRecommendation}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Technical Skills Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Technical Skills Assessment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {aiAnalysis.technicalSkills.map((skill, index) => (
                            <div key={index}>
                              <div className="flex justify-between mb-1">
                                <div className="font-medium">{skill.name}</div>
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${i < Math.round(skill.score / 20) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                  <span className="ml-2 text-sm font-medium">{skill.score}%</span>
                                </div>
                              </div>
                              <Progress value={skill.score} className="h-2 mb-1" />
                              <p className="text-sm text-gray-600">{skill.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Soft Skills Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Soft Skills Assessment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {aiAnalysis.softSkills.map((skill, index) => (
                            <div key={index}>
                              <div className="flex justify-between mb-1">
                                <div className="font-medium">{skill.name}</div>
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${i < Math.round(skill.score / 20) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                  <span className="ml-2 text-sm font-medium">{skill.score}%</span>
                                </div>
                              </div>
                              <Progress value={skill.score} className="h-2 mb-1" />
                              <p className="text-sm text-gray-600">{skill.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Communication Assessment */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Communication Assessment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <div className="flex justify-between mb-1">
                            <div className="font-medium">Overall Communication Score</div>
                            <div className="font-medium">{aiAnalysis.communicationScore}%</div>
                          </div>
                          <Progress value={aiAnalysis.communicationScore} className="h-2.5" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          <div className="p-4 bg-gray-50 rounded-md">
                            <h4 className="font-medium mb-2 text-sm text-gray-600">CLARITY</h4>
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < 5 ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                            <p className="text-sm mt-2">Exceptional clarity in explanations</p>
                          </div>
                          
                          <div className="p-4 bg-gray-50 rounded-md">
                            <h4 className="font-medium mb-2 text-sm text-gray-600">ARTICULATION</h4>
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                            <p className="text-sm mt-2">Very well articulated thoughts</p>
                          </div>
                          
                          <div className="p-4 bg-gray-50 rounded-md">
                            <h4 className="font-medium mb-2 text-sm text-gray-600">CONFIDENCE</h4>
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < 5 ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                            <p className="text-sm mt-2">Highly confident presentation</p>
                          </div>
                          
                          <div className="p-4 bg-gray-50 rounded-md">
                            <h4 className="font-medium mb-2 text-sm text-gray-600">ENGAGEMENT</h4>
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                            <p className="text-sm mt-2">Engages well with the audience</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right column - Contact and Notes */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  <a href={`mailto:${candidate.email}`} className="text-primary hover:underline">
                    {candidate.email}
                  </a>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <a href={`tel:${candidate.phone}`} className="text-primary hover:underline">
                    {candidate.phone}
                  </a>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{candidate.location}</span>
                </div>
                
                <div className="pt-3 flex gap-2">
                  <Button className="flex-1" variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button className="flex-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Recruiter Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Recruiter Notes</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => saveNotesMutation.mutate()}
                    disabled={saveNotesMutation.isPending}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    {saveNotesMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add private notes about this candidate..."
                  className="min-h-[120px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Notes are private and only visible to you
                </p>
              </CardContent>
            </Card>
            
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("digitalcv")}>
                  <PlayCircle className="h-4 w-4 mr-2 text-primary" />
                  View Digital CV
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => runAiAnalysis()}>
                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                  Analyze with AI
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setInterviewModalOpen(true)}
                >
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  Schedule Interview
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => shortlistMutation.mutate()}
                  disabled={shortlistMutation.isPending}
                >
                  <UserCheck className="h-4 w-4 mr-2 text-primary" />
                  {shortlistMutation.isPending ? "Shortlisting..." : "Shortlist Candidate"}
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2 text-primary" />
                  Print Resume
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.print()}>
                  <Download className="h-4 w-4 mr-2 text-primary" />
                  Download Resume
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Schedule Interview Modal */}
      <Dialog open={interviewModalOpen} onOpenChange={setInterviewModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Set up an interview with {candidate.name} for the selected job position.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={scheduleInterview}>
            <div className="grid gap-4 py-4">
              <div>
                <label htmlFor="jobPosition" className="block text-sm font-medium mb-1">
                  Job Position
                </label>
                <select
                  id="jobPosition"
                  className="w-full rounded-md border border-input px-3 py-2"
                >
                  <option>Senior Business Analyst</option>
                  <option>Product Manager</option>
                  <option>Data Scientist</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium mb-1">
                    Date
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    required
                    className="w-full rounded-md border border-input px-3 py-2"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label htmlFor="time" className="block text-sm font-medium mb-1">
                    Time
                  </label>
                  <input
                    id="time"
                    name="time"
                    type="time"
                    required
                    className="w-full rounded-md border border-input px-3 py-2"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="interviewType" className="block text-sm font-medium mb-1">
                  Interview Type
                </label>
                <select
                  id="interviewType"
                  name="interviewType"
                  className="w-full rounded-md border border-input px-3 py-2"
                  required
                >
                  <option value="video">Video Call</option>
                  <option value="phone">Phone Call</option>
                  <option value="inperson">In-person</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="w-full rounded-md border border-input px-3 py-2"
                  placeholder="Add any notes or specific topics to cover..."
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInterviewModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={scheduleMutation.isPending}>
                {scheduleMutation.isPending ? "Scheduling..." : "Schedule Interview"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}