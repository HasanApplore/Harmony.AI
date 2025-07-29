import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HarmonyLogo from "@/components/harmony-logo";
import { Loader2, ShieldAlert, Eye, EyeOff, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatabaseError } from "@/components/ui/database-error";

// Country data with phone codes and validation patterns
const countries = [
  { code: "IN", name: "India", phoneCode: "+91", pattern: /^[6-9]\d{9}$/, minLength: 10, maxLength: 10 },
  { code: "US", name: "United States", phoneCode: "+1", pattern: /^\d{10}$/, minLength: 10, maxLength: 10 },
  { code: "GB", name: "United Kingdom", phoneCode: "+44", pattern: /^\d{10,11}$/, minLength: 10, maxLength: 11 },
  { code: "CA", name: "Canada", phoneCode: "+1", pattern: /^\d{10}$/, minLength: 10, maxLength: 10 },
  { code: "AU", name: "Australia", phoneCode: "+61", pattern: /^\d{9}$/, minLength: 9, maxLength: 9 },
  { code: "DE", name: "Germany", phoneCode: "+49", pattern: /^\d{10,12}$/, minLength: 10, maxLength: 12 },
  { code: "FR", name: "France", phoneCode: "+33", pattern: /^\d{9}$/, minLength: 9, maxLength: 9 },
  { code: "JP", name: "Japan", phoneCode: "+81", pattern: /^\d{10,11}$/, minLength: 10, maxLength: 11 },
  { code: "BR", name: "Brazil", phoneCode: "+55", pattern: /^\d{10,11}$/, minLength: 10, maxLength: 11 },
  { code: "MX", name: "Mexico", phoneCode: "+52", pattern: /^\d{10}$/, minLength: 10, maxLength: 10 },
];

