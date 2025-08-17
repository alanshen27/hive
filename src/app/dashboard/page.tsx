'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  MessageSquare, 
  Target, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Activity,
  Star
} from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/date-utils";
import Link from "next/link";

interface DashboardStats {
  totalGroups: number;
  totalMembers: number;
  totalMessages: number;
  totalMilestones: number;
  completedMilestones: number;
  upcomingSessions: number;
  pendingJoinRequests: number;
}

interface RecentActivity {
  id: string;
  type: 'message' | 'milestone' | 'join_request' | 'video_session';
  title: string;
  description: string;
  timestamp: string;
  groupName: string;
  groupId: string;
}

interface UpcomingSession {
  id: string;
  title: string;
  startTime: string;
  groupName: string;
  groupId: string;
  participants: number;
}

interface GroupProgress {
  id: string;
  name: string;
  progress: number;
  totalMilestones: number;
  completedMilestones: number;
  nextMilestone?: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [groupProgress, setGroupProgress] = useState<GroupProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.user?.id) return;

      try {
        const [statsRes, activityRes, sessionsRes, progressRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/activity'),
          fetch('/api/dashboard/upcoming-sessions'),
          fetch('/api/dashboard/group-progress')
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setRecentActivity(activityData.activities);
        }

        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          setUpcomingSessions(sessionsData.sessions);
        }

        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setGroupProgress(progressData.groups);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name || 'User'}! Here's what's happening with your study groups.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href="/create-group">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/explore">
              <BookOpen className="h-4 w-4 mr-2" />
              Explore Groups
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalGroups || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalGroups === 1 ? 'Active group' : 'Active groups'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all groups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedMilestones || 0}/{stats?.totalMilestones || 0}</div>
            <p className="text-xs text-muted-foreground">
              Completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates from your study groups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent activity</p>
                  <p className="text-sm text-muted-foreground">Start participating in your groups to see activity here</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0">
                      {activity.type === 'message' && <MessageSquare className="h-5 w-5 text-blue-500" />}
                      {activity.type === 'milestone' && <Target className="h-5 w-5 text-green-500" />}
                      {activity.type === 'join_request' && <Users className="h-5 w-5 text-orange-500" />}
                      {activity.type === 'video_session' && <Calendar className="h-5 w-5 text-purple-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {activity.groupName}
                        </Badge>
                                                 <span className="text-xs text-muted-foreground">
                           {formatRelativeTime(activity.timestamp)}
                         </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/group/${activity.groupId}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Group Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Group Progress
              </CardTitle>
              <CardDescription>Track your progress across all groups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupProgress.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No groups with milestones</p>
                  <p className="text-sm text-muted-foreground">Create milestones in your groups to track progress</p>
                </div>
              ) : (
                groupProgress.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{group.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {group.completedMilestones}/{group.totalMilestones}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">{group.progress}%</span>
                    </div>
                    <Progress value={group.progress} className="h-2" />
                    {group.nextMilestone && (
                      <p className="text-xs text-muted-foreground">
                        Next: {group.nextMilestone}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/create-group">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Group
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/explore">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Explore Groups
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/my-groups">
                  <Users className="h-4 w-4 mr-2" />
                  My Groups
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Sessions
              </CardTitle>
              <CardDescription>Next video sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-4">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming sessions</p>
                </div>
              ) : (
                upcomingSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{session.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {session.participants} joined
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{session.groupName}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                 <span className="text-xs text-muted-foreground">
                           {formatDate(session.startTime)}
                         </span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/group/${session.groupId}/video-sessions`}>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Pending Join Requests */}
          {stats?.pendingJoinRequests && stats.pendingJoinRequests > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <AlertCircle className="h-5 w-5" />
                  Pending Requests
                </CardTitle>
                <CardDescription className="text-orange-600">
                  You have {stats.pendingJoinRequests} join request{stats.pendingJoinRequests === 1 ? '' : 's'} to review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link href="/my-groups">
                    Review Requests
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

