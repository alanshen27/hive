import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Users, 
  Target, 
  Brain, 
  Calendar,
  UserPlus,
  Clock,
  Check,
  FileText,
  Settings
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onAction?: (notification: Notification) => void;
}

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

const notificationBgColors = {
  message: 'bg-blue-50',
  milestone: 'bg-green-50',
  ai: 'bg-purple-50',
  session: 'bg-orange-50',
  group: 'bg-indigo-50',
  join_request: 'bg-pink-50',
  file: 'bg-cyan-50',
  system: 'bg-gray-50',
};

export function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onAction 
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = notificationIcons[notification.type] || MessageSquare;
  const colorClass = notificationColors[notification.type];
  const bgClass = notificationBgColors[notification.type];

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (onAction) {
      onAction(notification);
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
    <Card 
      className={`transition-all duration-200 cursor-pointer group ${
        !notification.isRead 
          ? 'border-primary/20 bg-primary/5 shadow-sm' 
          : 'hover:shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <CardContent className="flex items-start space-x-4 p-4">
        <Avatar className={`${bgClass} border-2 ${!notification.isRead ? 'border-primary/20' : 'border-transparent'}`}>
          <AvatarFallback className={`${colorClass} font-semibold`}>
            <Icon className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                {notification.title}
              </p>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {notification.message}
              </p>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              {!notification.isRead && (
                <Badge variant="destructive" className="text-xs px-2 py-0.5">
                  New
                </Badge>
              )}
              <div className={`w-2 h-2 rounded-full ${!notification.isRead ? 'bg-primary' : 'bg-transparent'}`} />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(notification.createdAt)}
            </p>
            
            {isHovered && !notification.isRead && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark read
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

