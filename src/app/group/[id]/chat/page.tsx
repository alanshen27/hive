'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Brain, AtSign, Bell, Loader2, Calendar, Video, Target, Check } from "lucide-react";
import { usePusher } from "@/hooks/usePusher";
import { formatTime, formatDate, formatRelativeTime } from "@/lib/date-utils";
import { useTranslation } from "@/hooks/useTranslation";
import { TranslationContent, TranslationToggle } from "@/components/TranslationToggle";
import Link from "next/link";
import { useInView } from "@/hooks/useInView";
import { pusherClient } from "@/lib/pusher";
import { Group } from "@prisma/client";


interface Message {
  id: string;
  content: string;
  isAI: boolean;
  createdAt: string;
  contentTranslationMetadata: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
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

interface VideoSession {
  title: string;
  description: string;
  dueDate: string;
}

interface Milestone {
  title: string;
  description: string;
  dueDate: string;
}

export default function GroupChatPage() {
  const params = useParams();
  const { data: session } = useSession();
  const groupId = params.id as string;
  const { userLanguage, isTranslationEnabled, getStoredTranslation, translateContent, storeTranslation } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [group, setGroup] = useState<Group & { _count: { members: number; messages: number } } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showAICommands, setShowAICommands] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [displayLanguage, setDisplayLanguage] = useState('en');
  const [translatingMessages, setTranslatingMessages] = useState<Set<string>>(new Set());
  const [translatedMessages, setTranslatedMessages] = useState<Set<string>>(new Set());
  const [confirmingMessages, setConfirmingMessages] = useState<Set<string>>(new Set());

  // Pusher integration
  const { notifications, isConnected } = usePusher(groupId);

