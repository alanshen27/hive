import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
  Clock,
  Check,
  Loader2,
  FileText,
  Settings
} from "lucide-react";
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const notificationIcons = {
  message: MessageSquare,
  milestone: Target,
  ai: Brain,
  session: Calendar,
  group: Users,
  join_request: UserPlus,
  file: FileText,
  system: Settings,
};

const notificationColors = {
  message: 'text-blue-600',
  milestone: 'text-green-600',
  ai: 'text-purple-600',
  session: 'text-orange-600',
  group: 'text-indigo-600',
  join_request: 'text-pink-600',
  file: 'text-cyan-600',
  system: 'text-gray-600',
};

export function NotificationDropdown() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Get recent unread notifications (max 5)
  const recentNotifications = notifications
    .filter(n => !n.isRead)
    .slice(0, 5);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead([notification.id]);
    
    // Navigate based on notification type
    if (notification.metadata?.groupId) {
      router.push(`/group/${notification.metadata.groupId}`);
    } else if (notification.metadata?.milestoneId) {
      router.push(`/milestones/${notification.metadata.milestoneId}`);
    } else if (notification.metadata?.sessionId) {
      router.push(`/video-sessions/${notification.metadata.sessionId}`);
    }
    
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    const unreadIds = recentNotifications.map(n => n.id);
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {recentNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-6 px-2 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {recentNotifications.length === 0 ? (
          <div className="p-4 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No new notifications</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {recentNotifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || MessageSquare;
              const colorClass = notificationColors[notification.type];
              
              return (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="flex items-start space-x-3 p-3 cursor-pointer hover:bg-muted/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`${colorClass} bg-muted`}>
                      <Icon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => {
            router.push('/notifications');
            setIsOpen(false);
          }}
          className="cursor-pointer"
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

