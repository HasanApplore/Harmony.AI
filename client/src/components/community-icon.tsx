import { Code, Briefcase, PenTool, DollarSign, BarChart2, Heart, Database, Users } from 'lucide-react';
import { getCommunityCategory } from '@/data/sample-communities';
import { Community } from '@shared/schema';

interface CommunityIconProps {
  community: Partial<Community> & { name?: string; description?: string };
  size?: number;
  className?: string;
}

export default function CommunityIcon({ community, size = 24, className = '' }: CommunityIconProps) {
  const category = getCommunityCategory(community);
  const iconProps = { size, className: `${className}` };
  
  // Return appropriate icon based on community category
  switch(category) {
    case 'Technology':
      return <Code {...iconProps} />;
    case 'Engineering':
      return <Code {...iconProps} />;
    case 'Design':
      return <PenTool {...iconProps} />;
    case 'Marketing':
      return <BarChart2 {...iconProps} />;
    case 'Finance':
      return <DollarSign {...iconProps} />;
    case 'Product':
      return <Briefcase {...iconProps} />;
    case 'Healthcare':
      return <Heart {...iconProps} />;
    case 'Data Science':
      return <Database {...iconProps} />;
    case 'Leadership':
      return <Users {...iconProps} />;
    default:
      return <Users {...iconProps} />;
  }
}