import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProfileStat {
  label: string;
  value: number | string;
}

interface ProfileStatsProps {
  stats: ProfileStat[];
  profileStrength?: number;
}

export function ProfileStats({ stats, profileStrength }: ProfileStatsProps) {
  return (
    <Card className="bg-white shadow rounded-lg overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="font-semibold text-gray-800">Profile Stats</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {stats.map((stat, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-gray-600">{stat.label}</span>
              <span className="font-medium text-gray-800">{stat.value}</span>
            </div>
          ))}
        </div>
        
        {profileStrength !== undefined && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium text-gray-800 mb-2">Profile strength</h4>
            <Progress value={profileStrength} className="h-2.5 bg-gray-200" />
            <p className="text-sm text-gray-600 mt-2">
              Your profile is {profileStrength}% complete
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
