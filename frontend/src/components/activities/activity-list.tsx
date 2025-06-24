"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { ActivityForm } from "./activity-form";
import { ApplicationActivity, activitiesApi } from "@/lib/api";
import { MoreHorizontal, Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityListProps {
  jobApplicationId: string;
}

export function ActivityList({ jobApplicationId }: ActivityListProps) {
  const [activities, setActivities] = useState<ApplicationActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ApplicationActivity | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; activity: ApplicationActivity | null }>({
    open: false,
    activity: null
  });
  const [deleting, setDeleting] = useState(false);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching activities for job application:', jobApplicationId);
      const response = await activitiesApi.getByJobApplication(jobApplicationId);
      console.log('Activities response:', response.data);
      setActivities(response.data.data?.activities || []);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      setError(error.response?.data?.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [jobApplicationId]);

  const handleCreateActivity = () => {
    setEditingActivity(null);
    setShowForm(true);
  };

  const handleEditActivity = (activity: ApplicationActivity) => {
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleDeleteActivity = async () => {
    if (!deleteDialog.activity) return;

    setDeleting(true);
    try {
      await activitiesApi.delete(deleteDialog.activity.id);
      setActivities(activities.filter(a => a.id !== deleteDialog.activity!.id));
      setDeleteDialog({ open: false, activity: null });
    } catch (error: any) {
      console.error('Error deleting activity:', error);
      setError(error.response?.data?.message || 'Failed to delete activity');
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingActivity(null);
    fetchActivities(); // Refresh the list
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingActivity(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Activities...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Activities</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchActivities} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>
                Track all activities and changes for this job application
              </CardDescription>
            </div>
            <Button onClick={handleCreateActivity}>
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No activities recorded yet</p>
              <Button onClick={handleCreateActivity} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add First Activity
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Timeline View */}
              <ActivityTimeline activities={activities} />
              
              {/* Detailed List View */}
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Detailed View</h4>
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{activity.activity}</p>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      )}
                      {}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditActivity(activity)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteDialog({ open: true, activity })}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? 'Edit Activity' : 'Add New Activity'}
            </DialogTitle>
          </DialogHeader>
          <ActivityForm
            activity={editingActivity || undefined}
            jobApplicationId={jobApplicationId}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            hideHeader={true}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => 
        setDeleteDialog({ open, activity: deleteDialog.activity })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this activity? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteDialog.activity && (
            <div className="py-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{deleteDialog.activity.activity}</p>
                {deleteDialog.activity.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {deleteDialog.activity.description}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, activity: null })}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteActivity}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Activity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 