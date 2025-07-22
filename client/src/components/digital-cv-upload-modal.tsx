import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Upload, X, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VideoAnalysis {
  summary: string;
  keyStrengths: string[];
  improvementAreas: string[];
  overallScore: number;
  feedback: string;
}

interface DigitalCvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DigitalCvUploadModal({ isOpen, onClose }: DigitalCvUploadModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    // Check file type
    if (!file.type.includes("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (200MB max)
    if (file.size > 200 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file under 200MB",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a video file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload your Digital CV",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus("uploading");

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('video', selectedFile);

      console.log('Uploading file:', selectedFile.name, selectedFile.size, selectedFile.type);
      console.log('User authenticated:', !!user, user?.id);

      // Upload the video file
      const response = await fetch('/api/digital-cv/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          // Don't set Content-Type header when using FormData - let browser set it with boundary
        },
      });

      console.log('Upload response status:', response.status);
      console.log('Upload response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 413) {
          throw new Error('File too large. Please select a smaller video file (under 200MB).');
        } else if (response.status === 400) {
          throw new Error('Invalid file type. Please select a video file.');
        } else {
          throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      // Update upload progress to 100%
      setUploadProgress(100);
      setUploadStatus("success");
      setAnalysis(result.analysis);
      
      // Invalidate user query to refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Also invalidate any other queries that might cache user data
      queryClient.invalidateQueries({ queryKey: ["user"] });
      
      // Force refetch and wait for it to complete
      await queryClient.refetchQueries({ queryKey: ["/api/user"] });
      
      // Clear all caches related to user data as a fallback
      queryClient.removeQueries({ queryKey: ["/api/user"] });
      queryClient.removeQueries({ queryKey: ["user"] });
      
      // Also manually update the cache with the new video URL to ensure immediate update
      const currentUser = queryClient.getQueryData(["/api/user"]);
      if (currentUser && typeof currentUser === 'object') {
        queryClient.setQueryData(["/api/user"], {
          ...currentUser,
          digitalCvUrl: result.videoUrl
        });
      }

      toast({
        title: "Upload successful",
        description: "Your Digital CV has been analyzed and uploaded successfully",
      });

      // Close modal after showing analysis for a moment
      setTimeout(() => {
        onClose();
        setUploadStatus("idle");
        setUploadProgress(0);
        setSelectedFile(null);
        setAnalysis(null);
        setIsUploading(false);
      }, 3000); // Reduced time to show success state
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus("error");
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload Digital CV. Please check console for details.",
        variant: "destructive",
      });
    } finally {
      clearInterval(interval);
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    // Check file type
    if (!file.type.includes("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (200MB max)
    if (file.size > 200 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file under 200MB",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
  };

  const handleCancel = () => {
    if (isUploading) return;
    onClose();
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus("idle");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Your Digital CV</DialogTitle>
          <DialogDescription>
            Upload a 45-second to 1-minute video introducing yourself, showcasing your skills and career aspirations.
          </DialogDescription>
        </DialogHeader>

        <div 
          className={`border-2 border-dashed ${
            uploadStatus === "error" 
              ? "border-red-300" 
              : selectedFile 
                ? "border-primary-300" 
                : "border-gray-300"
          } rounded-lg p-6 text-center`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {uploadStatus === "uploading" ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-gray-500">Uploading {selectedFile?.name}...</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p className="text-sm text-gray-500">{uploadProgress}% complete</p>
            </div>
          ) : uploadStatus === "success" ? (
            <div className="space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-green-600 font-medium">Upload complete!</p>
              <p className="text-gray-500 text-sm">Your Digital CV has been analyzed successfully.</p>
              
              {analysis && (
                <div className="text-left space-y-3 bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <h4 className="font-medium text-purple-800">AI Analysis Results</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Overall Score</p>
                      <div className="flex items-center gap-2">
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                          {analysis.overallScore}/10
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Summary</p>
                      <p className="text-sm text-gray-600">{analysis.summary}</p>
                    </div>
                    
                    {analysis.keyStrengths.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Key Strengths</p>
                        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                          {analysis.keyStrengths.slice(0, 2).map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Feedback</p>
                      <p className="text-sm text-gray-600">{analysis.feedback}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : uploadStatus === "error" ? (
            <div className="space-y-2">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-red-600 font-medium">Upload failed</p>
              <p className="text-gray-500 text-sm">There was an error uploading your Digital CV. Please try again.</p>
            </div>
          ) : selectedFile ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-primary-600 font-medium">{selectedFile.name}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-full"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-gray-500 text-sm">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 mb-2">Drag and drop your video file here</p>
              <p className="text-gray-400 text-sm mb-3">
                MP4, MOV or AVI format (max size: 200MB)
              </p>
              <div className="relative">
                <Button>
                  Select Video
                </Button>
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  accept="video/*"
                  onChange={handleFileSelect}
                />
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-gray-800">Guidelines for a great Digital CV:</h3>
          <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
            <li>Ensure good lighting and clear audio</li>
            <li>Briefly introduce yourself and your professional background</li>
            <li>Highlight key skills and accomplishments</li>
            <li>Mention your career aspirations</li>
            <li>Keep it concise and engaging (under 1 minute)</li>
          </ul>
        </div>
        
        <DialogFooter className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={uploadStatus === "uploading"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadStatus === "uploading" || uploadStatus === "success"}
          >
            Upload Digital CV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