  // Set initial display language based on user preference
  useEffect(() => {
    if (isTranslationEnabled && userLanguage.code !== 'en') {
      setDisplayLanguage(userLanguage.code);
    }
  }, [userLanguage.code, isTranslationEnabled]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset translated messages when language changes
  useEffect(() => {
    setTranslatedMessages(new Set());
  }, [displayLanguage]);

  // Function to handle translation when message comes into view
  const handleMessageInView = useCallback(async (message: Message, messageIndex: number) => {
    if (!isTranslationEnabled || displayLanguage === 'en' || translatingMessages.has(message.id) || translatedMessages.has(message.id)) {
      return;
    }

    // Check if translation already exists
    const existingTranslation = getStoredTranslation(message.contentTranslationMetadata, displayLanguage);
    if (existingTranslation) {
      setTranslatedMessages(prev => new Set(prev).add(message.id));
      return;
    }

    // Mark message as being translated
    setTranslatingMessages(prev => new Set(prev).add(message.id));

    try {
      let contentToTranslate = message.content;
      
      // For AI messages, extract the text content
      if (message.isAI) {
        try {
          const parsed = JSON.parse(message.content);
          contentToTranslate = parsed.text || message.content;
        } catch {
          contentToTranslate = message.content;
        }
      }

      // Translate the content
      const translatedContent = await translateContent(contentToTranslate, displayLanguage);
      
      if (translatedContent && translatedContent !== contentToTranslate) {
        // Store the translation
        await storeTranslation('message', message.id, displayLanguage, translatedContent);
        
        // Update the message with new translation metadata
        setMessages(prev => prev.map((msg, index) => {
          if (msg.id === message.id) {
            const newMetadata = {
              ...(msg.contentTranslationMetadata ? JSON.parse(msg.contentTranslationMetadata) : {}),
              [displayLanguage]: {
                content: translatedContent,
                timestamp: new Date().toISOString()
              }
            };
            return {
              ...msg,
              contentTranslationMetadata: JSON.stringify(newMetadata)
            };
          }
          return msg;
        }));
        
        // Mark as translated
        setTranslatedMessages(prev => new Set(prev).add(message.id));
      }
    } catch (error) {
      console.error('Error translating message:', error);
    } finally {
      // Remove from translating set
      setTranslatingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(message.id);
        return newSet;
      });
    }
  }, [isTranslationEnabled, displayLanguage, translatingMessages, translatedMessages, getStoredTranslation, translateContent, storeTranslation]);

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const [groupRes, messagesRes, membersRes] = await Promise.all([
          fetch(`/api/groups/${groupId}`),
          fetch(`/api/groups/${groupId}/messages`),
          fetch(`/api/groups/${groupId}/members`)
        ]);

        if (!groupRes.ok) throw new Error('Failed to fetch group');
        if (!messagesRes.ok) throw new Error('Failed to fetch messages');
        if (!membersRes.ok) throw new Error('Failed to fetch members');

        const [groupData, messagesData, membersData] = await Promise.all([
          groupRes.json(),
          messagesRes.json(),
          membersRes.json()
        ]);

        setGroup(groupData);
        setMessages(messagesData.messages);
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

  // Handle Pusher events for real-time updates
  useEffect(() => {
    const handleNewMessage = (data: { message: Message }) => {
      setMessages(prev => [...prev, data.message]);
    };

    const handleMessageUpdate = (data: { message: Message }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.message.id ? data.message : msg
      ));
    };

    // Subscribe to Pusher events
    const channel = pusherClient.subscribe(`group-${groupId}`);
    channel.bind('new-message', handleNewMessage);
    channel.bind('message-updated', handleMessageUpdate);

    return () => {
      channel.unbind('new-message', handleNewMessage);
      channel.unbind('message-updated', handleMessageUpdate);
      pusherClient.unsubscribe(`group-${groupId}`);
    };
  }, [groupId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !groupId) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const response = await fetch(`/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // If there's an error, restore the message content
      setNewMessage(messageContent);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAICommand = (command: string) => {
    setNewMessage(`@AI ${command}`);
    setShowAICommands(false);
  };

  const handleConfirmMilestones = async (messageId: string, milestones: Milestone[]) => {
    setConfirmingMessages(prev => new Set(prev).add(messageId));
    
    try {
      // Create each milestone
      for (const milestone of milestones) {
        await fetch(`/api/groups/${groupId}/milestones`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: milestone.title,
            description: milestone.description,
            dueDate: milestone.dueDate
          }),
        });
      }
      
      // Update the message to mark as confirmed in the database
      const messageToUpdate = messages.find(msg => msg.id === messageId);
      if (messageToUpdate) {
        const content = JSON.parse(messageToUpdate.content);
        const updatedContent = JSON.stringify({
          ...content,
          confirmed: true
        });
        
        await fetch(`/api/groups/${groupId}/messages`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageId,
            content: updatedContent
          }),
        });
      }
    } catch (error) {
      console.error('Error creating milestones:', error);
    } finally {
      setConfirmingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };

  const handleConfirmVideoSessions = async (messageId: string, videoSessions: VideoSession[]) => {
    setConfirmingMessages(prev => new Set(prev).add(messageId));
    
    try {
      // Create each video session
      for (const session of videoSessions) {
        await fetch(`/api/groups/${groupId}/video-sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: session.title,
            description: session.description,
            startTime: session.dueDate, // Using dueDate as startTime
            endTime: new Date(new Date(session.dueDate).getTime() + 60 * 60 * 1000).toISOString() // 1 hour later
          }),
        });
      }
      
      // Update the message to mark as confirmed in the database
      const messageToUpdate = messages.find(msg => msg.id === messageId);
      if (messageToUpdate) {
        const content = JSON.parse(messageToUpdate.content);
        const updatedContent = JSON.stringify({
          ...content,
          confirmed: true
        });
        
        await fetch(`/api/groups/${groupId}/messages`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageId,
            content: updatedContent
          }),
        });
      }
    } catch (error) {
      console.error('Error creating video sessions:', error);
    } finally {
      setConfirmingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };

  const aiCommands = [
    "Generate practice problems for this topic",
    "Create a new milestone for upcoming exam",
    "Suggest study resources",
    "Review our group progress",
    "Help plan next study session"
  ];

  if (isLoading) {
    return (
        <div className="flex-1 flex flex-col h-[40rem] items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading group...</span>
          </div>
        </div>
    );
  }

  if (error || !group) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center">
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
      <div className="flex-1 flex flex-col overflow-hidden max-w-full w-full">
        <div className="flex-1 flex max-w-full">
          {/* Chat Section */}
          <div className="flex-1 flex flex-col min-w-0">
            <Card className="flex flex-col m-6 max-w-full" style={{ height: 'calc(100vh - 200px)' }}>
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Group Chat</CardTitle>
                    <CardDescription>Real-time messaging with your study group</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isTranslationEnabled && (
                      <TranslationToggle
                        currentLanguage={displayLanguage}
                        onLanguageChange={setDisplayLanguage}
                      />
                    )}
                    <Badge variant={isConnected ? "default" : "secondary"}>
                      {isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0 max-w-full overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-full" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                  {messages.map((message, index) => {
                    // Create individual useInView hook for each message
                    const MessageInViewComponent = () => {
                      const [ref, inView] = useInView({ threshold: 0.1 });
                      
                      useEffect(() => {
                        if (inView) {
                          handleMessageInView(message, index);
                        }
                      }, [inView, message, index]);
                      
                      return (
                        <div ref={ref as React.RefObject<HTMLDivElement>} className={`flex ${!message.isAI && message.user.id === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex items-start space-x-3 max-w-[70%] min-w-0 ${!message.isAI && message.user.id === session?.user?.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.isAI ? "/logo.png" : message.user.avatar} />
                              <AvatarFallback>{message.isAI ? "AI" : message.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={`rounded-lg p-3 max-w-full break-words ${message.isAI ? 'bg-gradient-primary-10 border border-primary/20' : message.user.id === session?.user?.id ? 'bg-purple-600 text-white' : 'bg-muted'}`}>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium">{message.isAI ? "AI Assistant" : message.user.name}</span>
                                {message.isAI && <Brain className="h-3 w-3" />}
                                <span className="text-xs opacity-70">
                                  {formatTime(message.createdAt)}
                                </span>
                                {translatingMessages.has(message.id) && (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                )}
                              </div>
                              {message.isAI ? (
                                <div className="space-y-2">
                                  <div className="text-sm max-w-full overflow-hidden">
                                    <TranslationContent
                                      originalContent={JSON.parse(message.content).text}
                                      translatedContent={getStoredTranslation(message.contentTranslationMetadata, displayLanguage) || JSON.parse(message.content).text}
                                      currentLanguage={displayLanguage}
                                      sourceLanguage="en"
                                    />
                                  </div>
                                  {JSON.parse(message.content).action && (
                                    <div className="space-y-2 max-w-full overflow-hidden">
                                      <div className="text-sm font-medium text-primary break-words">
                                        {JSON.parse(message.content).action}
                                      </div>
                                      
                                      {/* Video Sessions */}
                                      {JSON.parse(message.content).data.videoSessions && (
                                        <div className="space-y-1 max-w-full overflow-hidden">
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Video className="h-3 w-3 flex-shrink-0" />
                                            <span className="font-medium uppercase tracking-wide break-words">Video Sessions ({JSON.parse(message.content).data.videoSessions.length})</span>
                                          </div>
                                          <div className="grid gap-1 max-w-full">
                                            {JSON.parse(message.content).data.videoSessions.map((videoSession: VideoSession, index: number) => (
                                              <div key={`video_${index}`} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2 hover:shadow-sm transition-all duration-200 cursor-pointer group max-w-full overflow-hidden">
                                                <div className="flex items-center justify-between max-w-full">
                                                  <div className="flex-1 min-w-0 max-w-full">
                                                    <h3 className="font-medium text-blue-900 text-sm break-words">{videoSession.title}</h3>
                                                    <p className="text-xs text-blue-600 break-words">{videoSession.description}</p>
                                                  </div>
                                                  <div className="flex items-center text-xs text-blue-500 ml-2">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    <span className="hidden group-hover:inline">
                                                      {videoSession.dueDate ? formatDate(videoSession.dueDate) : 'No date'}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          {!JSON.parse(message.content).confirmed && (
                                            <div className="flex items-center gap-2 mt-2">
                                              <Button 
                                                size="sm" 
                                                onClick={() => handleConfirmVideoSessions(message.id, JSON.parse(message.content).data.videoSessions)}
                                                disabled={confirmingMessages.has(message.id)}
                                                className="bg-blue-600 hover:bg-blue-700"
                                              >
                                                {confirmingMessages.has(message.id) ? (
                                                  <>
                                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                    Creating...
                                                  </>
                                                ) : (
                                                  <>
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Confirm Video Sessions
                                                  </>
                                                )}
                                              </Button>
                                            </div>
                                          )}
                                          {JSON.parse(message.content).confirmed && (
                                            <div className="flex items-center gap-2 mt-2">
                                              <Badge variant="default" className="bg-green-600">
                                                <Check className="h-3 w-3 mr-1" />
                                                Confirmed
                                              </Badge>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Milestones */}
                                      {JSON.parse(message.content).data.milestones && (
                                        <div className="space-y-1 max-w-full overflow-hidden">
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Target className="h-3 w-3 flex-shrink-0" />
                                            <span className="font-medium uppercase tracking-wide break-words">Milestones ({JSON.parse(message.content).data.milestones.length})</span>
                                          </div>
                                          <div className="grid gap-1 max-w-full">
                                            {JSON.parse(message.content).data.milestones.map((milestone: Milestone, index: number) => (
                                              <div key={`milestone_${index}`} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2 hover:shadow-sm transition-all duration-200 cursor-pointer group max-w-full overflow-hidden">
                                                <div className="flex items-center justify-between max-w-full">
                                                  <div className="flex-1 min-w-0 max-w-full">
                                                    <h3 className="font-medium text-green-900 text-sm break-words">{milestone.title}</h3>
                                                    <p className="text-xs text-green-600 break-words">{milestone.description}</p>
                                                  </div>
                                                  <div className="flex items-center text-xs text-green-500 ml-2">
                                                    <Target className="h-3 w-3 mr-1" />
                                                    <span className="hidden group-hover:inline">
                                                      {milestone.dueDate ? formatDate(milestone.dueDate) : 'No date'}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          {!JSON.parse(message.content).confirmed && (
                                            <div className="flex items-center gap-2 mt-2">
                                              <Button 
                                                size="sm" 
                                                onClick={() => handleConfirmMilestones(message.id, JSON.parse(message.content).data.milestones)}
                                                disabled={confirmingMessages.has(message.id)}
                                                className="bg-green-600 hover:bg-green-700"
                                              >
                                                {confirmingMessages.has(message.id) ? (
                                                  <>
                                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                    Creating...
                                                  </>
                                                ) : (
                                                  <>
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Confirm Milestones
                                                  </>
                                                )}
                                              </Button>
                                            </div>
                                          )}
                                          {JSON.parse(message.content).confirmed && (
                                            <div className="flex items-center gap-2 mt-2">
                                              <Badge variant="default" className="bg-green-600">
                                                <Check className="h-3 w-3 mr-1" />
                                                Confirmed
                                              </Badge>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm">
                                  <TranslationContent
                                    originalContent={message.content}
                                    translatedContent={getStoredTranslation(message.contentTranslationMetadata, displayLanguage) || message.content}
                                    currentLanguage={displayLanguage}
                                    sourceLanguage="en"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    };
                    
                    return <MessageInViewComponent key={message.id} />;
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t p-4 max-w-full flex-shrink-0 overflow-hidden">
                  <div className="flex items-end space-x-2 max-w-full">
                    <div className="flex-1 relative min-w-0">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="min-h-[60px] max-h-[120px] resize-none max-w-full overflow-hidden"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 bottom-2"
                        onClick={() => setShowAICommands(!showAICommands)}
                      >
                        <AtSign className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* AI Commands */}
                  {showAICommands && (
                    <div className="mt-2 p-3 bg-muted rounded-lg max-w-full overflow-hidden">
                      <p className="text-sm font-medium mb-2">AI Commands:</p>
                      <div className="space-y-1">
                        {aiCommands.map((command) => (
                          <button
                            key={command}
                            onClick={() => handleAICommand(command)}
                            className="block w-full text-left text-sm p-2 rounded hover:bg-background transition-colors"
                          >
                            {command}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-80 border-l bg-muted/30 flex-shrink-0 h-full overflow-y-auto">
            <div className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Group Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <div className="text-sm text-muted-foreground">
                      <TranslationContent
                        originalContent={group.description}
                        translatedContent={getStoredTranslation(group.descriptionTranslationMetadata, displayLanguage) || group.description}
                        currentLanguage={displayLanguage}
                        sourceLanguage="en"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Members ({group._count.members}/{group.maxMembers})</h3>
                    <div className="space-y-2">
                      {members.slice(0, 5).map((member) => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.user.avatar} />
                            <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member.user.name}</span>
                          <Badge variant="outline" className="text-xs">{member.role}</Badge>
                        </div>
                      ))}
                      {members.length > 5 && (
                        <p className="text-sm text-muted-foreground">+{members.length - 5} more</p>
                      )}
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
