'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Target, Plus, Calendar, CheckCircle, Clock, Loader2, Edit, Trash2, X, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MilestoneCard } from "@/components/MilestoneCard";
import { formatDate, formatRelativeTime, isOverdue } from "@/lib/date-utils";
import Link from "next/link";
import { Milestone, MilestoneSubmission } from "@prisma/client";

// Define the type that matches what MilestoneCard expects
type MilestoneWithSubmissions = (Milestone & { userVerified: boolean }) & { 
  submissions: (MilestoneSubmission & { user: string })[] 
};

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

export default function GroupMilestonesPage() {
  const params = useParams();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [milestones, setMilestones] = useState<(Milestone & { userVerified: boolean })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    completed: false
  });

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const [groupRes, milestonesRes] = await Promise.all([
          fetch(`/api/groups/${groupId}`),
          fetch(`/api/groups/${groupId}/milestones`)
        ]);

        if (!groupRes.ok) throw new Error('Failed to fetch group');
        if (!milestonesRes.ok) throw new Error('Failed to fetch milestones');

        const [groupData, milestonesData] = await Promise.all([
          groupRes.json(),
          milestonesRes.json()
        ]);

        setGroup(groupData);
        setMilestones(milestonesData.milestones);
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

  const handleCreateMilestone = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create milestone');
      }

      const result = await response.json();
      setMilestones(prev => [result.milestone, ...prev]);
      setIsCreateDialogOpen(false);
      setFormData({ title: "", description: "", dueDate: "", completed: false });
    } catch (err) {
      console.error('Error creating milestone:', err);
    }
  };

  const handleEditMilestone = async () => {
    if (!editingMilestone || !editingMilestone.id) {
      alert("Milestone not found");
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/milestones/${editingMilestone.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update milestone');
      }

      const result = await response.json();
      setMilestones(prev => prev.map(m => m.id === editingMilestone.id ? result.milestone : m));
      setIsEditDialogOpen(false);
      setEditingMilestone(null);
      setFormData({ title: "", description: "", dueDate: "", completed: false });
    } catch (err) {
      console.error('Error updating milestone:', err);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) {
      return;
    }

    // optimistically remove it
    setMilestones(prev => prev.filter(m => m.id !== milestoneId));


    try {
      const response = await fetch(`/api/groups/${groupId}/milestones/${milestoneId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete milestone');
      }

    } catch (err) {
      console.error('Error deleting milestone:', err);
    }
  };

  const openEditDialog = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      title: milestone.title,
      description: milestone.description,
      dueDate: milestone.dueDate as unknown as string,
      completed: milestone.completed
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading milestones...</span>
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
          <Button className="mt-4" asChild>
            <Link href="/my-groups">Back to My Groups</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-full">
      <div className="mx-auto max-w-full w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Milestones</h2>
            <p className="text-muted-foreground">Track progress and keep everyone on schedule</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Milestone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Milestone</DialogTitle>
                <DialogDescription>
                  Add a new milestone to track progress in your study group.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Complete Chapter 5"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what needs to be accomplished..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="completed">Status</Label>
                  <Select value={formData.completed ? "completed" : "pending"} onValueChange={(value) => setFormData(prev => ({ ...prev, completed: value === "completed" }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateMilestone} disabled={!formData.title.trim()}>
                  Create Milestone
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total Milestones</p>
                  <p className="text-2xl font-bold">{milestones.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold">
                    {milestones.filter(m => m.completed).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold">
                    {milestones.filter(m => !m.completed).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Milestones List */}
        <div className="space-y-4">
          {milestones.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No milestones yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first milestone to track progress and keep everyone on schedule.
                </p>
              </CardContent>
            </Card>
          ) : (
            milestones.map((milestone) => (
              <MilestoneCard 
                key={milestone.id} 
                milestone={milestone as MilestoneWithSubmissions}
                onEdit={openEditDialog}
                onDelete={handleDeleteMilestone}
                groupId={groupId}
              />
            ))
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
            <DialogDescription>
              Update the milestone details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Complete Chapter 5"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what needs to be accomplished..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-dueDate">Due Date</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
                            <div>
                  <Label htmlFor="edit-completed">Status</Label>
                  <Select value={formData.completed ? "completed" : "pending"} onValueChange={(value) => setFormData(prev => ({ ...prev, completed: value === "completed" }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditMilestone} disabled={!formData.title.trim()}>
              Update Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

  );
}
