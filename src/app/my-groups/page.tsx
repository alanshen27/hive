'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { formatDate, formatShortDate } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Users, MessageSquare, Video, Target, Clock, Search, Plus, Filter, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { Session } from "next-auth";

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
    milestones: number;
  };
  role?: string;
  milestones?: {
    id: string;
    title: string;
    completed: boolean;
    submissions: {
      id: string;
      aiVerified: boolean;
    }[];
  }[];
}

export default function MyGroupsPage() {
  const { data: session, status } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.id) {
      setError('Please log in to view your groups');
      setIsLoading(false);
      return;
    }

    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups?myGroups=true');
        if (!response.ok) throw new Error('Failed to fetch groups');
        
        const data = await response.json();
        setGroups(data.groups);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load groups');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [session, status]);

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === "all" || group.subject.toLowerCase() === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const sortedGroups = [...filteredGroups].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "members":
        return b._count.members - a._count.members;
      default: // recent
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const leaderGroups = sortedGroups.filter(group => group.owner.id === session?.user?.id);
  const memberGroups = sortedGroups.filter(group => group.owner.id !== session?.user?.id);
  const favoriteGroups = leaderGroups; // Show leader groups as favorites for now

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your groups...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Error loading groups</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Study Groups</h1>
            <p className="text-muted-foreground mt-2">
              Manage your active study groups and track your progress
            </p>
          </div>
          <Button asChild>
            <Link href="/create-group">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups by name or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="mathematics">Mathematics</SelectItem>
                <SelectItem value="chemistry">Chemistry</SelectItem>
                <SelectItem value="computer science">Computer Science</SelectItem>
                <SelectItem value="physics">Physics</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="members">Members</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">All Groups ({sortedGroups.length})</TabsTrigger>
            <TabsTrigger value="favorites">Favorites ({favoriteGroups.length})</TabsTrigger>
            <TabsTrigger value="leading">Leading ({leaderGroups.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <GroupsList groups={sortedGroups} totalGroups={groups.length} session={session} />
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <GroupsList groups={favoriteGroups} totalGroups={groups.length} session={session} />
          </TabsContent>

          <TabsContent value="leading" className="mt-6">
            <GroupsList groups={leaderGroups} totalGroups={groups.length} session={session} />
          </TabsContent>
        </Tabs>
      </div>
  );
}

function GroupsList({ groups, totalGroups, session }: { groups: Group[]; totalGroups: number; session: Session | null }) {
  if (groups.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No groups found</h3>
          <p className="text-muted-foreground mb-6">
            {groups.length === 0 && totalGroups === 0 
              ? "You haven't joined any study groups yet. Start by exploring available groups or create your own!"
              : "Try adjusting your search or filters"
            }
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="default" asChild>
              <Link href="/explore">Browse Groups</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/create-group">Create Group</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (

    <div className="grid gap-4">
      {groups.map((group) => (
        <Card key={group.id} className="border-border/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-xl">{group.name}</CardTitle>
                  {group.owner.id === session?.user?.id && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                </div>
                
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="outline">{group.subject}</Badge>
                  <Badge variant={group.owner.id === session?.user?.id ? 'default' : 'outline'}>
                    {group.owner.id === session?.user?.id ? 'Leader' : 'Member'}
                  </Badge>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{group._count.members}/{group.maxMembers}</span>
                  </div>
                </div>
                
                <CardDescription className="mb-4">
                  {group.description}
                </CardDescription>
                <p className="text-sm text-muted-foreground mb-4">
                  Created {formatDate(group.createdAt)} • {group._count.messages} messages
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button size="sm" asChild>
                  <Link href={`/group/${group.id}/chat`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Open Chat
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/group/${group.id}/video-sessions`}>
                    <Video className="h-4 w-4 mr-2" />
                    Sessions
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/group/${group.id}/milestones`}>
                    <Target className="h-4 w-4 mr-2" />
                    Milestones
                  </Link>
                </Button>
              </div>
              
              <div className="text-right">
                <p className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatShortDate(group.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}



