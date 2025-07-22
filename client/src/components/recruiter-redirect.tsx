import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function RecruiterRedirect() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    // If user is a recruiter and on a non-recruiter page, redirect to recruiter dashboard
    if (user?.isRecruiter) {
      const recruiterPages = [
        "/recruiter-dashboard", 
        "/recruiter-network",
        "/recruiter-jobs",
        "/recruiter-profile",
        "/create-job-posting", 
        "/applicant-tracking", 
        "/candidate",
        "/messages",
        "/communities",
        "/profile",
        "/settings"
      ];
      
      // Check if current location is not a recruiter page
      const isOnRecruiterPage = recruiterPages.some(page => 
        location === page || location.startsWith(page + "/")
      );
      
      if (!isOnRecruiterPage) {
        navigate("/recruiter-dashboard");
      }
    }
  }, [user, location, navigate]);

  return null; // This component doesn't render anything
}