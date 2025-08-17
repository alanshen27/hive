import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

export interface Notification {
  id: string;
  type: 'message' | 'milestone' | 'ai' | 'session' | 'group' | 'join_request' | 'file' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  metadata?: {
    groupId?: string;
    milestoneId?: string;
    sessionId?: string;
    userId?: string;
    fileId?: string;
    messageId?: string;
  };
}

export function useNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = useCallback(async (params?: { isRead?: boolean; page?: number; limit?: number }) => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await apiClient.getNotifications(params);
      setNotifications(response.notifications as Notification[]);
      setUnreadCount(response.notifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (!session?.user?.id) return;
    
    try {
      await apiClient.markNotificationsAsRead(notificationIds);
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id) 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      toast.error('Failed to update notifications');
    }
  }, [session?.user?.id]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  }, [notifications, markAsRead]);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show toast for new notifications
    toast(notification.title, {
      description: notification.message,
      action: {
        label: 'View',
        onClick: () => {
          // Navigate to relevant page based on notification type
          if (notification.metadata?.groupId) {
            window.location.href = `/group/${notification.metadata.groupId}`;
          } else if (notification.metadata?.milestoneId) {
            window.location.href = `/milestones/${notification.metadata.milestoneId}`;
          } else if (notification.metadata?.sessionId) {
            window.location.href = `/video-sessions/${notification.metadata.sessionId}`;
          }
        },
      },
    });
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await apiClient.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.isRead ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  }, [notifications]);

  // Initialize
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    deleteNotification,
  };
}
