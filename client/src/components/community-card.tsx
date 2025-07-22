import { Community } from "@shared/schema";
import { Users, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getCommunityImageUrl, getCommunityCategory } from "@/data/sample-communities";
import CommunityIcon from "./community-icon";

interface CommunityCardProps {
  community: Community;
  onClick?: (community: Community) => void;
  isMember?: boolean;
}

export default function CommunityCard({ community, onClick, isMember = false }: CommunityCardProps) {
  // Get image URL based on community name/description
  const imageUrl = getCommunityImageUrl(community);
  const category = getCommunityCategory(community);
  
  // Extract location from community name if it exists
  const locationMatch = community.name.match(/\b(Bangalore|Delhi|Mumbai|Hyderabad|Chennai|Pune|Kolkata)\b/i);
  const location = locationMatch ? locationMatch[0] : null;
  
  return (
    <Card 
      className="cursor-pointer overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1" 
      onClick={() => onClick && onClick(community)}
    >
      <div className="p-0">
        <div className="h-32 relative overflow-hidden">
          {/* Community image or fallback gradient */}
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={community.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-700"></div>
          )}
          
          {/* Overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          {/* Category icon */}
          <div className="absolute top-2 left-2 bg-white/90 p-1.5 rounded-full shadow-md">
            <CommunityIcon community={community} size={20} className="text-purple-600" />
          </div>
          
          {/* Member badge if applicable */}
          {isMember && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs py-1 px-2 rounded-full">
              Member
            </div>
          )}
          
          {/* Community name on the image */}
          <h3 className="absolute bottom-2 left-3 font-semibold text-white text-lg">{community.name}</h3>
        </div>
        
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{community.description}</p>
          
          <div className="flex flex-wrap items-center justify-between">
            <span className="text-xs bg-purple-50 text-purple-700 py-1 px-2 rounded-full flex items-center mb-1">
              <Users className="h-3 w-3 mr-1" /> {community.memberCount} members
            </span>
            
            <div className="flex items-center space-x-1">
              <span className="text-xs bg-blue-50 text-blue-700 py-1 px-2 rounded-full">
                {category}
              </span>
              
              {location && (
                <span className="text-xs bg-green-50 text-green-700 py-1 px-2 rounded-full flex items-center">
                  <MapPin className="h-3 w-3 mr-1" /> {location}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
