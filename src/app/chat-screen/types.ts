export interface UserInfo {
  username: string;
  displayName: string;
}

export interface MockUser {
  username: string;
  displayName: string;
  avatarColor: string;
  bio?: string;
}

export interface Conversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserUsername: string;
  avatarColor: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  isOwn: boolean;
}

export interface OnlineStatus {
  isOnline: boolean;
  lastSeen?: string;
}