'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Plus, Video, Clock, Users, Loader2, Edit, Trash2, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatSmartDate, formatDate, isOverdue } from "@/lib/date-utils";
import { useTranslation } from "@/hooks/useTranslation";
import { TranslationContent, TranslationToggle } from "@/components/TranslationToggle";
import { useInView } from "@/hooks/useInView";
import { toast } from "sonner";
import Link from "next/link";

interface VideoSession {
  id: string;
  title: string;
  titleTranslationMetadata: string;
  description?: string;
  descriptionTranslationMetadata: string;
  startTime: string;
  endTime?: string;
  status: string;
  meetingUrl?: string;
  createdAt: string;
  updatedAt: string;
  groupId: string;
  participants: VideoSessionParticipant[];
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface VideoSessionParticipant {
  id: string;
  joinedAt: string;
  leftAt?: string;
  userId: string;
  videoSessionId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export default function GroupVideoSessionsPage() {
  const params = useParams();
  const { data: session } = useSession();
  const groupId = params.id as string;
  const { userLanguage, isTranslationEnabled, getStoredTranslation, translateContent, storeTranslation } = useTranslation();
  
  const [videoSessions, setVideoSessions] = useState<VideoSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<VideoSession | null>(null);
  const [displayLanguage, setDisplayLanguage] = useState('en');
  const [translatingSessions, setTranslatingSessions] = useState<Set<string>>(new Set());
  const [translatedSessions, setTranslatedSessions] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    meetingUrl: ""
  });

  // Set initial display language based on user preference
  useEffect(() => {
    if (isTranslationEnabled && userLanguage.code !== 'en') {
      setDisplayLanguage(userLanguage.code);
    }
  }, [userLanguage.code, isTranslationEnabled]);

  // Reset translated sessions when language changes
  useEffect(() => {
    setTranslatedSessions(new Set());
  }, [displayLanguage]);

  const handleSessionInView = async (session: VideoSession, index: number) => {
    if (!isTranslationEnabled || displayLanguage === 'en' || translatedSessions.has(session.id)) {
      return;
    }

    setTranslatingSessions(prev => new Set(prev).add(session.id));

    try {
      // Translate title
      if (session.title) {
        const translatedTitle = await translateContent(session.title, displayLanguage);
        await storeTranslation(session.titleTranslationMetadata, displayLanguage, translatedTitle, 'title');
      }

      // Translate description
      if (session.description) {
        const translatedDescription = await translateContent(session.description, displayLanguage);
        await storeTranslation(session.descriptionTranslationMetadata, displayLanguage, translatedDescription, 'description');
      }

      setTranslatedSessions(prev => new Set(prev).add(session.id));
    } catch (error) {
      console.error('Error translating session:', error);
    } finally {
      setTranslatingSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(session.id);
        return newSet;
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'active':
        return <Badge variant="default">Live</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Fetch video sessions
  useEffect(() => {
    const fetchVideoSessions = async () => {
      try {
        const response = await fetch(`/api/groups/${groupId}/video-sessions`);
        if (!response.ok) throw new Error('Failed to fetch video sessions');
        
        const data = await response.json();
        setVideoSessions(data.videoSessions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video sessions');
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      fetchVideoSessions();
    }
  }, [groupId]);

  // Check if current user is a participant in a session
  const isUserInSession = (videoSession: VideoSession) => {
    if (!session?.user?.id) return false;
    return videoSession.participants.some(participant => participant.user.id === session.user.id);
  };

  const handleCreateSession = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/video-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create video session');
      }

      const result = await response.json();
      setVideoSessions(prev => [result.videoSession, ...prev]);
      setIsCreateDialogOpen(false);
      setFormData({ title: "", description: "", startTime: "", endTime: "", meetingUrl: "" });
    } catch (err) {
      console.error('Error creating video session:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create video session');
    }
  };

  const handleEditSession = async () => {
    if (!editingSession) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/video-sessions/${editingSession.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update video session');
      }

      const result = await response.json();
      setVideoSessions(prev => prev.map(session => 
        session.id === editingSession.id ? result.videoSession : session
      ));
      setIsEditDialogOpen(false);
      setEditingSession(null);
      setFormData({ title: "", description: "", startTime: "", endTime: "", meetingUrl: "" });
    } catch (err) {
      console.error('Error updating video session:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update video session');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this video session?')) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/video-sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete video session');
      }

      setVideoSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (err) {
      console.error('Error deleting video session:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete video session');
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/video-sessions/${sessionId}/join`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join session');
      }

      // Refresh the video sessions to show updated participant list
      const sessionsResponse = await fetch(`/api/groups/${groupId}/video-sessions`);
      if (sessionsResponse.ok) {
        const data = await sessionsResponse.json();
        setVideoSessions(data.videoSessions);
      }

      toast.success('Successfully joined the session!');
    } catch (err) {
      console.error('Error joining session:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to join session');
    }
  };

  const handleLeaveSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to leave this session?')) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/video-sessions/${sessionId}/leave`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to leave session');
      }

      // Refresh the video sessions to show updated participant list
      const sessionsResponse = await fetch(`/api/groups/${groupId}/video-sessions`);
      if (sessionsResponse.ok) {
        const data = await sessionsResponse.json();
        setVideoSessions(data.videoSessions);
      }

