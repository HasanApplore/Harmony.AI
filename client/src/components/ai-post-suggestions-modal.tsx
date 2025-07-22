import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PostSuggestion {
  title: string;
  content: string;
  tone: string;
  hashtags: string[];
}

interface AiPostSuggestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSuggestion: (content: string) => void;
}

export function AiPostSuggestionsModal({ 
  open, 
  onOpenChange, 
  onSelectSuggestion 
}: AiPostSuggestionsModalProps) {
  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<PostSuggestion[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const generateSuggestionsMutation = useMutation({
    mutationFn: async (keyword: string) => {
      const response = await apiRequest("POST", "/api/posts/ai-suggestions", { keyword });
      return await response.json();
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions || []);
      if (data.suggestions?.length === 0) {
        toast({
          title: "No suggestions found",
          description: "Try a different keyword or topic.",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error("Error generating suggestions:", error);
      let errorMessage = "Please try again or check your connection.";
      
      if (error.message.includes("API key")) {
        errorMessage = "AI suggestions require an OpenAI API key to be configured.";
      } else if (error.message.includes("quota")) {
        errorMessage = "AI service quota exceeded. Please try again later.";
      } else if (error.message.includes("rate limit")) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      }
      
      toast({
        title: "Unable to generate AI suggestions",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleGenerateSuggestions = () => {
    if (!keyword.trim()) {
      toast({
        title: "Keyword required",
        description: "Please enter a keyword or topic to generate suggestions.",
        variant: "destructive"
      });
      return;
    }
    generateSuggestionsMutation.mutate(keyword.trim());
  };

  const handleSelectSuggestion = (suggestion: PostSuggestion) => {
    const fullContent = `${suggestion.content}\n\n${suggestion.hashtags.map(tag => `#${tag}`).join(' ')}`;
    onSelectSuggestion(fullContent);
    onOpenChange(false);
    setSuggestions([]);
    setKeyword("");
  };

  const handleCopyToClipboard = async (content: string, index: number) => {
    try {
      const suggestion = suggestions[index];
      const fullContent = `${suggestion.content}\n\n${suggestion.hashtags.map(tag => `#${tag}`).join(' ')}`;
      await navigator.clipboard.writeText(fullContent);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: "Copied to clipboard",
        description: "Post content has been copied to your clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone.toLowerCase()) {
      case 'inspirational': return 'bg-green-100 text-green-800';
      case 'informative': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Post Suggestions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Keyword Input */}
          <div className="space-y-2">
            <Label htmlFor="keyword">Topic or Keyword</Label>
            <div className="flex gap-2">
              <Input
                id="keyword"
                placeholder="e.g., leadership, innovation, career growth, teamwork..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateSuggestions()}
              />
              <Button 
                onClick={handleGenerateSuggestions}
                disabled={generateSuggestionsMutation.isPending || !keyword.trim()}
              >
                {generateSuggestionsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {generateSuggestionsMutation.isPending && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">Generating AI suggestions...</span>
            </div>
          )}

          {/* Suggestions Grid */}
          {suggestions.length > 0 && (
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {suggestions.map((suggestion, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold line-clamp-2">
                        {suggestion.title}
                      </CardTitle>
                      <Badge className={getToneColor(suggestion.tone)}>
                        {suggestion.tone}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={suggestion.content}
                      readOnly
                      className="min-h-[120px] resize-none border-0 p-0 focus-visible:ring-0 bg-transparent"
                    />
                    
                    {/* Hashtags */}
                    <div className="flex flex-wrap gap-1">
                      {suggestion.hashtags.map((hashtag, hashIndex) => (
                        <Badge key={hashIndex} variant="secondary" className="text-xs">
                          #{hashtag}
                        </Badge>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="flex-1"
                        size="sm"
                      >
                        Use This Post
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyToClipboard(suggestion.content, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!generateSuggestionsMutation.isPending && suggestions.length === 0 && keyword && (
            <div className="text-center py-8 text-gray-500">
              <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Enter a topic and click Generate to get AI-powered post suggestions</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}