import { prisma } from './prisma';
import { pusher } from './pusher';

export interface NotificationData {
  type: 'message' | 'milestone' | 'ai' | 'session' | 'group' | 'join_request' | 'file' | 'system';
  title: string;
  message: string;
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

export class NotificationService {
  /**
   * Create a notification and send real-time update
   */
  static async createNotification(data: NotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          userId: data.userId,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      // Send real-time notification
      await pusher.trigger(`user-${data.userId}`, 'new-notification', {
        notification,
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for new message in group
   */
  static async notifyNewMessage(groupId: string, messageId: string, senderId: string, content: string) {
    try {
      // Get all group members except the sender
      const members = await prisma.groupMember.findMany({
        where: {
          groupId,
          userId: { not: senderId },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { name: true },
      });

      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      });

      // Create notifications for all members
      const notifications = await Promise.all(
        members.map((member) =>
          this.createNotification({
            type: 'message',
            title: `New message in ${group?.name}`,
            message: `${sender?.name}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
            userId: member.user.id,
            metadata: {
              groupId,
              messageId,
              userId: senderId,
            },
          })
        )
      );

      return notifications;
    } catch (error) {
      console.error('Error creating message notifications:', error);
      throw error;
    }
  }

  /**
   * Create notification for new milestone
   */
  static async notifyNewMilestone(groupId: string, milestoneId: string, title: string) {
    try {
      const members = await prisma.groupMember.findMany({
        where: { groupId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      });

      const notifications = await Promise.all(
        members.map((member) =>
          this.createNotification({
            type: 'milestone',
            title: `New milestone in ${group?.name}`,
            message: `A new milestone "${title}" has been created`,
            userId: member.user.id,
            metadata: {
              groupId,
              milestoneId,
            },
          })
        )
      );

      return notifications;
    } catch (error) {
      console.error('Error creating milestone notifications:', error);
      throw error;
    }
  }

  /**
   * Create notification for milestone completion
   */
  static async notifyMilestoneCompleted(groupId: string, milestoneId: string, title: string, completedBy: string) {
    try {
      const members = await prisma.groupMember.findMany({
        where: { groupId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      });

      const completedByUser = await prisma.user.findUnique({
        where: { id: completedBy },
        select: { name: true },
      });

      const notifications = await Promise.all(
        members.map((member) =>
          this.createNotification({
            type: 'milestone',
            title: `Milestone completed in ${group?.name}`,
            message: `${completedByUser?.name} completed the milestone "${title}"`,
            userId: member.user.id,
            metadata: {
              groupId,
              milestoneId,
              userId: completedBy,
            },
          })
        )
      );

      return notifications;
    } catch (error) {
      console.error('Error creating milestone completion notifications:', error);
      throw error;
    }
  }

  /**
   * Create notification for new video session
   */
  static async notifyNewVideoSession(groupId: string, sessionId: string, title: string, startTime: string) {
    try {
      const members = await prisma.groupMember.findMany({
        where: { groupId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      });

      const notifications = await Promise.all(
        members.map((member) =>
          this.createNotification({
            type: 'session',
            title: `New video session in ${group?.name}`,
            message: `A new video session "${title}" has been scheduled for ${new Date(startTime).toLocaleString()}`,
            userId: member.user.id,
            metadata: {
              groupId,
              sessionId,
            },
          })
        )
      );

      return notifications;
    } catch (error) {
      console.error('Error creating video session notifications:', error);
      throw error;
    }
  }

  /**
   * Create notification for join request
   */
  static async notifyJoinRequest(groupId: string, requesterId: string) {
    try {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const requester = await prisma.user.findUnique({
        where: { id: requesterId },
        select: {
          id: true,
          name: true,
        },
      });

      if (!group || !requester) {
        throw new Error('Group or requester not found');
      }

      return await this.createNotification({
        type: 'join_request',
        title: 'New join request',
        message: `${requester.name} wants to join ${group.name}`,
        userId: group.owner.id,
        metadata: {
          groupId,
          userId: requesterId,
        },
      });
    } catch (error) {
      console.error('Error creating join request notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for join request response
   */
  static async notifyJoinRequestResponse(groupId: string, requesterId: string, approved: boolean) {
    try {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      });

      return await this.createNotification({
        type: 'join_request',
        title: `Join request ${approved ? 'approved' : 'rejected'}`,
        message: `Your request to join ${group?.name} has been ${approved ? 'approved' : 'rejected'}`,
        userId: requesterId,
        metadata: {
          groupId,
        },
      });
    } catch (error) {
      console.error('Error creating join request response notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for new file upload
   */
  static async notifyFileUpload(groupId: string, fileId: string, fileName: string, uploadedBy: string) {
    try {
      const members = await prisma.groupMember.findMany({
        where: {
          groupId,
          userId: { not: uploadedBy },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      });

      const uploader = await prisma.user.findUnique({
        where: { id: uploadedBy },
        select: { name: true },
      });

      const notifications = await Promise.all(
        members.map((member) =>
          this.createNotification({
            type: 'file',
            title: `New file in ${group?.name}`,
            message: `${uploader?.name} uploaded "${fileName}"`,
            userId: member.user.id,
            metadata: {
              groupId,
              fileId,
              userId: uploadedBy,
            },
          })
        )
      );

      return notifications;
    } catch (error) {
      console.error('Error creating file upload notifications:', error);
      throw error;
    }
  }

  /**
   * Create system notification
   */
  static async notifySystem(userId: string, title: string, message: string, metadata?: Record<string, any>) {
    try {
      return await this.createNotification({
        type: 'system',
        title,
        message,
        userId,
        metadata,
      });
    } catch (error) {
      console.error('Error creating system notification:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(userId: string, notificationIds: string[]) {
    try {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
        },
        data: { isRead: true },
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: { isRead: true },
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
}

