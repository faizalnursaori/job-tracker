import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Clock,
  Plus,
  ArrowRight 
} from "lucide-react";
import Link from "next/link";

// This would typically come from an API call
const mockStats = {
  totalApplications: 24,
  statusBreakdown: [
    { status: "Applied", count: 8, color: "#3b82f6" },
    { status: "Interview", count: 3, color: "#10b981" },
    { status: "Offer", count: 1, color: "#f59e0b" },
    { status: "Rejected", count: 12, color: "#ef4444" }
  ],
  priorityBreakdown: [
    { priority: 1, count: 5 },
    { priority: 2, count: 12 },
    { priority: 3, count: 7 }
  ],
  recentActivity: [
    {
      id: "1",
      jobTitle: "Senior Frontend Developer",
      company: { name: "TechCorp" },
      status: { name: "Interview", color: "#10b981" },
      createdAt: "2024-01-15T10:00:00Z"
    },
    {
      id: "2", 
      jobTitle: "Full Stack Engineer",
      company: { name: "StartupXYZ" },
      status: { name: "Applied", color: "#3b82f6" },
      createdAt: "2024-01-14T14:30:00Z"
    },
    {
      id: "3",
      jobTitle: "React Developer", 
      company: { name: "BigCorp" },
      status: { name: "Rejected", color: "#ef4444" },
      createdAt: "2024-01-13T09:15:00Z"
    }
  ]
};

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Link href="/applications/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Application
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Applications
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Applications
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockStats.statusBreakdown.filter(s => s.status !== "Rejected").reduce((sum, s) => sum + s.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Non-rejected applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Companies
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              Unique companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Response Rate
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <p className="text-xs text-muted-foreground">
              Companies responded
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Status Breakdown */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="space-y-3">
              {mockStats.statusBreakdown.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 text-sm font-medium">
                    {item.status}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>
              Your latest job applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockStats.recentActivity.map((app) => (
                <div key={app.id} className="flex items-center">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">
                      {app.jobTitle}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {app.company.name}
                    </p>
                  </div>
                  <Badge 
                    variant="outline"
                    style={{ 
                      borderColor: app.status.color,
                      color: app.status.color 
                    }}
                  >
                    {app.status.name}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/applications">
                <Button variant="outline" className="w-full">
                  View All Applications
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Distribution</CardTitle>
          <CardDescription>
            Applications by priority level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-6">
            {mockStats.priorityBreakdown.map((item) => (
              <div key={item.priority} className="text-center">
                <div className="text-2xl font-bold">
                  {item.count}
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.priority === 1 ? "High" : item.priority === 2 ? "Medium" : "Low"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 