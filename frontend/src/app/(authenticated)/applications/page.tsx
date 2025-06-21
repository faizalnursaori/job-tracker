import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

// Mock data - would typically come from API
const mockApplications = [
  {
    id: "1",
    jobTitle: "Senior Frontend Developer",
    company: { 
      name: "TechCorp", 
      industry: "Technology",
      logoUrl: null 
    },
    status: { 
      name: "Interview", 
      color: "#10b981" 
    },
    priority: 1,
    appliedDate: "2024-01-15",
    salaryMin: 120000,
    salaryMax: 150000,
    currency: "USD",
    location: "San Francisco, CA",
    isRemote: false,
    jobUrl: "https://techcorp.com/jobs/123"
  },
  {
    id: "2",
    jobTitle: "Full Stack Engineer",
    company: { 
      name: "StartupXYZ", 
      industry: "Fintech",
      logoUrl: null 
    },
    status: { 
      name: "Applied", 
      color: "#3b82f6" 
    },
    priority: 2,
    appliedDate: "2024-01-14",
    salaryMin: 100000,
    salaryMax: 130000,
    currency: "USD",
    location: "Remote",
    isRemote: true,
    jobUrl: "https://startupxyz.com/careers/456"
  },
  {
    id: "3",
    jobTitle: "React Developer",
    company: { 
      name: "BigCorp", 
      industry: "E-commerce",
      logoUrl: null 
    },
    status: { 
      name: "Rejected", 
      color: "#ef4444" 
    },
    priority: 3,
    appliedDate: "2024-01-10",
    salaryMin: 90000,
    salaryMax: 110000,
    currency: "USD",
    location: "New York, NY",
    isRemote: false,
    jobUrl: "https://bigcorp.com/jobs/789"
  }
];

const formatSalary = (min: number, max: number, currency: string) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  } else if (min) {
    return `${formatter.format(min)}+`;
  }
  return 'Not specified';
};

const getPriorityLabel = (priority: number) => {
  switch (priority) {
    case 1: return { label: "High", color: "destructive" };
    case 2: return { label: "Medium", color: "default" };
    case 3: return { label: "Low", color: "secondary" };
    default: return { label: "Medium", color: "default" };
  }
};

export default function ApplicationsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Job Applications</h2>
        <div className="flex items-center space-x-2">
          <Link href="/applications/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Application
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Applications</CardTitle>
          <CardDescription>
            Search and filter your job applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by job title, company, or notes..." 
                  className="pl-8"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({mockApplications.length})</CardTitle>
          <CardDescription>
            Manage your job applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockApplications.map((app) => {
                const priority = getPriorityLabel(app.priority);
                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div>{app.jobTitle}</div>
                        {app.jobUrl && (
                          <a 
                            href={app.jobUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center"
                          >
                            View Job Posting
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{app.company.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {app.company.industry}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        style={{ 
                          borderColor: app.status.color,
                          color: app.status.color 
                        }}
                      >
                        {app.status.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priority.color as any}>
                        {priority.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(app.appliedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {formatSalary(app.salaryMin, app.salaryMax, app.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{app.isRemote ? "Remote" : app.location}</div>
                        {app.isRemote && app.location && (
                          <div className="text-xs text-muted-foreground">
                            {app.location}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Link href={`/applications/${app.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/applications/${app.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 