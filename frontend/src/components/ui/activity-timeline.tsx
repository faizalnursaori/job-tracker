"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Activity, FileText, Phone, Mail, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  activity: string;
  description?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  className?: string;
}

const getActivityIcon = (activity: string) => {
  const activityLower = activity.toLowerCase();
  
  if (activityLower.includes('status') || activityLower.includes('changed')) {
    return <Activity className="h-4 w-4" />;
  } else if (activityLower.includes('note') || activityLower.includes('comment')) {
    return <FileText className="h-4 w-4" />;
  } else if (activityLower.includes('call') || activityLower.includes('phone')) {
    return <Phone className="h-4 w-4" />;
  } else if (activityLower.includes('email') || activityLower.includes('message')) {
    return <Mail className="h-4 w-4" />;
  } else if (activityLower.includes('interview') || activityLower.includes('meeting')) {
    return <Calendar className="h-4 w-4" />;
  }
  
  return <Clock className="h-4 w-4" />;
};

const getActivityColor = (activity: string) => {
  const activityLower = activity.toLowerCase();
  
  if (activityLower.includes('status')) {
    return 'bg-blue-500';
  } else if (activityLower.includes('note')) {
    return 'bg-green-500';
  } else if (activityLower.includes('interview')) {
    return 'bg-purple-500';
  } else if (activityLower.includes('rejected')) {
    return 'bg-red-500';
  } else if (activityLower.includes('accepted') || activityLower.includes('offer')) {
    return 'bg-emerald-500';
  }
  
  return 'bg-gray-500';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInHours < 168) { // 7 days
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
  
  return date.toLocaleDateString();
};

export function ActivityTimeline({ activities, className }: ActivityTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          <CardDescription>
            Track the progress of your job application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No activities yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Activities will appear here as you update your application status
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
        <CardDescription>
          Recent updates and changes to this application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          
          <div className="space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="relative flex items-start gap-4">
                {/* Timeline dot */}
                <div className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background",
                  getActivityColor(activity.activity)
                )}>
                  {getActivityIcon(activity.activity)}
                </div>
                
                {/* Activity content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">
                      {activity.activity}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {formatDate(activity.createdAt)}
                    </Badge>
                  </div>
                  
                  {activity.description && (
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  )}
                  
                  {}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 