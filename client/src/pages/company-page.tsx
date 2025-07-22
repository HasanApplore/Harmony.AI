import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useParams, Link } from 'wouter';
import Layout from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building, 
  MapPin, 
  Users, 
  Link as LinkIcon, 
  Phone, 
  Mail, 
  Briefcase, 
  Edit, 
  Image as ImageIcon,
  Save,
  Plus,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

// Company details component
const CompanyDetails = ({ company, isOwner, onEdit }: { 
  company: any, 
  isOwner: boolean,
  onEdit: () => void 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center overflow-hidden">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
            ) : (
              <Building className="w-8 h-8 text-purple-500" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-gray-500 flex items-center mt-1">
              <MapPin className="w-4 h-4 mr-1" /> {company.location || 'Location not specified'}
            </p>
          </div>
        </div>
        {isOwner && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4" />
            Edit Company
          </Button>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">About</h2>
        <p className="text-gray-700">{company.description || 'No company description available.'}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-2">
          <Users className="w-5 h-5 text-purple-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900">Company Size</h3>
            <p className="text-gray-600">{company.size || 'Not specified'}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Briefcase className="w-5 h-5 text-purple-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900">Industry</h3>
            <p className="text-gray-600">{company.industry || 'Not specified'}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <LinkIcon className="w-5 h-5 text-purple-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900">Website</h3>
            {company.website ? (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                {company.website}
              </a>
            ) : (
              <p className="text-gray-600">Not specified</p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Mail className="w-5 h-5 text-purple-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900">Email</h3>
            {company.email ? (
              <a href={`mailto:${company.email}`} className="text-purple-600 hover:underline">
                {company.email}
              </a>
            ) : (
              <p className="text-gray-600">Not specified</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Company edit form
const CompanyEditForm = ({ company, onCancel, onSave }: { 
  company: any, 
  onCancel: () => void,
  onSave: (data: any) => void
}) => {
  const [formData, setFormData] = useState({
    name: company?.name || '',
    location: company?.location || '',
    description: company?.description || '',
    industry: company?.industry || '',
    size: company?.size || '',
    website: company?.website || '',
    email: company?.email || '',
    logoUrl: company?.logoUrl || ''
  });
  
  const [logoPreview, setLogoPreview] = useState<string | null>(company?.logoUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // In a real app, this would upload the file to the server
    setIsUploading(true);
    
    // Simulating an upload
    try {
      // Normally you'd upload the file here
      // For now, we'll just use the preview as the logo URL
      setTimeout(() => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
        setIsUploading(false);
      }, 1000);
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Edit Company Profile</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-purple-100 rounded-lg flex items-center justify-center overflow-hidden relative">
              {logoPreview ? (
                <img src={logoPreview} alt="Company logo" className="w-full h-full object-cover" />
              ) : (
                <Building className="w-10 h-10 text-purple-500" />
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
              <label className="flex items-center gap-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-md cursor-pointer hover:bg-purple-100 transition-colors border border-purple-200">
                <ImageIcon className="w-4 h-4" />
                <span className="text-sm">{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleLogoChange}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Company Name*</label>
              <Input 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                required 
                placeholder="Enter company name"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Industry</label>
              <Input 
                name="industry" 
                value={formData.industry} 
                onChange={handleInputChange} 
                placeholder="e.g. Technology, Healthcare"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <Input 
                name="location" 
                value={formData.location} 
                onChange={handleInputChange} 
                placeholder="e.g. Bengaluru, India"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Company Size</label>
              <Input 
                name="size" 
                value={formData.size} 
                onChange={handleInputChange} 
                placeholder="e.g. 50-100 employees"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <Input 
                name="website" 
                value={formData.website} 
                onChange={handleInputChange} 
                placeholder="e.g. https://example.com"
                type="url"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <Input 
                name="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                placeholder="e.g. contact@company.com"
                type="email"
              />
            </div>
          </div>
          
          <div className="mt-4 space-y-1">
            <label className="block text-sm font-medium text-gray-700">About the Company</label>
            <Textarea 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              placeholder="Describe your company, its mission, and values..."
              rows={5}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" type="submit">
            <Save className="w-4 h-4 mr-1" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

// Company posts component
const CompanyPosts = ({ companyId }: { companyId: number }) => {
  const { data: posts, isLoading, error } = useQuery<any[]>({
    queryKey: [`/api/companies/${companyId}/posts`],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }
  
  if (error || !posts) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className="py-10">
          <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Error Loading Posts</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            There was an error loading company posts. Please try again later.
          </p>
        </div>
      </div>
    );
  }
  
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className="py-10">
          <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Posts Yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            This company hasn't shared any posts yet. Check back later for updates.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {posts.map((post: any) => (
        <div key={post.id} className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden">
              {post.author?.profileImageUrl ? (
                <img src={post.author.profileImageUrl} alt={post.author.name} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-5 h-5 text-purple-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">{post.author?.name || "User"}</h3>
                <span className="text-gray-500 text-sm">• {new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-700 mt-1">{post.content}</p>
              {post.imageUrl && (
                <div className="mt-3 rounded-lg overflow-hidden">
                  <img src={post.imageUrl} alt="Post image" className="w-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Company jobs component
const CompanyJobs = ({ companyId }: { companyId: number }) => {
  const { data: jobs, isLoading, error } = useQuery<any[]>({
    queryKey: [`/api/companies/${companyId}/jobs`],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }
  
  if (error || !jobs) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className="py-10">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Error Loading Jobs</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            There was an error loading job listings. Please try again later.
          </p>
        </div>
      </div>
    );
  }
  
  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className="py-10">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Job Openings</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            This company doesn't have any active job listings at the moment. Check back later.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {jobs.map((job: any) => (
        <div key={job.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{job.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{job.location}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {job.skills && job.skills.slice(0, 3).map((skill: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                    {skill}
                  </span>
                ))}
                {job.skills && job.skills.length > 3 && (
                  <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs">
                    +{job.skills.length - 3} more
                  </span>
                )}
              </div>
            </div>
            <div>
              <Link href={`/jobs/${job.id}`}>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Create company form component
const CreateCompanyForm = ({ onCancel, onSubmit }: { onCancel: () => void, onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    industry: '',
    size: '',
    website: '',
    email: '',
    logoUrl: ''
  });
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // In a real app, this would upload the file to the server
    setIsUploading(true);
    
    // Simulating an upload
    try {
      // Normally you'd upload the file here
      // For now, we'll just use the preview as the logo URL
      setTimeout(() => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
        setIsUploading(false);
      }, 1000);
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Create Company</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-purple-100 rounded-lg flex items-center justify-center overflow-hidden relative">
              {logoPreview ? (
                <img src={logoPreview} alt="Company logo" className="w-full h-full object-cover" />
              ) : (
                <Building className="w-10 h-10 text-purple-500" />
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
              <label className="flex items-center gap-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-md cursor-pointer hover:bg-purple-100 transition-colors border border-purple-200">
                <ImageIcon className="w-4 h-4" />
                <span className="text-sm">{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleLogoChange}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Company Name*</label>
              <Input 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                required 
                placeholder="Enter company name"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Industry</label>
              <Input 
                name="industry" 
                value={formData.industry} 
                onChange={handleInputChange} 
                placeholder="e.g. Technology, Healthcare"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <Input 
                name="location" 
                value={formData.location} 
                onChange={handleInputChange} 
                placeholder="e.g. Bengaluru, India"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Company Size</label>
              <Input 
                name="size" 
                value={formData.size} 
                onChange={handleInputChange} 
                placeholder="e.g. 50-100 employees"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <Input 
                name="website" 
                value={formData.website} 
                onChange={handleInputChange} 
                placeholder="e.g. https://example.com"
                type="url"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <Input 
                name="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                placeholder="e.g. contact@company.com"
                type="email"
              />
            </div>
          </div>
          
          <div className="mt-4 space-y-1">
            <label className="block text-sm font-medium text-gray-700">About the Company</label>
            <Textarea 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              placeholder="Describe your company, its mission, and values..."
              rows={5}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" type="submit">
            <Plus className="w-4 h-4 mr-1" />
            Create Company
          </Button>
        </div>
      </form>
    </div>
  );
};

// Companies List component
const CompaniesList = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  
  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ['/api/companies'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Get unique values for filters
  const industries = [...new Set(companies.map((company: any) => company.industry).filter(Boolean))];
  const sizes = [...new Set(companies.map((company: any) => company.size).filter(Boolean))];
  const locations = [...new Set(companies.map((company: any) => company.location).filter(Boolean))];
  
  // Filter companies based on search and filters
  const filteredCompanies = companies.filter((company: any) => {
    const matchesSearch = !searchQuery || 
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.industry && company.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (company.location && company.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (company.description && company.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesIndustry = selectedIndustry === 'all' || company.industry === selectedIndustry;
    const matchesSize = selectedSize === 'all' || company.size === selectedSize;
    const matchesLocation = selectedLocation === 'all' || company.location === selectedLocation;
    
    return matchesSearch && matchesIndustry && matchesSize && matchesLocation;
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <div className="bg-red-50 p-4 rounded-lg inline-block mb-4">
          <Building className="w-12 h-12 text-red-400 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Error Loading Companies</h3>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          There was an error loading the companies. Please try again later.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6 flex items-center bg-white rounded-lg shadow-sm p-3">
        <Search className="text-gray-400 w-5 h-5 mr-2" />
        <Input
          type="text"
          placeholder="Search companies by name, industry, location or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 flex-1 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* Advanced Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Industries</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Sizes</option>
              {sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedIndustry('all');
                setSelectedSize('all');
                setSelectedLocation('all');
              }}
              className="px-4 py-2 h-10"
            >
              Clear Filters
            </Button>
          </div>
        </div>
        
        {/* Results Count */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredCompanies.length} of {companies.length} companies
        </div>
      </div>
      
      {filteredCompanies.length === 0 ? (
        <div className="text-center py-10">
          <div className="bg-purple-50 p-4 rounded-lg inline-block mb-4">
            <Building className="w-12 h-12 text-purple-400 mx-auto" />
          </div>
          {searchQuery ? (
            <>
              <h3 className="text-lg font-medium text-gray-900">No Matching Companies</h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                No companies match your search criteria. Try a different search or create a new company.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900">No Companies Yet</h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                There are no companies in the system yet. Be the first to create one!
              </p>
            </>
          )}
          <Link href="/companies/create">
            <Button className="mt-4 bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-1" />
              Create Company
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCompanies.map((company: any) => (
            <Link key={company.id} href={`/companies/${company.id}`} className="block">
              <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-6 h-6 text-purple-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{company.name}</h3>
                    {company.industry && (
                      <p className="text-sm text-gray-500">{company.industry}</p>
                    )}
                    {company.location && (
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {company.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Company Page Component
export const CompanyPage = () => {
  const [, setLocation] = useLocation();
  const { id: companyIdParam } = useParams<{ id?: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const companyId = companyIdParam ? parseInt(companyIdParam) : undefined;
  
  const { data: company, isLoading, error } = useQuery({
    queryKey: [`/api/companies/${companyId}`],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!companyId // Only run query if companyId exists
  });
  
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PATCH', `/api/companies/${companyId}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Company Updated',
        description: 'Company information has been updated successfully.',
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const isOwner = company && user && company.ownerId === user.id;
  
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };
  
  const handleCompanyUpdate = (data: any) => {
    updateCompanyMutation.mutate(data);
  };
  
  // If there's no companyId parameter, show the companies list
  if (!companyId) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
            <Link href="/companies/create">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-1" />
                Create Company
              </Button>
            </Link>
          </div>
          <CompaniesList />
        </div>
      </Layout>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
          </div>
        </div>
      </Layout>
    );
  }
  
  // Error state
  if (error || !company) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="text-center py-10">
            <div className="bg-red-50 p-4 rounded-lg inline-block mb-4">
              <Building className="w-12 h-12 text-red-400 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-900">Company Not Found</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              The company you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button 
              onClick={() => setLocation('/companies')} 
              className="mt-4 bg-purple-600 hover:bg-purple-700"
            >
              Back to Companies
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => setLocation('/companies')}
        >
          ← Back to Companies
        </Button>
        
        {isEditing ? (
          <CompanyEditForm 
            company={company} 
            onCancel={handleEditToggle} 
            onSave={handleCompanyUpdate} 
          />
        ) : (
          <CompanyDetails 
            company={company} 
            isOwner={isOwner} 
            onEdit={handleEditToggle} 
          />
        )}
        
        <Tabs defaultValue="posts" className="mt-6">
          <TabsList className="bg-purple-50">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="mt-4">
            <CompanyPosts companyId={companyId} />
          </TabsContent>
          <TabsContent value="jobs" className="mt-4">
            <CompanyJobs companyId={companyId} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// Create Company Page Component
export const CreateCompanyPage = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const createCompanyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/companies', data);
      return res.json();
    },
    onSuccess: (company) => {
      toast({
        title: 'Company Created',
        description: 'Your company has been created successfully.',
      });
      setLocation(`/companies/${company.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Creation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleCreateCompany = (data: any) => {
    createCompanyMutation.mutate(data);
  };
  
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => setLocation('/companies')}
        >
          ← Back to Companies
        </Button>
        <CreateCompanyForm 
          onCancel={() => setLocation('/companies')} 
          onSubmit={handleCreateCompany} 
        />
      </div>
    </Layout>
  );
};

export default CompanyPage;