import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityLog } from "@shared/schema";

interface RecentActivityProps {
  activities: ActivityLog[];
  isLoading?: boolean;
}

const getActivityColor = (action: string) => {
  switch (action) {
    case 'create':
      return 'bg-blue-500';
    case 'update':
      return 'bg-green-500';
    case 'delete':
      return 'bg-red-500';
    case 'complete':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
};

const formatTimeAgo = (date: Date | string) => {
  const now = new Date();
  const activityDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return activityDate.toLocaleDateString();
};

export default function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-start gap-3">
                <div className="w-2 h-2 bg-slate-200 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-slate-500 text-sm">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.action)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900">{activity.description}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatTimeAgo(activity.createdAt!)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
