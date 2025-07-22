import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileCog,
  LucideRss,
  MapPin,
  Plus,
  Save,
  Settings,
  Sparkles,
  Trash2,
  XCircle
} from "lucide-react";

// Job posting form schema
const jobFormSchema = z.object({
  title: z.string().min(5, "Job title must be at least 5 characters"),
  company: z.string().optional(),
  location: z.string().min(3, "Location is required"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  salary: z.string().optional(),
  jobType: z.enum(["Full-time", "Part-time", "Contract", "Temporary", "Internship"]),
  experienceLevel: z.enum(["Entry-level", "Mid-level (3-5 years)", "Senior (5+ years)", "Executive"]),
  educationLevel: z.enum(["High School", "Bachelor's", "Master's", "PhD", "Not Required"]).optional(),
  remoteType: z.enum(["On-site", "Remote", "Hybrid"]),
  deadlineDate: z.string().optional(),
  aiAssisted: z.boolean().default(true),
  visibility: z.enum(["public", "private", "premium"]).default("public"),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

// Predefined skills
const SKILL_OPTIONS = [
  "JavaScript", "React", "Node.js", "TypeScript", "Python",
  "Java", "SQL", "Data Analysis", "Machine Learning", "Project Management",
  "Business Analysis", "Product Management", "UX Design", "Content Writing",
  "Digital Marketing", "SEO", "Social Media", "Agile", "Scrum",
  "DevOps", "Cloud", "AWS", "Azure", "Docker", "Kubernetes"
];

export default function CreateJobPosting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [inputSkill, setInputSkill] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [isUsingAI, setIsUsingAI] = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Set up the form
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      company: user?.company || "",
      location: "",
      description: "",
      skills: [],
      salary: "",
      jobType: "Full-time",
      experienceLevel: "Mid-level (3-5 years)",
      educationLevel: "Bachelor's",
      remoteType: "On-site",
      aiAssisted: true,
      visibility: "public",
    },
  });

  // Watch form values for AI suggestions
  const jobTitle = form.watch("title");
  const description = form.watch("description");
  const selectedSkills = form.watch("skills");

  // Mutation for creating job posting
  const createJobMutation = useMutation({
    mutationFn: async (values: JobFormValues) => {
      const res = await apiRequest("POST", "/api/jobs", values);
      return await res.json();
    },
    onSuccess: (job) => {
      toast({
        title: "Job Posted Successfully",
        description: "Your job has been posted and is now visible to candidates.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      navigate("/recruiter-dashboard?tab=jobs");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle skill input
  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputSkill(value);
    
    // Show suggestions based on input
    if (value.length > 1) {
      const filtered = SKILL_OPTIONS.filter(
        skill => skill.toLowerCase().includes(value.toLowerCase()) && 
        !selectedSkills.includes(skill)
      );
      setSkillSuggestions(filtered.slice(0, 5));
    } else {
      setSkillSuggestions([]);
    }
  };

  // Add skill to form
  const addSkill = (skill: string) => {
    if (skill.trim() && !selectedSkills.includes(skill)) {
      form.setValue("skills", [...selectedSkills, skill]);
      setInputSkill("");
      setSkillSuggestions([]);
    }
  };

  // Remove skill from form
  const removeSkill = (skill: string) => {
    form.setValue(
      "skills",
      selectedSkills.filter(s => s !== skill)
    );
  };

  // Generate AI suggestions for job description or skills based on title
  const generateSuggestions = async (type: 'description' | 'skills') => {
    if (!jobTitle) {
      toast({
        title: "Job Title Required",
        description: "Please enter a job title before generating suggestions.",
        variant: "destructive",
      });
      return;
    }
    
    setSuggestionsLoading(true);
    
    // This would connect to an API for AI suggestions
    // For now, using simple mock responses based on job titles
    setTimeout(() => {
      if (type === 'description') {
        let suggestedDescription = "";
        
        if (jobTitle.toLowerCase().includes("developer") || jobTitle.toLowerCase().includes("engineer")) {
          suggestedDescription = `We are seeking a talented ${jobTitle} to join our dynamic team. The ideal candidate will have strong problem-solving skills, experience with modern development practices, and the ability to work in a fast-paced environment.\n\nResponsibilities:\n• Design, develop, and maintain software applications\n• Collaborate with cross-functional teams to define and implement solutions\n• Write clean, scalable, and efficient code\n• Troubleshoot and debug applications\n• Stay updated with emerging technologies\n\nRequirements:\n• Bachelor's degree in Computer Science or related field\n• Proven experience as a ${jobTitle.split(" ")[0]} Developer\n• Strong understanding of software development principles\n• Excellent communication and teamwork skills`;
        } else if (jobTitle.toLowerCase().includes("analyst")) {
          suggestedDescription = `We are looking for a detail-oriented ${jobTitle} to analyze data, identify trends, and provide valuable insights to drive business decisions.\n\nResponsibilities:\n• Collect, process, and analyze data from various sources\n• Develop comprehensive reports and visualizations\n• Identify patterns and trends in complex datasets\n• Make recommendations based on findings\n• Collaborate with stakeholders to understand business requirements\n\nRequirements:\n• Bachelor's degree in Analytics, Statistics, or related field\n• Experience with data analysis tools and techniques\n• Strong analytical and problem-solving skills\n• Excellent communication abilities\n• Attention to detail`;
        } else if (jobTitle.toLowerCase().includes("manager")) {
          suggestedDescription = `We are seeking an experienced ${jobTitle} to lead and inspire a team while driving strategic initiatives forward.\n\nResponsibilities:\n• Lead and manage a team of professionals\n• Develop and implement strategic plans\n• Monitor performance metrics and ensure targets are met\n• Build and maintain relationships with key stakeholders\n• Identify opportunities for process improvement\n\nRequirements:\n• Bachelor's degree in Business, Management, or related field\n• Proven experience in a management role\n• Strong leadership and interpersonal skills\n• Excellent problem-solving abilities\n• Result-oriented mindset`;
        } else {
          suggestedDescription = `We are looking for a skilled ${jobTitle} to join our growing team. The ideal candidate will bring expertise, creativity, and enthusiasm to this role.\n\nResponsibilities:\n• Execute core functions related to ${jobTitle} position\n• Collaborate with team members across departments\n• Contribute to the development of best practices\n• Participate in ongoing training and development\n• Support broader organizational goals\n\nRequirements:\n• Relevant education or certification in the field\n• Previous experience in a similar role\n• Strong communication and teamwork skills\n• Problem-solving mindset\n• Ability to adapt to changing priorities`;
        }
        
        form.setValue("description", suggestedDescription);
      } else if (type === 'skills') {
        let suggestedSkills: string[] = [];
        
        if (jobTitle.toLowerCase().includes("developer") || 
            jobTitle.toLowerCase().includes("engineer") || 
            jobTitle.toLowerCase().includes("programmer")) {
          suggestedSkills = ["JavaScript", "React", "Node.js", "TypeScript", "Git", "API Development"];
        } else if (jobTitle.toLowerCase().includes("analyst")) {
          suggestedSkills = ["Data Analysis", "SQL", "Excel", "Tableau", "Power BI", "Statistical Analysis"];
        } else if (jobTitle.toLowerCase().includes("designer")) {
          suggestedSkills = ["UI/UX Design", "Figma", "Adobe Creative Suite", "User Research", "Prototyping", "Wireframing"];
        } else if (jobTitle.toLowerCase().includes("manager")) {
          suggestedSkills = ["Project Management", "Leadership", "Strategic Planning", "Budgeting", "Team Building", "Communication"];
        } else if (jobTitle.toLowerCase().includes("marketing")) {
          suggestedSkills = ["Digital Marketing", "SEO", "Content Strategy", "Social Media", "Analytics", "Campaign Management"];
        } else {
          suggestedSkills = ["Communication", "Problem Solving", "Teamwork", "Organization", "Time Management"];
        }
        
        // Filter out skills already selected
        suggestedSkills = suggestedSkills.filter(skill => !selectedSkills.includes(skill));
        
        form.setValue("skills", [...selectedSkills, ...suggestedSkills.slice(0, 5)]);
      }
      
      setSuggestionsLoading(false);
    }, 1500);
  };

  // Form submission handler
  const onSubmit = (values: JobFormValues) => {
    createJobMutation.mutate(values);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Create Job Posting</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className={isUsingAI ? "bg-purple-50" : ""}
              onClick={() => setIsUsingAI(!isUsingAI)}
            >
              <Sparkles className={`h-4 w-4 mr-2 ${isUsingAI ? "text-purple-600" : "text-gray-400"}`} />
              AI Assistance {isUsingAI ? "On" : "Off"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/recruiter-dashboard")}
            >
              Cancel
            </Button>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <BriefcaseBusiness className="h-5 w-5 mr-2 text-primary" />
                  Job Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title*</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Senior Software Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Your company name" {...field} value={field.value || user?.company || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location*</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                            <Input className="pl-9" placeholder="e.g. Bengaluru, Karnataka" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary Range</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. ₹15-20 LPA" {...field} />
                        </FormControl>
                        <FormDescription>
                          Jobs with salary details get 2x more applicants
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Job Description*</FormLabel>
                        {isUsingAI && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => generateSuggestions('description')}
                            disabled={suggestionsLoading}
                            className="h-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                          >
                            <Sparkles className="h-3.5 w-3.5 mr-1" />
                            {suggestionsLoading ? "Generating..." : "Generate with AI"}
                          </Button>
                        )}
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the role, responsibilities, and requirements..." 
                          {...field} 
                          rows={10}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum 50 characters. Include key responsibilities and requirements.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormField
                    control={form.control}
                    name="skills"
                    render={() => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Required Skills*</FormLabel>
                          {isUsingAI && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => generateSuggestions('skills')}
                              disabled={suggestionsLoading}
                              className="h-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-1" />
                              {suggestionsLoading ? "Generating..." : "Suggest Skills"}
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {selectedSkills.map(skill => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="pl-2 py-1.5 text-sm bg-primary/10"
                            >
                              {skill}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSkill(skill)}
                                className="h-5 w-5 p-0 ml-1 hover:bg-transparent"
                              >
                                <XCircle className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="relative">
                          <Input
                            placeholder="Type a skill and press Enter..."
                            value={inputSkill}
                            onChange={handleSkillInputChange}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addSkill(inputSkill);
                              }
                            }}
                          />
                          {inputSkill && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2"
                              onClick={() => addSkill(inputSkill)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        {skillSuggestions.length > 0 && (
                          <div className="mt-1 border rounded-md overflow-hidden shadow-sm">
                            <ul className="py-1 bg-white">
                              {skillSuggestions.map(skill => (
                                <li
                                  key={skill}
                                  className="px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-sm"
                                  onClick={() => addSkill(skill)}
                                >
                                  {skill}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Settings className="h-5 w-5 mr-2 text-primary" />
                  Job Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="jobType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Type*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Temporary">Temporary</SelectItem>
                            <SelectItem value="Internship">Internship</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="experienceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Level*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Entry-level">Entry-level</SelectItem>
                            <SelectItem value="Mid-level (3-5 years)">Mid-level (3-5 years)</SelectItem>
                            <SelectItem value="Senior (5+ years)">Senior (5+ years)</SelectItem>
                            <SelectItem value="Executive">Executive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="educationLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education Level</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select education level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="High School">High School</SelectItem>
                            <SelectItem value="Bachelor's">Bachelor's Degree</SelectItem>
                            <SelectItem value="Master's">Master's Degree</SelectItem>
                            <SelectItem value="PhD">PhD</SelectItem>
                            <SelectItem value="Not Required">Not Required</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="remoteType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Type*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select work type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="On-site">On-site</SelectItem>
                            <SelectItem value="Remote">Remote</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="deadlineDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Deadline</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave blank if there's no specific deadline
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileCog className="h-5 w-5 mr-2 text-primary" />
                  Posting Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="aiAssisted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>AI-Assisted Shortlisting</FormLabel>
                        <FormDescription>
                          Use AI to rank and shortlist candidates based on matching skills and qualifications
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posting Visibility</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="space-y-4"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="public" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center">
                              <LucideRss className="h-4 w-4 mr-2 text-green-600" />
                              <div>
                                <span className="font-medium">Public</span>
                                <span className="block text-sm text-gray-500">Visible to all users</span>
                              </div>
                            </FormLabel>
                          </FormItem>
                          
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="private" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center">
                              <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                              <div>
                                <span className="font-medium">Private</span>
                                <span className="block text-sm text-gray-500">Only visible through direct link</span>
                              </div>
                            </FormLabel>
                          </FormItem>
                          
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="premium" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center">
                              <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                              <div>
                                <span className="font-medium">Premium</span>
                                <span className="block text-sm text-gray-500">Featured placement and advanced analytics</span>
                              </div>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <div className="flex gap-4 justify-end">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  form.reset();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Form
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => form.setValue("visibility", "public")}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90"
                disabled={createJobMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {createJobMutation.isPending ? "Posting..." : "Post Job"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}