// Extended schema for login
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Extended schema for registration with validation
const registerSchema = insertUserSchema.extend({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"),
  name: z.string().min(1, "Full name is required"),
  mobileNumber: z.string()
    .min(1, "Mobile number is required")
    .refine((val) => {
      // This will be validated dynamically based on selected country
      return true;
    }, "Please enter a valid mobile number"),
  countryCode: z.string().min(1, "Country is required"),
  isRecruiter: z.boolean().default(false),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Forgot password schema
const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mobileNumberError, setMobileNumberError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default to India
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState<string>("");
  const [forgotPasswordError, setForgotPasswordError] = useState<string>("");
  const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);
  const [isSubmittingForgotPassword, setIsSubmittingForgotPassword] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [databaseError, setDatabaseError] = useState<string>("");
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      name: "",
      title: "",
      mobileNumber: "",
      countryCode: "IN",
      isRecruiter: false,
      terms: false,
    },
  });

  // Forgot password form
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  
  // If user is already logged in, redirect to home page
  if (user) {
    return <Redirect to="/" />;
  }

  // Custom styling
  const inputStyles = "border-gray-200 focus:border-purple-400 focus:ring-purple-100 rounded-md py-2.5";
  
  // Submit handlers
  const onLoginSubmit = (data: LoginFormValues) => {
    console.log("Login form submitted with:", data.username);
    
    // Clear any previous database errors
    setDatabaseError("");
    
    // Check if this is an admin login (admin/admin123)
    if (data.username === "admin" && data.password === "admin123") {
      // Store admin session
      sessionStorage.setItem('adminLoggedIn', 'true');
      
      // Redirect to admin dashboard
      window.location.href = "/admin-dashboard";
    } else {
      // Handle regular user login
      try {
        loginMutation.mutate({
          username: data.username,
          password: data.password
        }, {
          onSuccess: (user) => {
            console.log("Login success callback received user:", user);
            // Redirect based on user role
            if (user.isRecruiter) {
              window.location.href = "/recruiter-dashboard";
            } else {
              window.location.href = "/";
            }
          },
          onError: (error: any) => {
            console.error("Login error callback:", error);
            
            // Check if it's a database connection error
            if (error.response?.data?.error?.includes('database') || 
                error.response?.data?.message?.includes('database') || 
                error.message?.includes('database')) {
              setDatabaseError("We're having trouble connecting to our database. Please try again later.");
            }
          }
        });
      } catch (error) {
        console.error("Exception during login form submission:", error);
      }
    }
  };
  
  // Function to retry login after database error
  const handleRetryAfterDatabaseError = () => {
    setDatabaseError("");
    loginForm.handleSubmit(onLoginSubmit)();
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    console.log("Registration form submitted");
    
    // Check for validation errors before submitting
    if (usernameError || emailError || mobileNumberError) {
      console.log("Validation errors prevent submission");
      return;
    }
    
    try {
      // Remove confirmPassword and terms from the data before submitting
      const { confirmPassword, terms, ...registerData } = data;
      registerMutation.mutate(registerData as InsertUser, {
        onSuccess: (user) => {
          console.log("Registration success callback received user:", user);
          // Redirect to home page on successful registration
          window.location.href = "/";
        },
        onError: (error) => {
          console.error("Registration error callback:", error);
        }
      });
    } catch (error) {
      console.error("Exception during registration form submission:", error);
    }
  };

  const onForgotPasswordSubmit = async (data: ForgotPasswordFormValues) => {
    console.log("Forgot password form submitted with:", data);
    setIsSubmittingForgotPassword(true);
    setForgotPasswordError("");
    setForgotPasswordSuccess("");
    
    try {
      // Use the proxied API endpoint
      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Response result:", result);

      if (response.ok) {
        setForgotPasswordSuccess("Request is sent to admin. An admin will review your request and contact you with further instructions.");
        setForgotPasswordError("");
        setShowSuccessToast(true);
        // Reset the form
        forgotPasswordForm.reset();
        // Don't hide the form immediately, let user see the success message
        // The form will be hidden when they click Cancel or after 8 seconds
        setTimeout(() => {
          setShowForgotPasswordForm(false);
          setForgotPasswordSuccess("");
          setShowSuccessToast(false);
        }, 8000);
      } else {
        setForgotPasswordError(result.message || "An error occurred. Please try again.");
        setForgotPasswordSuccess("");
      }
    } catch (error) {
      console.error("Error submitting forgot password request:", error);
      setForgotPasswordError("Network error. Please check your connection and try again.");
      setForgotPasswordSuccess("");
    } finally {
      setIsSubmittingForgotPassword(false);
    }
  };

  // Function to check if mobile number is already in use
  const checkMobileNumberAvailability = async (mobileNumber: string) => {
    try {
      const response = await fetch(`/api/users/check-mobile?mobileNumber=${encodeURIComponent(mobileNumber)}&countryCode=${encodeURIComponent(selectedCountry.code)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setMobileNumberError("This mobile number is already registered. Please use a different number.");
          return false;
        } else {
          setMobileNumberError("");
          return true;
        }
      }
      return true; // Assume available if API call fails
    } catch (error) {
      console.error("Error checking mobile number:", error);
      return true; // Assume available if API call fails
    }
  };

  // Handle mobile number input change
  const handleMobileNumberChange = (value: string) => {
    // Only allow digits and limit to selected country's max length
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length <= selectedCountry.maxLength) {
      return numericValue;
    }
    return numericValue.slice(0, selectedCountry.maxLength);
  };

  // Handle country change
  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      registerForm.setValue("countryCode", countryCode);
      setMobileNumberError(""); // Clear previous errors
    }
  };

  // Validate mobile number based on selected country
  const validateMobileNumber = (number: string) => {
    if (!number) return "Mobile number is required";
    if (!selectedCountry) return "Please select a country";
    
    if (number.length < selectedCountry.minLength) {
      return `Mobile number must be at least ${selectedCountry.minLength} digits`;
    }
    if (number.length > selectedCountry.maxLength) {
      return `Mobile number must not exceed ${selectedCountry.maxLength} digits`;
    }
    if (!selectedCountry.pattern.test(number)) {
      return `Please enter a valid ${selectedCountry.name} mobile number`;
    }
    return "";
  };

  // Handle mobile number blur event
  const handleMobileNumberBlur = async (value: string) => {
    // Only validate if we have a value and a selected country
    if (!value || !selectedCountry) {
      setMobileNumberError("");
      return;
    }
    
    // Clean the value to ensure it only contains digits
    const cleanValue = value.replace(/[^0-9]/g, '');
    
    const validationError = validateMobileNumber(cleanValue);
    if (validationError) {
      setMobileNumberError(validationError);
      return;
    }
    
    if (cleanValue && selectedCountry.pattern.test(cleanValue)) {
      await checkMobileNumberAvailability(cleanValue);
    } else {
      setMobileNumberError("");
    }
  };

  // Function to check if email is already in use
  const checkEmailAvailability = async (email: string) => {
    try {
      const response = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setEmailError("This email is already registered. Please use a different email.");
          return false;
        } else {
          setEmailError("");
          return true;
        }
      }
      return true; // Assume available if API call fails
    } catch (error) {
      console.error("Error checking email:", error);
      return true; // Assume available if API call fails
    }
  };

  // Handle email blur event
  const handleEmailBlur = async (value: string) => {
    if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      await checkEmailAvailability(value);
    } else {
      setEmailError("");
    }
  };

  // Function to check if username is already in use
  const checkUsernameAvailability = async (username: string) => {
    try {
      const response = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setUsernameError("This username is already taken. Please choose a different username.");
          return false;
        } else {
          setUsernameError("");
          return true;
        }
      }
      return true; // Assume available if API call fails
    } catch (error) {
      console.error("Error checking username:", error);
      return true; // Assume available if API call fails
    }
  };

  // Handle username blur event
  const handleUsernameBlur = async (value: string) => {
    if (value && /^[a-zA-Z0-9_]{3,20}$/.test(value)) {
      await checkUsernameAvailability(value);
    } else {
      setUsernameError("");
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Hero Section */}
      <div className="hidden lg:flex bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 text-white lg:w-1/2 p-4 sm:p-6 md:p-8 lg:p-12 flex-col justify-center relative overflow-hidden">
        {/* Background with elegant pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='25' height='25' viewBox='0 0 25 25' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M10 4h-1v5H4v1h5v5h1v-5h5v-1h-5V4z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '25px 25px'
          }}></div>
        </div>
        
        {/* Elegant decorative elements */}
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute top-1/4 right-8 w-2 h-24 bg-white/20 rounded-full"></div>
        <div className="absolute top-1/3 right-16 w-2 h-16 bg-white/10 rounded-full"></div>
        <div className="absolute top-1/2 -right-20 w-40 h-40 rounded-full bg-purple-500/10 blur-xl"></div>
        
        {/* Abstract shapes */}
        <div className="absolute top-10 right-10 w-20 h-20 rounded-lg rotate-12 bg-gradient-to-br from-purple-400/15 to-purple-300/15 backdrop-blur-sm"></div>
        <div className="absolute bottom-20 left-8 w-16 h-16 rounded-full bg-gradient-to-br from-purple-400/15 to-purple-300/15 backdrop-blur-sm"></div>
        
        <div className="max-w-md mx-auto relative z-10 flex flex-col h-full justify-center">
          <div className="mb-8 lg:mb-12 flex items-center justify-start">
            <HarmonyLogo size="xl" />
          </div>
          
          <h2 className="text-xl lg:text-2xl font-medium mb-4 lg:mb-5 text-white">
            Professional Networking Platform
          </h2>
          
          <div className="w-16 lg:w-20 h-1 bg-purple-300 mb-4 lg:mb-6 rounded-full"></div>
          
          <p className="text-base lg:text-lg mb-6 lg:mb-10 text-white/90 leading-relaxed">
            Connect with professionals, showcase your skills with Digital CVs, and find your perfect job match with AI assistance.
          </p>
          
          <div className="space-y-4 lg:space-y-6">
            <div className="flex items-center p-2 lg:p-3 rounded-lg hover:bg-white/10 transition-colors">
              <div className="flex-shrink-0 mr-3 lg:mr-4 w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
                <svg className="h-5 w-5 lg:h-6 lg:w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm lg:text-base text-white mb-1">Digital CVs</h3>
                <p className="text-xs lg:text-sm text-white/70">Video-based profiles that showcase your personality and skills</p>
              </div>
            </div>
            
            <div className="flex items-center p-2 lg:p-3 rounded-lg hover:bg-white/10 transition-colors">
              <div className="flex-shrink-0 mr-3 lg:mr-4 w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
                <svg className="h-5 w-5 lg:h-6 lg:w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm lg:text-base text-white mb-1">AI Job Matching</h3>
                <p className="text-xs lg:text-sm text-white/70">Intelligent matching based on your unique profile</p>
              </div>
            </div>
            
            <div className="flex items-center p-2 lg:p-3 rounded-lg hover:bg-white/10 transition-colors">
              <div className="flex-shrink-0 mr-3 lg:mr-4 w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
                <svg className="h-5 w-5 lg:h-6 lg:w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm lg:text-base text-white mb-1">Communities</h3>
                <p className="text-xs lg:text-sm text-white/70">Connect with professionals to grow your network</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 lg:mt-12">
            <p className="text-xs lg:text-sm text-white/80">Already trusted by thousands of professionals worldwide</p>
            <div className="flex items-center mt-3 lg:mt-4 space-x-3 lg:space-x-4">
              <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/30 rounded-full"></div>
              <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/30 rounded-full"></div>
              <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/30 rounded-full"></div>
              <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/30 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Form Section */}
      <div className="lg:w-1/2 w-full flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 bg-white/95 backdrop-blur-sm h-full">
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-md h-full flex flex-col justify-center">
          {/* Mobile Header */}
          <div className="lg:hidden mb-4 sm:mb-6 flex-shrink-0">
            <div className="flex justify-start">
              <HarmonyLogo size="lg" />
            </div>
          </div>
          
          <Card className="border-gray-200/50 shadow-xl bg-white/80 backdrop-blur-sm max-h-full flex flex-col transition-all duration-300 ease-in-out">
            <CardHeader className="space-y-2 sm:space-y-3 pb-4 sm:pb-6 px-4 sm:px-6 pt-4 sm:pt-6 flex-shrink-0">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 text-center">Welcome</CardTitle>
              <CardDescription className="text-gray-600 text-center text-sm sm:text-base px-2 transition-all duration-300 ease-in-out">
                {activeTab === "login" 
                  ? "Sign in to your account to continue your journey" 
                  : "Create an account to unlock your potential"}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 flex-1 overflow-y-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200/50 p-1 h-10 sm:h-11 transition-all duration-300 ease-in-out">
                  <TabsTrigger 
                    value="login" 
                    className="text-xs sm:text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 ease-in-out rounded-md h-8 sm:h-9 hover:bg-purple-50"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    className="text-xs sm:text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 ease-in-out rounded-md h-8 sm:h-9 hover:bg-purple-50"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>

                {/* Login Form */}
                <TabsContent value="login" className="transition-all duration-300 ease-in-out data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-right-1 data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=inactive]:slide-out-to-left-1">
                  {/* Display database connection error if present */}
                  {databaseError && (
                    <DatabaseError 
                      message={databaseError}
                      onRetry={handleRetryAfterDatabaseError}
                    />
                  )}
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-3 sm:space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Username or Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Username or Email" 
                                className="rounded-md border-gray-200 py-2.5 sm:py-3 text-sm sm:text-base focus:border-purple-400 focus:ring-purple-100 h-10 sm:h-11"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Password</FormLabel>
                            <FormControl>
                              {/* Password Input */}  
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Password" 
                                  className="rounded-md border-gray-200 py-2.5 sm:py-3 text-sm sm:text-base focus:border-purple-400 focus:ring-purple-100 h-10 sm:h-11 pr-10"
                                  {...field} 
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                                  ) : (
                                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="remember" className="border-gray-300 text-purple-500 focus:ring-purple-400 h-4 w-4" />
                          <label
                            htmlFor="remember"
                            className="text-xs sm:text-sm leading-none cursor-pointer text-gray-700"
                          >
                            Remember me
                          </label>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setShowForgotPasswordForm(!showForgotPasswordForm)}
                          className="text-xs sm:text-sm text-purple-500 hover:text-purple-600 hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      
                      {/* Forgot Password Form */}
                      {showForgotPasswordForm && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">Reset Password</h3>
                          <Form {...forgotPasswordForm}>
                            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-3">
                              <FormField
                                control={forgotPasswordForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700 text-xs">Email Address</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="email" 
                                        placeholder="Enter your email address" 
                                        className="h-9 text-sm rounded-md border-gray-200 focus:border-purple-400 focus:ring-purple-100"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                              
                              {forgotPasswordSuccess && (
                                <div className="p-4 rounded-md bg-green-50 border-2 border-green-200 shadow-sm">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div className="ml-3">
                                      <p className="text-sm font-medium text-green-800">{forgotPasswordSuccess}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {forgotPasswordError && (
                                <div className="p-2 rounded-md bg-red-50 border border-red-200">
                                  <p className="text-xs text-red-700">{forgotPasswordError}</p>
                                </div>
                              )}
                              
                              <div className="flex space-x-2">
                                <Button 
                                  type="submit" 
                                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md text-xs font-medium h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isSubmittingForgotPassword || !forgotPasswordForm.watch("email") || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordForm.watch("email") || "")}
                                >
                                  {isSubmittingForgotPassword ? (
                                    <>
                                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                      Submitting...
                                    </>
                                  ) : (
                                    "Submit Request"
                                  )}
                                </Button>
                                <Button 
                                  type="button"
                                  onClick={() => {
                                    setShowForgotPasswordForm(false);
                                    setForgotPasswordSuccess("");
                                    setForgotPasswordError("");
                                    forgotPasswordForm.reset();
                                  }}
                                  className="px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-md text-xs font-medium h-8"
                                  disabled={isSubmittingForgotPassword}
                                >
                                  Cancel
                                </Button>
                              </div>
                              
                              <div className="text-center">
                                <p className="text-xs text-gray-600">
                                  An admin will review your request and contact you with further instructions.
                                </p>
                                {!forgotPasswordForm.watch("email") && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Please enter a valid email address to submit your request.
                                  </p>
                                )}
                              </div>
                            </form>
                          </Form>
                        </div>
                      )}
                      
                      <Button 
                        type="submit" 
                        className="w-full mt-6 sm:mt-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] h-11 sm:h-12"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                {/* Register Form */}
                <TabsContent value="register" className="transition-all duration-300 ease-in-out data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-left-1 data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=inactive]:slide-out-to-right-1">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3 sm:space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 text-xs sm:text-sm">Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your full name" 
                                className="h-10 sm:h-11 text-sm sm:text-base rounded-md border-gray-200 focus:border-purple-400 focus:ring-purple-100"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 text-xs sm:text-sm">Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Choose a username (3-20 characters, letters, numbers, underscores)" 
                                className={`h-10 sm:h-11 text-sm sm:text-base rounded-md border-gray-200 focus:border-purple-400 focus:ring-purple-100 ${
                                  usernameError ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""
                                }`}
                                {...field} 
                                onBlur={(e) => {
                                  field.onBlur(e);
                                  handleUsernameBlur(e.target.value);
                                }}
                              />
                            </FormControl>
                            {usernameError && (
                              <p className="text-xs sm:text-sm text-red-600 mt-1">{usernameError}</p>
                            )}
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 text-xs sm:text-sm">Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Enter your email" 
                                className={`h-10 sm:h-11 text-sm sm:text-base rounded-md border-gray-200 focus:border-purple-400 focus:ring-purple-100 ${
                                  emailError ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""
                                }`}
                                {...field} 
                                onBlur={(e) => {
                                  field.onBlur(e);
                                  handleEmailBlur(e.target.value);
                                }}
                              />
                            </FormControl>
                            {emailError && (
                              <p className="text-xs sm:text-sm text-red-600 mt-1">{emailError}</p>
                            )}
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="mobileNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 text-xs sm:text-sm">Mobile Number</FormLabel>
                            <FormControl>
                              <div className="flex space-x-2">
                                <Select value={selectedCountry.code} onValueChange={handleCountryChange}>
                                  <SelectTrigger className="w-24 h-10 sm:h-11 text-xs sm:text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {countries.map((country) => (
                                      <SelectItem key={country.code} value={country.code}>
                                        <div className="flex items-center space-x-2">
                                          <span className="text-xs">{country.phoneCode}</span>
                                          <span className="text-xs opacity-60">({country.code})</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex-1 relative">
                                  <Input 
                                    type="tel" 
                                    placeholder={`Enter ${selectedCountry.minLength}-${selectedCountry.maxLength} digit number`}
                                    className={`h-10 sm:h-11 text-sm sm:text-base rounded-md border-gray-200 focus:border-purple-400 focus:ring-purple-100 ${
                                      mobileNumberError ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""
                                    }`}
                                    {...field} 
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const cleanedValue = handleMobileNumberChange(e.target.value);
                                      field.onChange(cleanedValue);
                                    }}
                                    onBlur={(e) => {
                                      field.onBlur(e);
                                      handleMobileNumberBlur(e.target.value);
                                    }}
                                  />
                                </div>
                              </div>
                            </FormControl>
                            {mobileNumberError && (
                              <p className="text-xs sm:text-sm text-red-600 mt-1">{mobileNumberError}</p>
                            )}
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 text-xs sm:text-sm">Job Title</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your job title" 
                                value={field.value || ''} 
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                disabled={field.disabled}
                                name={field.name}
                                ref={field.ref}
                                className="h-10 sm:h-11 text-sm sm:text-base rounded-md border-gray-200 focus:border-purple-400 focus:ring-purple-100"
                              />
                            </FormControl>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 text-xs sm:text-sm">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create a password" 
                                  className="h-10 sm:h-11 text-sm sm:text-base rounded-md border-gray-200 focus:border-purple-400 focus:ring-purple-100 pr-10"
                                  {...field} 
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                                  ) : (
                                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 text-xs sm:text-sm">Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Confirm your password" 
                                  className="h-10 sm:h-11 text-sm sm:text-base rounded-md border-gray-200 focus:border-purple-400 focus:ring-purple-100 pr-10"
                                  {...field} 
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                                  ) : (
                                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="isRecruiter"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-gray-700 text-xs sm:text-sm">Account Type</FormLabel>
                            <FormControl>
                              <ToggleGroup
                                type="single"
                                variant="outline"
                                className="grid grid-cols-2 gap-1 border border-gray-300 rounded-md p-1"
                                value={field.value ? "recruiter" : "jobseeker"}
                                onValueChange={(value) => field.onChange(value === "recruiter")}
                              >
                                <ToggleGroupItem 
                                  value="jobseeker" 
                                  className="flex items-center justify-center p-2 sm:p-2.5 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-700 text-xs sm:text-sm h-9 sm:h-10"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  Job Seeker
                                </ToggleGroupItem>
                                <ToggleGroupItem 
                                  value="recruiter" 
                                  className="flex items-center justify-center p-2 sm:p-2.5 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-700 text-xs sm:text-sm h-9 sm:h-10"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  Recruiter
                                </ToggleGroupItem>
                              </ToggleGroup>
                            </FormControl>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="terms"
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-2 space-y-0 pt-2">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange} 
                                id="terms"
                                className="border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel htmlFor="terms" className="text-xs sm:text-sm font-normal text-gray-700 leading-relaxed">
                                I agree to the <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline">Privacy Policy</a>
                              </FormLabel>
                              <FormMessage className="text-xs sm:text-sm" />
                            </div>
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full mt-4 sm:mt-6 bg-purple-600 hover:bg-purple-700 text-white py-2.5 sm:py-3 rounded-md font-medium text-sm sm:text-base h-10 sm:h-11 transition-all duration-200 transform hover:scale-[1.02]"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            Creating account
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg border-l-4 border-green-400 animate-in slide-in-from-right-2 duration-300">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Request sent successfully!</span>
          </div>
        </div>
      )}
    </div>
  );
}