'use client';

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Target, Calendar, Users, Edit3, Loader2 } from "lucide-react";
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

export default function GroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [joinRequestsCount, setJoinRequestsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Get current tab from pathname
  const getCurrentTab = () => {
    if (pathname.includes('/chat')) return 'chat';
    if (pathname.includes('/milestones')) return 'milestones';
    if (pathname.includes('/video-sessions')) return 'video-sessions';
    if (pathname.includes('/members')) return 'members';
    if (pathname.includes('/edit')) return 'edit';
    return 'chat';
  };

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const [groupResponse, joinRequestsResponse] = await Promise.all([
          fetch(`/api/groups/${groupId}`),
          fetch(`/api/groups/${groupId}/join-requests`)
        ]);
        
        if (!groupResponse.ok) throw new Error('Failed to fetch group');
        
        const groupData = await groupResponse.json();
        setGroup(groupData);
        
        // Fetch join requests count if user is group leader
        if (joinRequestsResponse.ok) {
          const joinRequestsData = await joinRequestsResponse.json();
          setJoinRequestsCount(joinRequestsData.length);
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

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full min-h-[40rem] items-center justify-center">
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
    <div className="h-screen flex flex-col max-w-full">
      {/* Sticky Header Section */}
      <div className="flex-shrink-0">
        {/* Breadcrumb */}
        <div className="p-4 bg-sidebar border-b">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/my-groups">My Groups</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{group.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b bg-sidebar">
          <div className="flex items-center justify-between max-w-full">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold truncate">{group.name}</h1>
              <p className="text-muted-foreground truncate">{group._count.members} members • {group.subject} • {group.level}</p>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Badge>{group.subject}</Badge>
              <Badge variant="outline">{group.level}</Badge>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-background border-b">
          <Tabs value={getCurrentTab()} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="chat" asChild>
                <Link href={`/group/${groupId}/chat`} className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </Link>
              </TabsTrigger>
              <TabsTrigger value="milestones" asChild>
                <Link href={`/group/${groupId}/milestones`} className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Milestones
                </Link>
              </TabsTrigger>
              <TabsTrigger value="video-sessions" asChild>
                <Link href={`/group/${groupId}/video-sessions`} className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Video Sessions
                </Link>
              </TabsTrigger>
              <TabsTrigger value="members" asChild>
                <Link href={`/group/${groupId}/members`} className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Members
                </Link>
              </TabsTrigger>
              <TabsTrigger value="edit" asChild>
                <Link href={`/group/${groupId}/edit`} className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Settings
                  {joinRequestsCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                      {joinRequestsCount}
                    </Badge>
                  )}
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto max-w-full">
        <div className="max-w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
