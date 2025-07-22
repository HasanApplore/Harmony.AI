import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, ArrowLeft, Home } from "lucide-react";
import { useLocation } from "wouter";

// Define interface for trending topics
interface TrendingTopic {
  id: number;
  title: string;
  professionals: number;
  description: string;
  relatedPosts: number;
  hashtags: string[];
}

export default function TrendingTopicsPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch trending topics
  const { data: trendingTopics, isLoading } = useQuery<TrendingTopic[]>({
    queryKey: ["/api/trending/topics"],
  });

  // Filter topics based on search query
  const filteredTopics = trendingTopics?.filter(topic => 
    searchQuery === "" ||
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.hashtags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Function to handle sharing a topic
  const handleShareTopic = (topic: TrendingTopic) => {
    const shareText = `Check out this trending topic on Harmony.ai: ${topic.title}\n\n${topic.description}\n\n#${topic.hashtags.join(' #')}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Trending on Harmony.ai: ${topic.title}`,
        text: shareText,
        url: window.location.href,
      })
      .then(() => {
        toast({
          title: "Shared successfully",
          description: "Content has been shared",
        });
      })
      .catch((error) => {
        console.error("Error sharing:", error);
        handleManualShare(shareText);
      });
    } else {
      handleManualShare(shareText);
    }
  };

  // Fallback function for sharing
  const handleManualShare = (shareText: string) => {
    // Copy to clipboard
    navigator.clipboard.writeText(shareText)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Share text has been copied to your clipboard",
        });
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
        toast({
          title: "Failed to copy",
          description: "Please try again or share manually",
          variant: "destructive"
        });
      });
  };

  // Function to join a discussion
  const handleJoinDiscussion = (topic: TrendingTopic) => {
    navigate("/");
    toast({
      title: "Joined discussion",
      description: `You're now discussing "${topic.title}"`,
    });
  };

  return (
    <Layout>
      {/* Top banner with navigation links */}
      <div className="relative bg-gradient-to-r from-purple-700 to-purple-900 py-4 mb-6 shadow-md">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Button 
              variant="secondary" 
              className="flex items-center gap-2 bg-white hover:bg-gray-100 text-purple-700 font-medium w-full sm:w-auto"
              onClick={() => navigate("/")}
              size="lg"
            >
              <Home className="h-5 w-5" /> Return to Home
            </Button>
            <h1 className="text-2xl font-bold text-white order-first sm:order-none">Trending Topics</h1>
            <div className="sm:w-[150px] hidden sm:block"></div>
          </div>
        </div>
      </div>
      
      {/* Floating action button for back navigation */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="default"
          size="lg"
          className="rounded-full w-16 h-16 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          onClick={() => navigate("/")}
        >
          <Home className="h-8 w-8" />
        </Button>
      </div>
      
      {/* Text link at top of content */}
      <div className="container mx-auto max-w-5xl px-4 mb-6">
        <Button
          variant="link"
          className="px-0 text-purple-600 hover:text-purple-800 text-lg flex items-center"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> Back to homepage
        </Button>
      </div>
      
      <div className="container mx-auto pb-8 max-w-5xl px-4">

        <Card className="mb-8">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>All Trending Topics</CardTitle>
              <div className="flex items-center relative w-full sm:w-64">
                <Search className="absolute left-2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search topics or hashtags"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-6">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="p-4 border border-gray-100 rounded-lg">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-16 w-full mb-3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredTopics && filteredTopics.length > 0 ? (
                  filteredTopics.map((topic) => (
                    <div key={topic.id} className="p-6 border border-gray-100 rounded-lg hover:bg-purple-50 transition-colors">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 font-bold">
                          #{topic.id}
                        </div>
                        <div className="ml-4 flex-grow">
                          <h4 className="font-medium text-gray-900 text-xl">{topic.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">
                            {topic.professionals.toLocaleString()} professionals discussing this topic • {topic.relatedPosts} related posts
                          </p>
                          <p className="text-gray-700 mt-3 mb-4">{topic.description}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {topic.hashtags.map((tag, idx) => (
                              <span 
                                key={idx} 
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-3 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleJoinDiscussion(topic)}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          Join discussion
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleShareTopic(topic)}
                          className="text-gray-600"
                        >
                          Share
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No topics found matching your search.</p>
                    {searchQuery && (
                      <Button 
                        variant="link" 
                        onClick={() => setSearchQuery("")}
                        className="mt-2"
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}