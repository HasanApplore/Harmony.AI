import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Search, TrendingUp, Award } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function ProfileStatsCard() {
  const { user } = useAuth();

  // For a real implementation, these would come from backend APIs
  // Simulating queries for profile stats
  const { data: profileStats, isLoading } = useQuery({
     queryKey: [`/api/users/${user?.id}/stats`],
     enabled: !!user,
    queryFn: async () => {
      try {
        const res = await fetch(`/api/users/${user?.id}/stats`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        // Ensure profileStrength exists; fall back to client calculation
        if (typeof data.profileStrength === 'undefined') {
          data.profileStrength = calculateProfileStrength(user);
        }
        return data;
      } catch (error) {
        // Fallback to client-side calculation if API fails
        return {
          profileViews: 0,
          digitalCvViews: user?.digitalCvUrl ? 0 : 0,
          searchAppearances: 0,
          profileStrength: calculateProfileStrength(user),
        };
      }
    },
  });

  function calculateProfileStrength(user: any) {
    if (!user) return 0;
    
    let strength = 0;
    if (user.name) strength += 20;
    if (user.title) strength += 20;
    if (user.bio) strength += 20;
    if (user.skills && user.skills.length > 0) strength += 20;
    if (user.digitalCvUrl) strength += 20;
    
    return strength;
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all">
      <CardHeader className="pb-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <CardTitle className="text-base font-semibold flex items-center">
          <TrendingUp className="h-4 w-4 mr-2" />
          Profile Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full mt-6" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="bg-white p-2 rounded-md shadow-sm mr-3 border border-gray-200">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600">Profile views</div>
                  <div className="text-xl font-bold text-gray-900">{profileStats?.profileViews}</div>
                </div>
                <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                  +12%
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="bg-white p-2 rounded-md shadow-sm mr-3 border border-gray-200">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600">Digital CV views</div>
                  <div className="text-xl font-bold text-gray-900">{profileStats?.digitalCvViews}</div>
                </div>
                {user?.digitalCvUrl ? (
                  <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                    +8%
                  </div>
                ) : (
                  <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    0
                  </div>
                )}
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="bg-white p-2 rounded-md shadow-sm mr-3 border border-gray-200">
                  <Search className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600">Search appearances</div>
                  <div className="text-xl font-bold text-gray-900">{profileStats?.searchAppearances}</div>
                </div>
                <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                  +15%
                </div>
              </div>
            </div>
            
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center mb-3">
                <Award className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="font-medium text-gray-800">Profile strength</h4>
              </div>
              
              <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${
                    (profileStats?.profileStrength || 0) === 100 
                      ? 'bg-gradient-to-r from-green-400 to-green-500' 
                      : (profileStats?.profileStrength || 0) > 60 
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                        : 'bg-gradient-to-r from-blue-400 to-blue-500'
                  }`}
                  style={{ width: `${profileStats?.profileStrength || 0}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {(profileStats?.profileStrength || 0) === 100 
                    ? 'Excellent! Your profile is complete' 
                    : `Your profile is ${profileStats?.profileStrength || 0}% complete`}
                </p>
                {(profileStats?.profileStrength || 0) < 100 && (
                  <Link href="/profile/edit">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1 h-auto rounded-full font-medium"
                    >
                      Complete profile
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
