'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Target, Files, Calendar, Users, Edit3, Loader2 } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

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

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const [groupRes, membersRes] = await Promise.all([
          fetch(`/api/groups/${groupId}`),
          fetch(`/api/groups/${groupId}/members`)
        ]);

        if (!groupRes.ok) throw new Error('Failed to fetch group');
        if (!membersRes.ok) throw new Error('Failed to fetch members');

        const [groupData, membersData] = await Promise.all([
          groupRes.json(),
          membersRes.json()
        ]);

        setGroup(groupData);
        setMembers(membersData);
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

  const handleTabChange = (value: string) => {
    // Navigate to the appropriate page
    router.push(`/group/${groupId}/${value}`);
  };

  if (isLoading) {
    return (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading group...</span>
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
      <div className="flex-1 flex flex-col h-screen">
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto">
            {/* Group Overview */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Group Overview</CardTitle>
                <CardDescription>Quick overview of your study group</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{group._count.members}</div>
                    <div className="text-sm text-muted-foreground">Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{group._count.messages}</div>
                    <div className="text-sm text-muted-foreground">Messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{group.maxMembers}</div>
                    <div className="text-sm text-muted-foreground">Max Capacity</div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('chat')}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-medium">Start Chatting</h3>
                      <p className="text-sm text-muted-foreground">Join the conversation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('milestones')}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Target className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-medium">View Milestones</h3>
                      <p className="text-sm text-muted-foreground">Track your progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('members')}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-medium">Manage Members</h3>
                      <p className="text-sm text-muted-foreground">Invite and manage</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
  );
}
