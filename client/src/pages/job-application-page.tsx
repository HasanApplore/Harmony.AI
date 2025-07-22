import { useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Job } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Building2, 
  MapPin, 
  BriefcaseBusiness, 
  BadgeIndianRupee, 
  FileText, 
  PlusCircle, 
  XCircle,
  Briefcase,
  GraduationCap,
  Clock,
  Upload,
  FileUp
} from "lucide-react";

// Define form schema
const applicationFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
  resume: z.any().optional(),
  coverLetter: z.string().optional(),
  experience: z.array(
    z.object({
      title: z.string().min(1, { message: "Job title is required" }),
      company: z.string().min(1, { message: "Company name is required" }),
      startDate: z.string().min(1, { message: "Start date is required" }),
      endDate: z.string().optional(),
      description: z.string().optional(),
      current: z.boolean().default(false),
    })
  ).optional().default([]),
  education: z.array(
    z.object({
      institution: z.string().min(1, { message: "Institution name is required" }),
      degree: z.string().min(1, { message: "Degree is required" }),
      field: z.string().min(1, { message: "Field of study is required" }),
      graduationYear: z.string().min(1, { message: "Graduation year is required" }),
    })
  ).optional().default([]),
  skills: z.string().optional(),
  availability: z.string().optional(),
  relocate: z.boolean().optional(),
  portfolioUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  additionalInfo: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export default function JobApplicationPage() {
  const [match, params] = useRoute<{ id: string }>("/apply/:id");
  const jobId = match ? parseInt(params.id) : null;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePreview, setResumePreview] = useState<string | null>(null);
  
  const [experienceFields, setExperienceFields] = useState<
    { id: number; current: boolean }[]
  >([{ id: 1, current: false }]);
  
  const [educationFields, setEducationFields] = useState<{ id: number }[]>([{ id: 1 }]);

  // Fetch job details
  const { data: job, isLoading: isLoadingJob } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
    queryFn: ({ queryKey }) => {
      const [, id] = queryKey;
      return fetch(`/api/jobs/${id}`).then(res => {
        if (!res.ok) throw new Error("Job not found");
        return res.json();
      });
    },
    enabled: !!jobId,
  });

  // Initialize form with default values
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      fullName: user?.name || "",
      email: user?.email || "",
      phone: user?.mobileNumber || "",
      coverLetter: "",
      experience: [{ title: "", company: "", startDate: "", endDate: "", description: "", current: false }],
      education: [{ institution: "", degree: "", field: "", graduationYear: "" }],
      skills: user?.skills?.join(", ") || "",
      availability: "immediately",
      relocate: true,
      portfolioUrl: "",
      additionalInfo: "",
    },
  });

  // Apply job mutation
  const applyMutation = useMutation({
    mutationFn: async (data: ApplicationFormValues) => {
      const formData = new FormData();
      
      // Append resume file if selected
      if (resumeFile) {
        formData.append("resume", resumeFile);
      }
      
      // Convert form data to JSON and append
      formData.append("applicationData", JSON.stringify(data));
      formData.append("jobId", jobId?.toString() || "");
      
      const res = await apiRequest("POST", `/api/jobs/${jobId}/apply`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Application submitted successfully",
        description: "Your application has been sent to the recruiter.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      navigate("/jobs");
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting application",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setResumePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add/remove experience fields
  const addExperienceField = () => {
    const newId = experienceFields.length > 0 
      ? Math.max(...experienceFields.map(f => f.id)) + 1 
      : 1;
    setExperienceFields([...experienceFields, { id: newId, current: false }]);
    
    // Add new empty experience to form
    const currentExp = form.getValues("experience") || [];
    form.setValue("experience", [
      ...currentExp, 
      { title: "", company: "", startDate: "", endDate: "", description: "", current: false }
    ]);
  };

  const removeExperienceField = (id: number, index: number) => {
    if (experienceFields.length > 1) {
      setExperienceFields(experienceFields.filter(field => field.id !== id));
      
      // Remove experience from form
      const currentExp = form.getValues("experience") || [];
      currentExp.splice(index, 1);
      form.setValue("experience", currentExp);
    }
  };

  // Add/remove education fields
  const addEducationField = () => {
    const newId = educationFields.length > 0 
      ? Math.max(...educationFields.map(f => f.id)) + 1 
      : 1;
    setEducationFields([...educationFields, { id: newId }]);
    
    // Add new empty education to form
    const currentEdu = form.getValues("education") || [];
    form.setValue("education", [
      ...currentEdu, 
      { institution: "", degree: "", field: "", graduationYear: "" }
    ]);
  };

  const removeEducationField = (id: number, index: number) => {
    if (educationFields.length > 1) {
      setEducationFields(educationFields.filter(field => field.id !== id));
      
      // Remove education from form
      const currentEdu = form.getValues("education") || [];
      currentEdu.splice(index, 1);
      form.setValue("education", currentEdu);
    }
  };

  // Toggle current job
  const toggleCurrentJob = (index: number, checked: boolean) => {
    const updatedFields = [...experienceFields];
    updatedFields[index].current = checked;
    setExperienceFields(updatedFields);
    
    // Update form values
    const experiences = form.getValues("experience");
    if (experiences && experiences[index]) {
      experiences[index].current = checked;
      if (checked) {
        experiences[index].endDate = "";
      }
      form.setValue("experience", experiences);
    }
  };

  const onSubmit = (data: ApplicationFormValues) => {
    if (!resumeFile) {
      toast({
        title: "Resume required",
        description: "Please upload your resume to continue.",
        variant: "destructive",
      });
      return;
    }
    
    applyMutation.mutate(data);
  };

  if (!jobId) {
    return <Layout>
      <div className="container max-w-3xl mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h1>
          <p className="text-gray-600 mb-6">The job you're trying to apply for doesn't exist or was removed.</p>
          <Button onClick={() => navigate("/jobs")}>Browse Jobs</Button>
        </div>
      </div>
    </Layout>;
  }

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-6 px-4 sm:px-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-4"
          >
            ← Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Application</h1>
          <p className="text-gray-600">Submit your application for this position</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Application form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
                <CardDescription>
                  Please fill out the form below to apply for this position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name*</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address*</FormLabel>
                              <FormControl>
                                <Input placeholder="your.email@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number*</FormLabel>
                            <FormControl>
                              <Input placeholder="Your phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Resume Upload*</h3>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            id="resume"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          {!resumePreview ? (
                            <div>
                              <FileUp className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500 mb-2">
                                Upload your resume in PDF, DOC or DOCX format (max 5MB)
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById("resume")?.click()}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Choose File
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <FileText className="h-10 w-10 mx-auto text-purple-600 mb-2" />
                              <p className="text-sm font-medium">{resumeFile?.name}</p>
                              <p className="text-xs text-gray-500 mb-2">
                                {resumeFile && (resumeFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setResumeFile(null);
                                  setResumePreview(null);
                                }}
                              >
                                Change File
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="coverLetter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cover Letter</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Briefly explain why you're a good fit for this position" 
                                className="min-h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addExperienceField}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add Experience
                        </Button>
                      </div>
                      
                      {experienceFields.map((field, index) => (
                        <div key={field.id} className="border rounded-lg p-4 bg-gray-50 relative">
                          {experienceFields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 text-gray-400 hover:text-gray-600"
                              onClick={() => removeExperienceField(field.id, index)}
                            >
                              <XCircle className="h-5 w-5" />
                            </Button>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`experience.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Job Title</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Software Engineer" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`experience.${index}.company`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Company</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Company name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <FormField
                              control={form.control}
                              name={`experience.${index}.startDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date</FormLabel>
                                  <FormControl>
                                    <Input type="month" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {!experienceFields[index].current && (
                              <FormField
                                control={form.control}
                                name={`experience.${index}.endDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="month" 
                                        disabled={experienceFields[index].current}
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                          
                          <div className="mb-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`current-job-${field.id}`}
                                checked={experienceFields[index].current}
                                onCheckedChange={(checked) => {
                                  if (typeof checked === 'boolean') {
                                    toggleCurrentJob(index, checked);
                                  }
                                }}
                              />
                              <label
                                htmlFor={`current-job-${field.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                I currently work here
                              </label>
                            </div>
                          </div>
                          
                          <FormField
                            control={form.control}
                            name={`experience.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Briefly describe your responsibilities and achievements" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addEducationField}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add Education
                        </Button>
                      </div>
                      
                      {educationFields.map((field, index) => (
                        <div key={field.id} className="border rounded-lg p-4 bg-gray-50 relative">
                          {educationFields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 text-gray-400 hover:text-gray-600"
                              onClick={() => removeEducationField(field.id, index)}
                            >
                              <XCircle className="h-5 w-5" />
                            </Button>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`education.${index}.institution`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Institution</FormLabel>
                                  <FormControl>
                                    <Input placeholder="University or school name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`education.${index}.degree`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Degree</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Bachelor's, Master's" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`education.${index}.field`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Field of Study</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Computer Science" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`education.${index}.graduationYear`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Graduation Year</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., 2023" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                      
                      <FormField
                        control={form.control}
                        name="skills"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Skills</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List your relevant skills (separated by commas)" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="availability"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>When can you start?</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select availability" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="immediately">Immediately</SelectItem>
                                <SelectItem value="2_weeks">2 weeks notice</SelectItem>
                                <SelectItem value="1_month">1 month notice</SelectItem>
                                <SelectItem value="more_than_1_month">More than 1 month</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="relocate"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Are you willing to relocate if required?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => field.onChange(value === "true")}
                                defaultValue={field.value ? "true" : "false"}
                                className="flex flex-row space-x-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="true" id="relocate-yes" />
                                  <Label htmlFor="relocate-yes">Yes</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="false" id="relocate-no" />
                                  <Label htmlFor="relocate-no">No</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="portfolioUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Portfolio/Website URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://your-portfolio.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="additionalInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Information</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any other information you'd like the employer to know" 
                                className="min-h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={applyMutation.isPending}
                      >
                        {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - Job details */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingJob ? (
                    <div className="space-y-4">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : job ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <div className="flex items-center text-gray-600 mt-1">
                          <Building2 className="h-4 w-4 mr-1" />
                          <span>{job.company}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{job.location}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <BriefcaseBusiness className="h-4 w-4 mr-1" />
                        <span>{job.jobType}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <BadgeIndianRupee className="h-4 w-4 mr-1" />
                        <span>{job.salary}</span>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.skills?.map((skill, index) => (
                            <div 
                              key={index}
                              className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded"
                            >
                              {skill}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
                        <p className="text-sm text-gray-600">{job.description}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">Job not found</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate("/jobs")}
                  >
                    View All Jobs
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}