'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Check, X, Users } from "lucide-react";
import { toast } from "sonner";

interface Group {
  id: string;
  name: string;
  description: string;
  subject: string;
  level: string;
  isPrivate: boolean;
  maxMembers: number;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  _count: {
    members: number;
    messages: number;
  };
}

interface JoinRequest {
  id: string;
  message?: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    email: string;
  };
}

export default function GroupEditPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    subject: "",
    level: "",
    isPrivate: false,
    maxMembers: 10
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isProcessingRequest, setIsProcessingRequest] = useState<string | null>(null);

  // Subjects and levels for dropdowns
  const subjects = [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "Engineering", "Literature", "History", "Psychology", "Economics",
    "Art", "Music", "Philosophy", "Language Learning", "Medicine"
  ];

  const levels = [
    { value: "high-school", label: "High School" },
    { value: "undergraduate", label: "Undergraduate" },
    { value: "graduate", label: "Graduate" },
    { value: "professional", label: "Professional" }
  ];

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const [groupResponse, joinRequestsResponse] = await Promise.all([
          fetch(`/api/groups/${groupId}`),
          fetch(`/api/groups/${groupId}/join-requests`)
        ]);
        
        if (!groupResponse.ok) throw new Error('Failed to fetch group');
        if (!joinRequestsResponse.ok && joinRequestsResponse.status !== 403) {
          throw new Error('Failed to fetch join requests');
        }
        
        const groupData = await groupResponse.json();
        setGroup(groupData);
        
        // Initialize edit form with current group data
        setEditForm({
          name: groupData.name,
          description: groupData.description,
          subject: groupData.subject,
          level: groupData.level,
          isPrivate: groupData.isPrivate,
          maxMembers: groupData.maxMembers
        });

        // Fetch join requests if user is group leader
        if (joinRequestsResponse.ok) {
          const joinRequestsData = await joinRequestsResponse.json();
          setJoinRequests(joinRequestsData.joinRequests);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load group data');
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      fetchGroupData();
    }
  }, [groupId]);

  const handleEditFormChange = (field: string, value: string | boolean | number) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async () => {
    if (!group) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update group');
      }

      const result = await response.json();
      setGroup(result);
      toast.success('Group settings updated successfully!');
    } catch (err) {
      console.error('Error updating group:', err);
      toast.error('Failed to update group settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (group) {
      setEditForm({
        name: group.name,
        description: group.description,
        subject: group.subject,
        level: group.level,
        isPrivate: group.isPrivate,
        maxMembers: group.maxMembers
      });
    }
  };

  const handleArchiveGroup = async () => {
    if (!confirm('Are you sure you want to archive this group? This will stop all activity.')) {
      return;
    }
    // TODO: Implement archive functionality
    console.log('Archive group');
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to permanently delete this group? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete group');
      }

      toast.success('Group deleted successfully');
      // Redirect to my-groups page
      router.push('/my-groups');
    } catch (err) {
      console.error('Error deleting group:', err);
      toast.error('Failed to delete group');
    }
  };

  const handleJoinRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setIsProcessingRequest(requestId);
    try {
      const response = await fetch(`/api/groups/${groupId}/join-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process join request');
      }

      // Remove the processed request from the list
      setJoinRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Show success toast notification
      toast.success(`Join request ${action}ed successfully!`);
    } catch (err) {
      console.error('Error processing join request:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to process join request');
    } finally {
      setIsProcessingRequest(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading group settings...</span>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error loading group</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-6">Group Settings</h2>
        </div>
        
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update your group&apos;s basic details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Group Name</Label>
              <Input 
                id="edit-name" 
                value={editForm.name}
                onChange={(e) => handleEditFormChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description"
                value={editForm.description}
                onChange={(e) => handleEditFormChange('description', e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-subject">Subject</Label>
              <Select value={editForm.subject} onValueChange={(value) => handleEditFormChange('subject', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-level">Academic Level</Label>
              <Select value={editForm.level} onValueChange={(value) => handleEditFormChange('level', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy & Access</CardTitle>
            <CardDescription>Control who can join and view your group</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Private Group</p>
                <p className="text-sm text-muted-foreground">Only invited members can join</p>
              </div>
              <Checkbox
                checked={editForm.isPrivate}
                onCheckedChange={(checked) => handleEditFormChange('isPrivate', checked as boolean)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Max Members</p>
                <p className="text-sm text-muted-foreground">Maximum number of group members</p>
              </div>
              <Select 
                value={editForm.maxMembers.toString()} 
                onValueChange={(value) => handleEditFormChange('maxMembers', parseInt(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 25, 30, 50].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Join Requests */}
        {joinRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pending Join Requests ({joinRequests.length})
              </CardTitle>
              <CardDescription>Review and approve or reject requests to join your group</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {joinRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{request.user.avatar || request.user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.user.name}</p>
                      <p className="text-sm text-muted-foreground">{request.user.email}</p>
                      {request.message && (
                        <p className="text-sm text-muted-foreground mt-1">"{request.message}"</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Requested {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJoinRequest(request.id, 'reject')}
                      disabled={isProcessingRequest === request.id}
                    >
                      {isProcessingRequest === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleJoinRequest(request.id, 'approve')}
                      disabled={isProcessingRequest === request.id}
                    >
                      {isProcessingRequest === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for this group</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Archive Group</p>
                <p className="text-sm text-muted-foreground">Archive this group and stop all activity</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleArchiveGroup}>
                Archive
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Group</p>
                <p className="text-sm text-muted-foreground">Permanently delete this group and all data</p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleDeleteGroup}>
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCancelEdit}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
