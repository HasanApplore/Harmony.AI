import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DigitalCVUploadModal } from "./digital-cv-upload-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DigitalCVProps {
  videoUrl?: string;
  aiFeedback?: string;
  onUpdateClick?: () => void;
}

export function DigitalCV({ videoUrl, aiFeedback, onUpdateClick }: DigitalCVProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const togglePlaying = () => {
    setIsPlaying(!isPlaying);
    
    // If we have a video element, play or pause it
    const videoElement = document.getElementById("digitalCVVideo") as HTMLVideoElement;
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
    }
  };
  
  const handleUpdateClick = () => {
    setIsModalOpen(true);
    if (onUpdateClick) {
      onUpdateClick();
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader className="bg-primary-700 text-white p-4">
          <CardTitle className="text-lg font-semibold">Your Digital CV</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="video-container mb-3">
            {videoUrl ? (
              <video 
                id="digitalCVVideo"
                src={videoUrl} 
                poster="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                className="w-full h-full object-cover" 
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ) : (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <p className="text-white text-center px-4">
                  Record your Digital CV to showcase your skills and personality
                </p>
              </div>
            )}
            
            {!isPlaying && (
              <button 
                className="play-button"
                onClick={togglePlaying}
                aria-label="Play video"
              >
                <Play className="h-5 w-5" />
              </button>
            )}
            
            {aiFeedback && (
              <div className="ai-feedback">
                {aiFeedback}
              </div>
            )}
          </div>
          <div className="text-center">
            <Button 
              onClick={handleUpdateClick}
              className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700"
            >
              Update Digital CV
            </Button>
          </div>
        </CardContent>
      </Card>

      <DigitalCVUploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
