'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Bell, 
  MessageSquare, 
  Users, 
  Target, 
  Brain, 
  Calendar,
  UserPlus,
  Filter,
  Check,
  Loader2,
  FileText,
  Settings
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { NotificationItem } from "@/components/NotificationItem";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { toast } from "sonner";

export default function NotificationsPage() {
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'message' | 'milestone' | 'ai' | 'session' | 'group' | 'join_request' | 'file' | 'system'>('all');

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.type === filter;
  });

  const handleNotificationAction = (notification: Notification) => {
    // Navigate based on notification type and metadata
    if (notification.metadata?.groupId) {
      router.push(`/group/${notification.metadata.groupId}`);
    } else if (notification.metadata?.milestoneId) {
      router.push(`/milestones/${notification.metadata.milestoneId}`);
    } else if (notification.metadata?.sessionId) {
      router.push(`/video-sessions/${notification.metadata.sessionId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const getFilterCount = (filterType: string) => {
    if (filterType === 'all') return notifications.length;
    if (filterType === 'unread') return unreadCount;
    return notifications.filter(n => n.type === filterType).length;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading notifications...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your study groups and activities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleMarkAllAsRead}
              className="flex items-center space-x-2"
            >
              <Check className="h-4 w-4" />
              <span>Mark all read</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          <Select value={filter} onValueChange={(value: 'all' | 'unread' | 'message' | 'milestone' | 'ai' | 'session' | 'group' | 'join_request' | 'file' | 'system') => setFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All ({getFilterCount('all')})
              </SelectItem>
              <SelectItem value="unread">
                Unread ({getFilterCount('unread')})
              </SelectItem>
              <SelectItem value="message">
                Messages ({getFilterCount('message')})
              </SelectItem>
              <SelectItem value="milestone">
                Milestones ({getFilterCount('milestone')})
              </SelectItem>
              <SelectItem value="ai">
                AI Feedback ({getFilterCount('ai')})
              </SelectItem>
              <SelectItem value="session">
                Sessions ({getFilterCount('session')})
              </SelectItem>
              <SelectItem value="group">
                Group Updates ({getFilterCount('group')})
              </SelectItem>
              <SelectItem value="join_request">
                Join Requests ({getFilterCount('join_request')})
              </SelectItem>
              <SelectItem value="file">
                Files ({getFilterCount('file')})
              </SelectItem>
              <SelectItem value="system">
                System ({getFilterCount('system')})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={(id) => markAsRead([id])}
            onAction={handleNotificationAction}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-muted rounded-full">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  {filter === 'all' 
                    ? "You'll see updates from your study groups, milestones, and AI feedback here"
                    : `You don't have any ${filter} notifications at the moment`
                  }
                </p>
              </div>
              {filter !== 'all' && (
                <Button 
                  variant="outline" 
                  onClick={() => setFilter('all')}
                >
                  View all notifications
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}