// API Client for frontend API calls

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  subject: string;
  level: string;
  isPrivate: boolean;
  maxMembers: number;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner: User;
  _count: {
    members: number;
    messages: number;
  };
}

export interface Message {
  id: string;
  content: string;
  isAI: boolean;
  createdAt: string;
  userId: string;
  groupId: string;
  user: User;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: string;
  joinedAt: string;
  user: User;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  groupId: string;
  submissions: MilestoneSubmission[];
}

export interface MilestoneSubmission {
  id: string;
  content: string;
  submittedAt: string;
  userId: string;
  milestoneId: string;
  user: User;
}

export interface File {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  userId: string;
  groupId: string;
  user: User;
}

export interface VideoSession {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  status: string;
  meetingUrl?: string;
  createdAt: string;
  updatedAt: string;
  groupId: string;
  participants: VideoSessionParticipant[];
}

export interface VideoSessionParticipant {
  id: string;
  joinedAt: string;
  leftAt?: string;
  userId: string;
  videoSessionId: string;
  user: User;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  // Groups
  async getGroups(params?: {
    search?: string;
    subject?: string;
    level?: string;
    activity?: string;
    sortBy?: string;
    showOnlyAvailable?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ groups: Group[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, value.toString());
      });
    }
    
    const response = await fetch(`${this.baseUrl}/groups?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch groups');
    return response.json();
  }

  async getGroup(id: string): Promise<{ group: Group }> {
    const response = await fetch(`${this.baseUrl}/groups/${id}`);
    if (!response.ok) throw new Error('Failed to fetch group');
    return response.json();
  }

  async createGroup(data: {
    name: string;
    description: string;
    subject: string;
    level: string;
    isPrivate: boolean;
    maxMembers: number;
    ownerId: string;
  }): Promise<Group> {
    const response = await fetch(`${this.baseUrl}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create group');
    return response.json();
  }

  async updateGroup(id: string, data: Partial<Group>): Promise<{ group: Group }> {
    const response = await fetch(`${this.baseUrl}/groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update group');
    return response.json();
  }

  async deleteGroup(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/groups/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete group');
  }

  // Messages
  async getMessages(groupId: string, page: number = 1, limit: number = 50): Promise<{ messages: Message[]; total: number }> {
    const response = await fetch(`${this.baseUrl}/groups/${groupId}/messages?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  }

  async sendMessage(groupId: string, data: { content: string; isAI?: boolean }): Promise<{ message: Message }> {
    const response = await fetch(`${this.baseUrl}/groups/${groupId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  }

  // Members
  async getMembers(groupId: string): Promise<{ members: GroupMember[] }> {
    const response = await fetch(`${this.baseUrl}/groups/${groupId}/members`);
    if (!response.ok) throw new Error('Failed to fetch members');
    return response.json();
  }

  async addMember(groupId: string, data: { userId: string; role?: string }): Promise<{ member: GroupMember }> {
    const response = await fetch(`${this.baseUrl}/groups/${groupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add member');
    return response.json();
  }

  // Milestones
  async getMilestones(groupId: string): Promise<{ milestones: Milestone[] }> {
    const response = await fetch(`${this.baseUrl}/groups/${groupId}/milestones`);
    if (!response.ok) throw new Error('Failed to fetch milestones');
    return response.json();
  }

  async createMilestone(groupId: string, data: { title: string; description?: string; dueDate: string }): Promise<{ milestone: Milestone }> {
    const response = await fetch(`${this.baseUrl}/groups/${groupId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create milestone');
    return response.json();
  }

  // Milestone Submissions
  async getSubmissions(milestoneId: string): Promise<{ submissions: MilestoneSubmission[] }> {
    const response = await fetch(`${this.baseUrl}/milestones/${milestoneId}/submissions`);
    if (!response.ok) throw new Error('Failed to fetch submissions');
    return response.json();
  }

  async submitToMilestone(milestoneId: string, data: { content: string }): Promise<{ submission: MilestoneSubmission }> {
    const response = await fetch(`${this.baseUrl}/milestones/${milestoneId}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to submit to milestone');
    return response.json();
  }

  // Video Sessions
  async getVideoSessions(groupId: string): Promise<{ videoSessions: VideoSession[] }> {
    const response = await fetch(`${this.baseUrl}/groups/${groupId}/video-sessions`);
    if (!response.ok) throw new Error('Failed to fetch video sessions');
    return response.json();
  }

  async createVideoSession(groupId: string, data: { title: string; description?: string; startTime: string; endTime?: string }): Promise<{ videoSession: VideoSession }> {
    const response = await fetch(`${this.baseUrl}/groups/${groupId}/video-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create video session');
    return response.json();
  }

  // Files
  async getFiles(groupId: string): Promise<{ files: File[] }> {
    const response = await fetch(`${this.baseUrl}/groups/${groupId}/files`);
    if (!response.ok) throw new Error('Failed to fetch files');
    return response.json();
  }

  async uploadFile(groupId: string, data: FormData): Promise<{ file: File }> {
    const response = await fetch(`${this.baseUrl}/groups/${groupId}/files`, {
      method: 'POST',
      body: data,
    });
    if (!response.ok) throw new Error('Failed to upload file');
    return response.json();
  }

  // Notifications
  async getNotifications(params?: { isRead?: boolean; page?: number; limit?: number }): Promise<{ notifications: Notification[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, value.toString());
      });
    }
    
    const response = await fetch(`${this.baseUrl}/notifications?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  }

  async markNotificationsAsRead(notificationIds: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/notifications`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds }),
    });
    if (!response.ok) throw new Error('Failed to mark notifications as read');
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/notifications/${notificationId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete notification');
  }

  async createNotification(data: {
    type: string;
    title: string;
    message: string;
    userId: string;
    metadata?: Record<string, any>;
  }): Promise<Notification> {
    const response = await fetch(`${this.baseUrl}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create notification');
    return response.json();
  }

  // Users
  async getUsers(params?: { search?: string; page?: number; limit?: number }): Promise<{ users: User[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, value.toString());
      });
    }
    
    const response = await fetch(`${this.baseUrl}/users?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  }

  async getUser(id: string): Promise<{ user: User }> {
    const response = await fetch(`${this.baseUrl}/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  }

  async updateUser(id: string, data: Partial<User>): Promise<{ user: User }> {
    const response = await fetch(`${this.baseUrl}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  }
}

// Export a default instance
export const apiClient = new ApiClient();
