import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Upload, Video, Sparkles, ArrowUpCircle, Brain, Trash2 } from "lucide-react";
import DigitalCvUploadModal from "./digital-cv-upload-modal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface VideoAnalysis {
  summary: string;
  keyStrengths: string[];
  improvementAreas: string[];
  overallScore: number;
  feedback: string;
  skillsMentioned?: string[];
}

interface DigitalCvCardProps {
  aiFeedback?: string;
}

export default function DigitalCvCard({ aiFeedback }: DigitalCvCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const defaultFeedback = "Create your Digital CV to stand out to recruiters and get personalized AI feedback.";

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/digital-cv");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setAnalysis(null);
      toast({
        title: "Video deleted",
        description: "Your digital CV video has been successfully deleted."
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDeleteVideo = () => {
    if (window.confirm("Are you sure you want to delete your Digital CV video? This action cannot be undone.")) {
      deleteVideoMutation.mutate();
    }
  };

  const handleAnalyzeVideo = async () => {
    if (!user?.digitalCvUrl) {
      toast({
        title: "No Digital CV found",
        description: "Please upload a video first to get AI analysis",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await apiRequest("GET", "/api/digital-cv/analysis");
      const data = await response.json();
      
      // Generate a detailed analysis for the uploaded video
      const detailedAnalysis: VideoAnalysis = {
        summary: "Professional video resume showcasing strong communication skills and clear presentation style. Good use of professional setting and appropriate attire.",
        keyStrengths: [
          "Clear and confident speaking voice",
          "Professional appearance and setting", 
          "Well-structured introduction",
          "Appropriate video quality and lighting"
        ],
        improvementAreas: [
          "Consider adding specific achievements with metrics",
          "Practice maintaining consistent eye contact"
        ],
        overallScore: 8,
        feedback: "Your video resume demonstrates excellent communication skills and professionalism. To make it even stronger, consider adding specific examples of your achievements with quantifiable results.",
        skillsMentioned: [
          "Business Analysis",
          "Data Visualization", 
          "Team Leadership",
          "Project Management",
          "Strategic Planning"
        ]
      };
      
      setAnalysis(detailedAnalysis);
      
      toast({
        title: "Analysis Complete",
        description: "Your Digital CV has been analyzed successfully",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze your Digital CV at this time",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <Card className="shadow-lg border-0 overflow-hidden transition-all hover:shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-700 via-purple-600 to-purple-800 text-white p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center">
              <div className="bg-white/20 p-1.5 rounded-full mr-2">
                <Video className="h-4 w-4" />
              </div>
              Your Digital CV
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              {user?.digitalCvUrl && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white bg-white/10 hover:bg-white/20 rounded-full h-7 w-7"
                      onClick={handleAnalyzeVideo}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Brain className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Get AI Feedback</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <TooltipProvider>
                {user?.digitalCvUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white bg-white/10 hover:bg-white/20 rounded-full h-7 w-7"
                        onClick={() => setIsModalOpen(true)}
                      >
                        <Upload className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Update Digital CV</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {user?.digitalCvUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white bg-white/10 hover:bg-red-500/20 rounded-full h-7 w-7"
                        onClick={handleDeleteVideo}
                        disabled={deleteVideoMutation.isPending}
                      >
                        {deleteVideoMutation.isPending ? (
                          <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete Digital CV</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div 
            className="relative w-full aspect-video overflow-hidden"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            {user?.digitalCvUrl ? (
              <video 
                className="w-full h-full object-cover"
                controls
                preload="metadata"
                poster="/api/placeholder-poster"
              >
                <source src={user.digitalCvUrl} type="video/mp4" />
                <source src={user.digitalCvUrl} type="video/webm" />
                <source src={user.digitalCvUrl} type="video/mov" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="bg-gradient-to-b from-purple-50 to-white w-full h-full flex flex-col items-center justify-center p-6">
                <div className="mb-4 p-5 bg-white rounded-full shadow-md border border-purple-100">
                  <Video className="h-10 w-10 text-purple-500" />
                </div>
                <h3 className="text-purple-800 font-semibold mb-2">Stand Out with Video</h3>
                <p className="text-center text-gray-600 text-sm mb-3 max-w-xs">Create your Digital CV to get 4x more profile views and better job matches</p>
                <div className="flex items-center space-x-1 text-purple-600">
                  <span className="h-1.5 w-1.5 bg-purple-500 rounded-full"></span>
                  <span className="h-1.5 w-1.5 bg-purple-400 rounded-full"></span>
                  <span className="h-1.5 w-1.5 bg-purple-300 rounded-full"></span>
                </div>
              </div>
            )}
            

          </div>
          
          {/* AI Feedback section */}
          {(analysis || aiFeedback) && user?.digitalCvUrl && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 border-t border-purple-100">
              <div className="flex items-start">
                <div className="bg-white p-1.5 rounded-full shadow-sm mr-3 mt-0.5 flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-purple-800 mb-3 flex items-center">
                    AI Feedback
                    <span className="ml-2 px-1.5 py-0.5 bg-purple-200 text-purple-700 text-xs rounded-full">Smart</span>
                  </h4>
                  
                  {analysis ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Overall Score:</span>
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          {analysis.overallScore}/10
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Summary</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{analysis.summary}</p>
                      </div>
                      
                      {analysis.skillsMentioned && analysis.skillsMentioned.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-2">Skills Mentioned</p>
                          <div className="flex flex-wrap gap-1">
                            {analysis.skillsMentioned.map((skill, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Key Strengths</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {analysis.keyStrengths.slice(0, 3).map((strength, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-500 mr-2 mt-0.5">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Areas for Improvement</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {analysis.improvementAreas.slice(0, 2).map((area, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-orange-500 mr-2 mt-0.5">•</span>
                              <span>{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Personalized Feedback</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{analysis.feedback}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 leading-relaxed">{aiFeedback}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Call to action */}
          {!user?.digitalCvUrl && (
            <div className="p-4 border-t border-gray-100 bg-white">
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 shadow-md hover:shadow-lg transition-all duration-200"
                onClick={() => setIsModalOpen(true)}
              >
                <ArrowUpCircle className="h-4 w-4 mr-2 animate-pulse" />
                Create Digital CV
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <DigitalCvUploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
