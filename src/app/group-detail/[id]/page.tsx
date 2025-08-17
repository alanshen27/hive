'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, MessageSquare, Video, Target, Clock, Brain, 
  ArrowLeft, Calendar, BookOpen, Send, Star
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { formatDate } from "@/lib/date-utils";
import { MilestoneSubmission } from "@prisma/client";
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

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  submissions: MilestoneSubmission[];
}

interface PageParams {
  params: Promise<{
    id: string;
  }>;
}

export default function GroupDetailPage({ params }: PageParams) {
  const { data: session } = useSession();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [showApplication, setShowApplication] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const groupId = await params.then(p => p.id);
        const [groupRes, membersRes, milestonesRes] = await Promise.all([
          fetch(`/api/groups/${groupId}`),
          fetch(`/api/groups/${groupId}/members`),
          fetch(`/api/groups/${groupId}/milestones`)
        ]);

        if (!groupRes.ok) throw new Error('Failed to fetch group');
        if (!membersRes.ok) throw new Error('Failed to fetch members');
        if (!milestonesRes.ok) throw new Error('Failed to fetch milestones');

        const [groupData, membersData, milestonesData] = await Promise.all([
          groupRes.json(),
          membersRes.json(),
          milestonesRes.json()
        ]);

        setGroup(groupData);
        setMembers(membersData);
        setMilestones(milestonesData.milestones);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load group data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [params]);

  const handleApply = async () => {
    if (!group || !applicationMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/groups/${group.id}/join-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: applicationMessage
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit join request');
      }

      setShowApplication(false);
      setApplicationMessage("");
      toast.success('Join request submitted successfully! The group leader will review your application.');
    } catch (err) {
      console.error('Error submitting join request:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to submit join request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading group details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{error || 'Group not found'}</p>
            <Button variant="outline" asChild>
              <Link href="/explore">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Explore
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/explore">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Explore
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Group Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{group.name}</CardTitle>
                    <div className="flex items-center space-x-3 mb-3">
                      <Badge>{group.subject}</Badge>
                      <Badge variant="outline">{group.level}</Badge>
                      {group.isPrivate && (
                        <Badge variant="secondary">Private</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-4">{group.description}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-muted-foreground mb-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{group._count.members}/{group.maxMembers} members</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Created {formatDate(group.createdAt)}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50 h-12">
                <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <BookOpen className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="members" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Users className="h-4 w-4" />
                  Members
                </TabsTrigger>
                <TabsTrigger value="milestones" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Target className="h-4 w-4" />
                  Milestones
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Group</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{group.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Group Leader</h4>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {group.owner.name}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Created</h4>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(group.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Group Type</h4>
                      <p className="text-sm text-muted-foreground">
                        This is a {group.isPrivate ? 'private' : 'public'} group with a maximum of {group.maxMembers} members.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="members" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Members</CardTitle>
                    <CardDescription>{group._count.members} of {group.maxMembers} members</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{member.user.avatar || member.user.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.user.name}</p>
                            <div className="flex items-center space-x-2">
                              <Badge variant={member.role === 'leader' ? 'default' : 'outline'} className="text-xs">
                                {member.role === 'leader' ? 'Group Leader' : 'Member'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Joined {formatDate(member.joinedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="milestones" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Milestones</CardTitle>
                    <CardDescription>Group goals and progress tracking</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {milestones.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No milestones yet</p>
                    ) : (
                      milestones.map((milestone) => (
                        <div key={milestone.id} className="space-y-2 p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{milestone.title}</h4>
                            <Badge variant={milestone.completed ? "default" : "outline"}>
                              {milestone.completed ? "Completed" : formatDate(milestone.dueDate)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                          <div className="flex items-center space-x-2">
                            <Progress value={milestone.completed ? 100 : 0} className="flex-1" />
                            <span className="text-sm font-medium">{milestone.completed ? "100" : "0"}%</span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join Group Card */}
            <Card>
              <CardHeader>
                <CardTitle>Join This Group</CardTitle>
                <CardDescription>
                  {group.maxMembers - group._count.members} spots available
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!session ? (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">Please sign in to join this group</p>
                    <Button variant="outline" asChild>
                      <Link href="/auth/signin">Sign In</Link>
                    </Button>
                  </div>
                ) : !showApplication ? (
                  <>
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={() => setShowApplication(true)}
                      disabled={group._count.members >= group.maxMembers}
                    >
                      Apply to Join
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Applications are reviewed by the group leader
                    </p>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Tell us why you want to join this group..."
                      value={applicationMessage}
                      onChange={(e) => setApplicationMessage(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex space-x-2">
                      <Button 
                        variant="default" 
                        className="flex-1"
                        onClick={handleApply}
                        disabled={!applicationMessage.trim() || isSubmitting}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setShowApplication(false);
                          setApplicationMessage("");
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Group Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Group Progress</CardTitle>
                <CardDescription>Overall milestone completion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {milestones.length > 0 ? (
                    <>
                      <Progress 
                        value={(milestones.filter(m => m.completed).length / milestones.length) * 100} 
                        className="h-3" 
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Overall Progress</span>
                        <span className="font-medium">
                          {Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100)}%
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No milestones to track</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Target className="h-4 w-4 text-primary" />
                  <span>AI-generated milestones</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span>Smart study assistant</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Video className="h-4 w-4 text-primary" />
                  <span>Video session summaries</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
}


