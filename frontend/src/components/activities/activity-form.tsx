"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { activitiesApi } from "@/lib/api";
import { type ActivityFormProps, type MetadataItem } from "@/types";

export function ActivityForm({ activity, jobApplicationId, onSuccess, onCancel, hideHeader = false }: ActivityFormProps) {
  const [formData, setFormData] = useState({
    activity: activity?.activity || '',
    description: activity?.description || '',
  });
  
  const [metadata, setMetadata] = useState<MetadataItem[]>(() => {
    if (activity?.metadata) {
      return Object.entries(activity.metadata).map(([key, value]) => ({
        key,
        value: String(value)
      }));
    }
    return [];
  });
  
  const [newMetadataKey, setNewMetadataKey] = useState('');
  const [newMetadataValue, setNewMetadataValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isEditing = !!activity;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.activity.trim()) {
      newErrors.activity = 'Activity description is required';
    } else if (formData.activity.length > 500) {
      newErrors.activity = 'Activity description must be less than 500 characters';
    }
    
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        jobApplicationId,
        metadata: metadata.length > 0 
          ? metadata.reduce((acc, item) => {
              if (item.key.trim() && item.value.trim()) {
                acc[item.key] = item.value;
              }
              return acc;
            }, {} as Record<string, unknown>)
          : undefined
      };

      if (isEditing) {
        await activitiesApi.update(activity.id, submitData);
      } else {
        await activitiesApi.create(submitData);
      }

      onSuccess();
    } catch (error: unknown) {
      console.error('Error saving activity:', error);
      const errorObj = error as { response?: { data?: { error?: { message?: string } } } };
      setErrors({
        submit: errorObj.response?.data?.error?.message || 'Failed to save activity'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMetadata = () => {
    if (newMetadataKey.trim() && newMetadataValue.trim()) {
      setMetadata([...metadata, { key: newMetadataKey.trim(), value: newMetadataValue.trim() }]);
      setNewMetadataKey('');
      setNewMetadataValue('');
    }
  };

  const removeMetadata = (index: number) => {
    setMetadata(metadata.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  return (
    <Card className="w-full">
      {!hideHeader && (
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Edit Activity' : 'Add New Activity'}
          </CardTitle>
          <CardDescription>
            {isEditing 
              ? 'Update the activity details below' 
              : 'Record a new activity for this job application'
            }
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Description */}
          <div className="space-y-2">
            <Label htmlFor="activity">Activity Description *</Label>
            <Input
              id="activity"
              value={formData.activity}
              onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
              placeholder="e.g., Status changed from Applied to Phone Screen"
              className={errors.activity ? 'border-red-500' : ''}
            />
            {errors.activity && (
              <p className="text-sm text-red-500">{errors.activity}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.activity.length}/500 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Additional Details</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add any additional context or details..."
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/2000 characters
            </p>
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <Label>Metadata (Optional)</Label>
            <p className="text-sm text-muted-foreground">
              Add key-value pairs for additional context
            </p>
            
            {/* Existing metadata */}
            {metadata.length > 0 && (
              <div className="space-y-2">
                {metadata.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <span className="font-medium">{item.key}:</span>
                      <span>{item.value}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeMetadata(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Add new metadata */}
            <div className="flex gap-2">
              <Input
                placeholder="Key"
                value={newMetadataKey}
                onChange={(e) => setNewMetadataKey(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addMetadata)}
                className="flex-1"
              />
              <Input
                placeholder="Value"
                value={newMetadataValue}
                onChange={(e) => setNewMetadataValue(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addMetadata)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMetadata}
                disabled={!newMetadataKey.trim() || !newMetadataValue.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Activity' : 'Add Activity')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 