      toast.success('Successfully left the session!');
    } catch (err) {
      console.error('Error leaving session:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to leave session');
    }
  };

  const openEditDialog = (session: VideoSession) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      description: session.description || "",
      startTime: session.startTime.split('T')[0] + 'T' + session.startTime.split('T')[1].substring(0, 5),
      endTime: session.endTime ? session.endTime.split('T')[0] + 'T' + session.endTime.split('T')[1].substring(0, 5) : "",
      meetingUrl: session.meetingUrl || ""
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading video sessions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error loading video sessions</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Video Sessions</h2>
            <p className="text-muted-foreground">Schedule and join study sessions</p>
          </div>
          {isTranslationEnabled && (
            <TranslationToggle
              currentLanguage={displayLanguage}
              onLanguageChange={setDisplayLanguage}
            />
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Video Session</DialogTitle>
                <DialogDescription>
                  Create a new video session for your study group.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Session Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Calculus Review Session"
                  />
                  {isTranslationEnabled && displayLanguage !== 'en' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Title will be automatically translated for group members
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what will be covered in this session..."
                    rows={3}
                  />
                  {isTranslationEnabled && displayLanguage !== 'en' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Description will be automatically translated for group members
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time (Optional)</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="meetingUrl">Meeting URL (Optional)</Label>
                  <Input
                    id="meetingUrl"
                    value={formData.meetingUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, meetingUrl: e.target.value }))}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSession} disabled={!formData.title.trim() || !formData.startTime}>
                  Schedule Session
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Video Sessions List */}
        <div className="space-y-4">
          {videoSessions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No video sessions yet</h3>
                <p className="text-muted-foreground mb-6">
                  Schedule your first video session to study together.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule First Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            videoSessions.map((session) => {
              // Create individual useInView hook for each session
              const SessionInViewComponent = () => {
                const [ref, inView] = useInView({ threshold: 0.1 });
                
                useEffect(() => {
                  if (inView) {
                    handleSessionInView(session, videoSessions.indexOf(session));
                  }
                }, [inView, session]);
                
                return (
                  <Card ref={ref as React.RefObject<HTMLDivElement>} key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {displayLanguage === 'en' ? (
                            session.title
                          ) : (
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs text-muted-foreground">
                                  Translated from English
                                </span>
                                {translatingSessions.has(session.id) && (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                )}
                              </div>
                              <div>{getStoredTranslation(session.titleTranslationMetadata, displayLanguage) || session.title}</div>
                            </div>
                          )}
                        </h3>
                        {getStatusBadge(session.status)}
                      </div>
                      
                      {session.description && (
                        <div className="text-muted-foreground mb-3">
                          <TranslationContent
                            originalContent={session.description}
                            translatedContent={getStoredTranslation(session.descriptionTranslationMetadata, displayLanguage) || session.description}
                            currentLanguage={displayLanguage}
                            sourceLanguage="en"
                          />
                          {translatingSessions.has(session.id) && displayLanguage !== 'en' && (
                            <div className="flex items-center space-x-2 mt-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span className="text-xs text-muted-foreground">Translating...</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDateTime(session.startTime)}</span>
                        </div>
                        
                        {session.endTime && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Ends: {formatDateTime(session.endTime)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{session.participants.length} participants</span>
                        </div>
                      </div>
                      
                      {/* Participants */}
                      {session.participants.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Participants:</h4>
                          <div className="flex items-center space-x-2">
                            {session.participants.slice(0, 5).map((participant) => (
                              <Avatar key={participant.id} className="h-6 w-6">
                                <AvatarImage src={participant.user.avatar} />
                                <AvatarFallback className="text-xs">{participant.user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            ))}
                            {session.participants.length > 5 && (
                              <span className="text-xs text-muted-foreground">
                                +{session.participants.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {session.status === 'scheduled' && (
                        isUserInSession(session) ? (
                          <Button variant="destructive" size="sm" onClick={() => handleLeaveSession(session.id)}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Leave
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleJoinSession(session.id)}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Join
                          </Button>
                        )
                      )}
                      {session.status === 'active' && (
                        <Button size="sm">
                          <Video className="h-4 w-4 mr-2" />
                          Join Live
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(session)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteSession(session.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
                );
              };
              
              return <SessionInViewComponent key={session.id} />;
            })
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Video Session</DialogTitle>
            <DialogDescription>
              Update the video session details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Session Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Calculus Review Session"
              />
              {isTranslationEnabled && displayLanguage !== 'en' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Title will be automatically translated for group members
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what will be covered in this session..."
                rows={3}
              />
              {isTranslationEnabled && displayLanguage !== 'en' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Description will be automatically translated for group members
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-startTime">Start Time</Label>
              <Input
                id="edit-startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-endTime">End Time (Optional)</Label>
              <Input
                id="edit-endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-meetingUrl">Meeting URL (Optional)</Label>
              <Input
                id="edit-meetingUrl"
                value={formData.meetingUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, meetingUrl: e.target.value }))}
                placeholder="https://meet.google.com/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSession} disabled={!formData.title.trim() || !formData.startTime}>
              Update Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
