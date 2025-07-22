import { Community } from "@shared/schema";

// Sample community images - these are placeholder URLs that reflect community themes
export const communityImages = {
  tech: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=500&auto=format&fit=crop",
  design: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=500&auto=format&fit=crop",
  marketing: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=500&auto=format&fit=crop",
  finance: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=500&auto=format&fit=crop",
  product: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=500&auto=format&fit=crop",
  healthcare: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=500&auto=format&fit=crop",
  data: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=500&auto=format&fit=crop",
  leadership: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=500&auto=format&fit=crop",
};

// Categories to tag communities
export const communityCategories = [
  "Technology",
  "Design",
  "Marketing",
  "Finance",
  "Product",
  "Healthcare",
  "Data Science",
  "Leadership",
  "Startup",
  "Engineering",
];

// Sample communities data based on user's screenshot
export const sampleCommunities: Partial<Community>[] = [
  {
    id: 1,
    name: "Tech Professionals",
    description: "A community for tech professionals in Bangalore to network, share knowledge, and discuss industry trends",
    memberCount: 1245,
    createdBy: 3,
  },
  {
    id: 2,
    name: "Delhi UX Designers",
    description: "Connect with UX designers in Delhi to share design insights, job opportunities, and collaborate on projects",
    memberCount: 856,
    createdBy: 4,
  },
  {
    id: 3,
    name: "Mumbai Software Engineers",
    description: "A group for software engineers in Mumbai to discuss technical challenges, share solutions, and network",
    memberCount: 1890,
    createdBy: 6,
  },
  {
    id: 4,
    name: "AI & Machine Learning India",
    description: "Discuss the latest in artificial intelligence and machine learning with professionals across India",
    memberCount: 2150,
    createdBy: 5,
  },
  {
    id: 5,
    name: "Women in Tech Leadership",
    description: "Supporting and connecting women in technology leadership roles across industries",
    memberCount: 943,
    createdBy: 7,
  },
  {
    id: 6,
    name: "Product Managers Network",
    description: "For product managers to share insights, discuss strategies, and advance their careers",
    memberCount: 1276,
    createdBy: 5,
  },
  {
    id: 7,
    name: "Digital Marketing Professionals",
    description: "Connect with digital marketing experts to discuss trends, tools, and techniques",
    memberCount: 1587,
    createdBy: 7,
  },
  {
    id: 8,
    name: "Data Science Enthusiasts",
    description: "A community for data scientists, analysts, and enthusiasts to share knowledge and experiences",
    memberCount: 1732,
    createdBy: 6,
  },
];

// Function to get image URL for a community based on its name or description
export function getCommunityImageUrl(community: Partial<Community>): string {
  const name = community.name?.toLowerCase() || '';
  const description = community.description?.toLowerCase() || '';
  
  if (name.includes('tech') || description.includes('tech')) {
    return communityImages.tech;
  } else if (name.includes('design') || description.includes('design')) {
    return communityImages.design;
  } else if (name.includes('market') || description.includes('market')) {
    return communityImages.marketing;
  } else if (name.includes('finance') || description.includes('finance')) {
    return communityImages.finance;
  } else if (name.includes('product') || description.includes('product')) {
    return communityImages.product;
  } else if (name.includes('health') || description.includes('health')) {
    return communityImages.healthcare;
  } else if (name.includes('data') || description.includes('data')) {
    return communityImages.data;
  } else if (name.includes('leader') || description.includes('leader')) {
    return communityImages.leadership;
  } else {
    // Default to tech image if no match
    return communityImages.tech;
  }
}

// Get appropriate category for a community
export function getCommunityCategory(community: Partial<Community>): string {
  const name = community.name?.toLowerCase() || '';
  const description = community.description?.toLowerCase() || '';
  
  if (name.includes('tech') || description.includes('tech')) {
    return "Technology";
  } else if (name.includes('design') || description.includes('design')) {
    return "Design";
  } else if (name.includes('market') || description.includes('market')) {
    return "Marketing";
  } else if (name.includes('finance') || description.includes('finance')) {
    return "Finance";
  } else if (name.includes('product') || description.includes('product')) {
    return "Product";
  } else if (name.includes('health') || description.includes('health')) {
    return "Healthcare";
  } else if (name.includes('data') || description.includes('data')) {
    return "Data Science";
  } else if (name.includes('leader') || description.includes('leader')) {
    return "Leadership";
  } else if (name.includes('software') || description.includes('software') || 
             name.includes('engineer') || description.includes('engineer')) {
    return "Engineering";
  } else {
    return "Technology";
  }
}