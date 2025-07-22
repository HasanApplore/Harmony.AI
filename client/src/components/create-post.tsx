import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Image, Video, FileText, Link2, Mic, Smile, Loader2, Upload, X, Sparkles } from "lucide-react";
import { AiPostSuggestionsModal } from "./ai-post-suggestions-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface CreatePostProps {
  className?: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

export default function CreatePost({ 
  className = "", 
  initialContent = "", 
  onContentChange 
}: CreatePostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(initialContent ? true : false);

  // Listen for changes in initialContent
  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
      setIsExpanded(true);
    }
  }, [initialContent]);
  
  // Attachment states
  const [attachments, setAttachments] = useState<{
    type: string;
    data: string;
  }[]>([]);
  
  // Dialog states
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  

  
  const [feelingDialogOpen, setFeelingDialogOpen] = useState(false);
  const [feeling, setFeeling] = useState("");
  
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // AI Suggestions state
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);

  const handleAiSuggestionSelect = (suggestedContent: string) => {
    setContent(suggestedContent);
    setIsExpanded(true);
    if (onContentChange) {
      onContentChange(suggestedContent);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !content.trim()) return;

    setIsSubmitting(true);
    try {
      // Create post data with required fields
      const postData = {
        userId: user.id,
        content: content.trim(),
        communityId: null,
        isAnonymous: false
      };

      console.log("Attempting to create post with data:", postData);
      
      // Send the post data to the server
      const response = await apiRequest("POST", "/api/posts", postData);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to create post: ${response.status} ${response.statusText}`
        );
      }
      
      // Clear the content and reset the UI
      setContent("");
      setIsExpanded(false);
      setAttachments([]);
      
      // Invalidate and refetch posts query to refresh the feed
      await queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      await queryClient.refetchQueries({ queryKey: ["/api/posts"] });
      
      toast({
        title: "Success!",
        description: "Your post has been published successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error("Post creation error:", error);
      toast({
        title: "Post creation failed",
        description: error instanceof Error ? error.message : "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // For demo purposes, create a file preview URL
    const fileUrl = URL.createObjectURL(file);
    setPhotoPreview(fileUrl);
  };
  
  const handlePhotoUpload = () => {
    if (photoPreview) {
      // In a real app we'd upload the photo to storage and store the URL
      addAttachment('photo', photoPreview);
      toast({
        title: "Photo added",
        description: "Your photo has been added to your post.",
      });
      setPhotoPreview(null);
    }
    setPhotoDialogOpen(false);
  };

  // Handler for link
  const handleLinkAdd = () => {
    if (linkUrl) {
      addAttachment('link', linkUrl);
      // Add a visual indicator in the post content
      setContent(prev => {
        if (prev) return `${prev}\n\nShared link: ${linkUrl}`;
        return `Shared link: ${linkUrl}`;
      });
      toast({
        title: "Link added",
        description: "Your link has been added to your post.",
      });
      setLinkUrl("");
    }
    setLinkDialogOpen(false);
  };



  // Handler for feeling
  const handleFeelingAdd = () => {
    if (feeling) {
      addAttachment('feeling', feeling);
      setContent(prev => {
        if (prev) return `${prev}\n\nFeeling ${feeling}`;
        return `Feeling ${feeling}`;
      });
      toast({
        title: "Feeling added",
        description: `Added that you're feeling ${feeling} to your post.`,
      });
      setFeeling("");
    }
    setFeelingDialogOpen(false);
  };
  
  // Handler for video upload
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // For demo purposes, create a file preview URL
    const fileUrl = URL.createObjectURL(file);
    setVideoPreview(fileUrl);
  };
  
  const handleVideoUpload = () => {
    if (videoPreview) {
      // In a real app we'd upload the video to storage and store the URL
      addAttachment('video', videoPreview);
      setContent(prev => {
        if (prev) return `${prev}\n\nShared a video`;
        return `Shared a video`;
      });
      toast({
        title: "Video added",
        description: "Your video has been added to your post.",
      });
      setVideoPreview(null);
    }
    setVideoDialogOpen(false);
  };
  
  // Handler for document upload
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setDocumentFile(file);
    setDocumentName(file.name);
  };
  
  const handleDocumentUpload = () => {
    if (documentFile && documentName) {
      // In a real app we'd upload the document to storage and store the URL
      addAttachment('document', documentName);
      setContent(prev => {
        if (prev) return `${prev}\n\nShared document: ${documentName}`;
        return `Shared document: ${documentName}`;
      });
      toast({
        title: "Document added",
        description: "Your document has been added to your post.",
      });
      setDocumentFile(null);
      setDocumentName("");
    }
    setDocumentDialogOpen(false);
  };
  
  // Handler for voice recording
  const startRecording = async () => {
    try {
      // Request permissions for audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create a MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Set up a timer to track recording duration
      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);
      
      // Collect data when available
      mediaRecorder.addEventListener('dataavailable', (event) => {
        audioChunks.push(event.data);
      });
      
      // When recording stops
      mediaRecorder.addEventListener('stop', () => {
        // Create a blob from the audio chunks
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        setAudioBlob(audioBlob);
        clearInterval(timer);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      });
      
      // Set the mediaRecorder to window for access
      (window as any).mediaRecorder = mediaRecorder;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Recording failed",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive"
      });
      setIsRecording(false);
    }
  };
  
  const stopRecording = () => {
    const mediaRecorder = (window as any).mediaRecorder;
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };
  
  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingDuration(0);
    setVoiceDialogOpen(false);
  };
  
  const addVoiceRecording = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      addAttachment('voice', audioUrl);
      setContent(prev => {
        if (prev) return `${prev}\n\nShared a voice recording (${recordingDuration}s)`;
        return `Shared a voice recording (${recordingDuration}s)`;
      });
      toast({
        title: "Voice recording added",
        description: "Your voice recording has been added to your post.",
      });
      setAudioBlob(null);
      setRecordingDuration(0);
    }
    setVoiceDialogOpen(false);
  };

  // Function to format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to add an attachment
  const addAttachment = (type: string, data: string) => {
    setAttachments(prev => [...prev, { type, data }]);
  };

  // Function to remove an attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <Card className={`bg-white border border-gray-200 shadow-sm ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.name || user?.username || ""} />
              <AvatarFallback className="bg-purple-100 text-purple-800 text-lg">
                {user?.name?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase() || ""}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="relative">
                <Textarea
                  placeholder="Share your thoughts, experiences, or insights..."
                  className="resize-none mb-2 bg-gray-50 focus:bg-white border-gray-300 focus:border-purple-400 transition-all rounded-xl p-3 min-h-[60px] text-gray-700 placeholder:text-gray-500"
                  rows={isExpanded ? 4 : 2}
                  value={content}
                  onChange={(e) => {
                    const newContent = e.target.value;
                    setContent(newContent);
                    // Notify parent component if handler is provided
                    if (onContentChange) {
                      onContentChange(newContent);
                    }
                  }}
                  onFocus={() => setIsExpanded(true)}
                  onBlur={(e) => {
                    // Only collapse if clicking outside of the post area completely
                    if (!e.currentTarget.contains(e.relatedTarget as Node) && !content.trim()) {
                      setTimeout(() => setIsExpanded(false), 100);
                    }
                  }}
                />
                {!isExpanded && (
                  <div className="absolute bottom-3 right-3 flex space-x-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-full text-gray-500 hover:text-purple-600"
                      onClick={() => setPhotoDialogOpen(true)}
                    >
                      <Image className="h-5 w-5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-full text-gray-500 hover:text-purple-600"
                      onClick={() => setVideoDialogOpen(true)}
                    >
                      <Video className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
              
              {attachments.length > 0 && (
                <div className="my-3 flex flex-wrap gap-2">
                  {attachments.map((attachment, index) => (
                    <div 
                      key={index}
                      className="relative bg-gray-50 border border-gray-200 p-2 rounded-md flex items-center gap-2"
                    >
                      {attachment.type === 'photo' && (
                        <div className="h-10 w-10 rounded-md overflow-hidden">
                          <img src={attachment.data} alt="Attached" className="h-full w-full object-cover" />
                        </div>
                      )}
                      {attachment.type === 'video' && (
                        <div className="h-10 w-10 rounded-md overflow-hidden bg-black flex items-center justify-center">
                          <Video className="h-5 w-5 text-white" />
                        </div>
                      )}
                      {attachment.type === 'document' && <FileText className="h-4 w-4 text-blue-500" />}
                      {attachment.type === 'link' && <Link2 className="h-4 w-4 text-purple-500" />}
                      {attachment.type === 'feeling' && <Smile className="h-4 w-4 text-yellow-500" />}
                      {attachment.type === 'voice' && (
                        <div className="flex items-center gap-1">
                          <Mic className="h-4 w-4 text-purple-500" />
                        </div>
                      )}
                      
                      <span className="text-sm truncate max-w-[150px]">
                        {attachment.type === 'photo' ? 'Photo' : 
                         attachment.type === 'video' ? 'Video' :
                         attachment.type === 'document' ? attachment.data :
                         attachment.type === 'voice' ? 'Voice recording' :
                         attachment.type === 'feeling' ? `Feeling ${attachment.data}` : 
                         attachment.data}
                      </span>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 absolute -top-1 -right-1 rounded-full bg-gray-200"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {isExpanded && (
                <>
                  <div className="flex flex-wrap gap-1 mt-2 mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-full text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                      onClick={() => setPhotoDialogOpen(true)}
                    >
                      <Image className="h-4 w-4 mr-1" />
                      <span>Photo</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-full text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                      onClick={() => setVideoDialogOpen(true)}
                    >
                      <Video className="h-4 w-4 mr-1" />
                      <span>Video</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-full text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                      onClick={() => setDocumentDialogOpen(true)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      <span>Document</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-full text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                      onClick={() => setLinkDialogOpen(true)}
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                      <span>Link</span>
                    </Button>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-full text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                      onClick={() => setVoiceDialogOpen(true)}
                    >
                      <Mic className="h-4 w-4 mr-1" />
                      <span>Voice</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-full text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                      onClick={() => setAiSuggestionsOpen(true)}
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      <span>AI Ideas</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-full text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                      onClick={() => setFeelingDialogOpen(true)}
                    >
                      <Smile className="h-4 w-4 mr-1" />
                      <span>Feeling</span>
                    </Button>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      className="rounded-full px-6 bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={!content.trim() || isSubmitting}
                      onClick={handleCreatePost}
                      type="button"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        "Post"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a link</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="link-url">URL</Label>
              <Input 
                id="link-url" 
                placeholder="https://example.com" 
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setLinkDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button" 
              onClick={handleLinkAdd}
              disabled={!linkUrl}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Feeling Dialog */}
      <Dialog open={feelingDialogOpen} onOpenChange={setFeelingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>How are you feeling?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="feeling">Select feeling</Label>
              <Select onValueChange={setFeeling} value={feeling}>
                <SelectTrigger id="feeling">
                  <SelectValue placeholder="Select a feeling" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Happy">Happy</SelectItem>
                  <SelectItem value="Excited">Excited</SelectItem>
                  <SelectItem value="Grateful">Grateful</SelectItem>
                  <SelectItem value="Inspired">Inspired</SelectItem>
                  <SelectItem value="Productive">Productive</SelectItem>
                  <SelectItem value="Accomplished">Accomplished</SelectItem>
                  <SelectItem value="Determined">Determined</SelectItem>
                  <SelectItem value="Optimistic">Optimistic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFeelingDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button" 
              onClick={handleFeelingAdd}
              disabled={!feeling}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Add Feeling
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload a photo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {photoPreview ? (
              <div className="relative">
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-md" 
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8"
                  onClick={() => setPhotoPreview(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
                <div className="flex flex-col items-center">
                  <Upload className="h-10 w-10 text-gray-400 mb-3" />
                  <p className="text-sm font-medium mb-2">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mb-3">
                    SVG, PNG, JPG or GIF (max. 2MB)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                  <input
                    type="file"
                    ref={photoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setPhotoDialogOpen(false);
                setPhotoPreview(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button" 
              onClick={handlePhotoUpload}
              disabled={!photoPreview}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Add Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Video Upload Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload a video</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {videoPreview ? (
              <div className="relative">
                <video 
                  src={videoPreview} 
                  controls
                  className="w-full h-48 object-cover rounded-md bg-black" 
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8"
                  onClick={() => setVideoPreview(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
                <div className="flex flex-col items-center">
                  <Upload className="h-10 w-10 text-gray-400 mb-3" />
                  <p className="text-sm font-medium mb-2">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mb-3">
                    MP4, MOV, or WebM (max. 10MB)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                  <input
                    type="file"
                    ref={videoInputRef}
                    className="hidden"
                    accept="video/*"
                    onChange={handleVideoChange}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setVideoDialogOpen(false);
                setVideoPreview(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button" 
              onClick={handleVideoUpload}
              disabled={!videoPreview}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Add Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Document Upload Dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload a document</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {documentFile ? (
              <div className="border rounded-md p-4 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">{documentName}</p>
                  <p className="text-xs text-gray-500">{Math.round(documentFile.size / 1024)} KB</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-gray-500 hover:text-red-500 rounded-full h-8 w-8"
                  onClick={() => {
                    setDocumentFile(null);
                    setDocumentName("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
                <div className="flex flex-col items-center">
                  <FileText className="h-10 w-10 text-gray-400 mb-3" />
                  <p className="text-sm font-medium mb-2">Click to upload a document</p>
                  <p className="text-xs text-gray-500 mb-3">
                    PDF, DOC, DOCX, PPT, or TXT (max. 5MB)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => documentInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                  <input
                    type="file"
                    ref={documentInputRef}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.txt"
                    onChange={handleDocumentChange}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDocumentDialogOpen(false);
                setDocumentFile(null);
                setDocumentName("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button" 
              onClick={handleDocumentUpload}
              disabled={!documentFile}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Add Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Voice Recording Dialog */}
      <Dialog open={voiceDialogOpen} onOpenChange={setVoiceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record your voice</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="border rounded-md p-8 flex flex-col items-center">
              {audioBlob ? (
                <div className="w-full">
                  <audio controls className="w-full mb-4">
                    <source src={URL.createObjectURL(audioBlob)} type="audio/mp3" />
                    Your browser does not support the audio element.
                  </audio>
                  <div className="text-center text-sm text-gray-500">
                    Recording duration: {formatRecordingTime(recordingDuration)}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  {isRecording ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-50"></div>
                        <div className="relative bg-red-500 p-4 rounded-full">
                          <Mic className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div className="text-xl font-medium text-red-500">
                        {formatRecordingTime(recordingDuration)}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-50"
                        onClick={stopRecording}
                      >
                        Stop Recording
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <Mic className="h-16 w-16 text-gray-400 mb-2" />
                      <p className="text-sm font-medium">Click the button below to start recording</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-purple-500 text-purple-500 hover:bg-purple-50"
                        onClick={startRecording}
                      >
                        Start Recording
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={cancelRecording}
            >
              Cancel
            </Button>
            <Button
              type="button" 
              onClick={addVoiceRecording}
              disabled={!audioBlob}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Add Voice Recording
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Post Suggestions Modal */}
      <AiPostSuggestionsModal
        open={aiSuggestionsOpen}
        onOpenChange={setAiSuggestionsOpen}
        onSelectSuggestion={handleAiSuggestionSelect}
      />
    </>
  );
}