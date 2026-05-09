'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ChatSidebar from './ChatSidebar';
import ChatArea from './ChatArea';
import { Conversation, Message, UserInfo, OnlineStatus } from '../types';
import {
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_USERS,
  ONLINE_STATUSES,
} from '../mockData';

export default function ChatScreen() {
  const router = useRouter();
  const { session, loading, signOut } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, OnlineStatus>>(ONLINE_STATUSES);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/');
      return;
    }

    // Derive user info from Supabase session metadata or localStorage fallback
    const supabaseUser = session.user;
    const metadata = supabaseUser?.user_metadata || {};

    // Try localStorage first (set during login/register for username)
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('omni_user') : null;
    if (userStr) {
      try {
        const stored = JSON.parse(userStr) as UserInfo;
        setCurrentUser(stored);
        return;
      } catch {}
    }

    // Fallback: derive from Supabase metadata
    const email = supabaseUser?.email || '';
    const username = email.replace('@omni.app', '');
    const displayName = metadata?.full_name || username;
    setCurrentUser({ username, displayName });
    localStorage.setItem('omni_user', JSON.stringify({ username, displayName }));
  }, [session, loading, router]);

  // Simulate incoming message (mock real-time)
  useEffect(() => {
    // BACKEND INTEGRATION: Replace with WebSocket event listener for 'new_message'
    const timer = setTimeout(() => {
      const incomingMsg: Message = {
        id: 'msg-incoming-sim-001',
        conversationId: 'conv-001',
        senderId: 'sarahkim',
        senderName: 'Sarah Kim',
        text: 'Hey! Did you see the latest update? 👀',
        timestamp: new Date(Date.now() - 30000).toISOString(),
        status: 'delivered',
        isOwn: false,
      };

      setMessages((prev) => {
        const existing = prev['conv-001'] || [];
        if (existing.find((m) => m.id === incomingMsg.id)) return prev;
        return { ...prev, 'conv-001': [...existing, incomingMsg] };
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === 'conv-001'
            ? {
                ...c,
                lastMessage: incomingMsg.text,
                lastMessageTime: incomingMsg.timestamp,
                unreadCount: selectedConversationId === 'conv-001' ? 0 : (c.unreadCount || 0) + 1,
              }
            : c
        )
      );
    }, 4000);

    return () => clearTimeout(timer);
  }, [selectedConversationId]);

  // Simulate typing indicator (mock WebSocket)
  useEffect(() => {
    if (!selectedConversationId) return;
    // BACKEND INTEGRATION: Replace with WebSocket 'typing_start' / 'typing_stop' events
    const conv = conversations.find((c) => c.id === selectedConversationId);
    if (!conv) return;

    const startTimer = setTimeout(() => {
      setTypingUsers((prev) => ({ ...prev, [conv.otherUserId]: true }));
    }, 8000);

    const stopTimer = setTimeout(() => {
      setTypingUsers((prev) => ({ ...prev, [conv.otherUserId]: false }));
    }, 11000);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(stopTimer);
    };
  }, [selectedConversationId, conversations]);

  const handleSelectConversation = useCallback((convId: string) => {
    setSelectedConversationId(convId);
    setIsMobileListVisible(false);

    // Mark messages as read
    // BACKEND INTEGRATION: Emit 'mark_read' WebSocket event
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
    );

    // Mark all messages in this conversation as read
    setMessages((prev) => {
      const convMessages = prev[convId] || [];
      const updated = convMessages.map((m) =>
        !m.isOwn && m.status !== 'read' ? { ...m, status: 'read' as const } : m
      );
      return { ...prev, [convId]: updated };
    });
  }, []);

  const handleSendMessage = useCallback(
    (text: string) => {
      if (!selectedConversationId || !text.trim()) return;

      // BACKEND INTEGRATION: Emit 'send_message' WebSocket event; wait for 'message_sent' confirmation
      const newMessage: Message = {
        id: `msg-${Date.now()}-own`,
        conversationId: selectedConversationId,
        senderId: currentUser?.username || 'me',
        senderName: currentUser?.displayName || 'Me',
        text: text.trim(),
        timestamp: new Date().toISOString(),
        status: 'sent',
        isOwn: true,
      };

      setMessages((prev) => ({
        ...prev,
        [selectedConversationId]: [...(prev[selectedConversationId] || []), newMessage],
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversationId
            ? { ...c, lastMessage: text.trim(), lastMessageTime: newMessage.timestamp }
            : c
        ).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
      );

      // Simulate message delivered → read after delay
      setTimeout(() => {
        setMessages((prev) => ({
          ...prev,
          [selectedConversationId]: (prev[selectedConversationId] || []).map((m) =>
            m.id === newMessage.id ? { ...m, status: 'delivered' } : m
          ),
        }));
      }, 1000);

      setTimeout(() => {
        setMessages((prev) => ({
          ...prev,
          [selectedConversationId]: (prev[selectedConversationId] || []).map((m) =>
            m.id === newMessage.id ? { ...m, status: 'read' } : m
          ),
        }));
      }, 3000);
    },
    [selectedConversationId, currentUser]
  );

  const handleStartNewChat = useCallback((userId: string) => {
    // BACKEND INTEGRATION: POST /api/conversations to create or retrieve conversation
    const existingConv = conversations.find((c) => c.otherUserId === userId);
    if (existingConv) {
      handleSelectConversation(existingConv.id);
      setSearchQuery('');
      return;
    }

    const targetUser = MOCK_USERS.find((u) => u.username === userId);
    if (!targetUser) return;

    const newConv: Conversation = {
      id: `conv-new-${userId}`,
      otherUserId: userId,
      otherUserName: targetUser.displayName,
      otherUserUsername: targetUser.username,
      avatarColor: targetUser.avatarColor,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
    };

    setConversations((prev) => [newConv, ...prev]);
    setMessages((prev) => ({ ...prev, [`conv-new-${userId}`]: [] }));
    handleSelectConversation(newConv.id);
    setSearchQuery('');
  }, [conversations, handleSelectConversation]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch {}
    localStorage.removeItem('omni_user');
    router.replace('/');
  }, [router, signOut]);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) || null;
  const selectedMessages = selectedConversationId ? (messages[selectedConversationId] || []) : [];
  const isOtherUserTyping = selectedConversation
    ? !!typingUsers[selectedConversation.otherUserId]
    : false;
  const otherUserStatus = selectedConversation
    ? onlineStatuses[selectedConversation.otherUserId]
    : null;

  if (!currentUser) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Sidebar */}
      <div
        className={`flex-shrink-0 transition-all duration-300 ${
          isMobileListVisible ? 'flex' : 'hidden md:flex'
        }`}
        style={{ width: '360px', minWidth: '360px' }}
      >
        <ChatSidebar
          currentUser={currentUser}
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectConversation={handleSelectConversation}
          onStartNewChat={handleStartNewChat}
          onLogout={handleLogout}
          onlineStatuses={onlineStatuses}
          allUsers={MOCK_USERS}
        />
      </div>

      {/* Chat Area */}
      <div className={`flex-1 min-w-0 ${isMobileListVisible ? 'hidden md:flex' : 'flex'} flex-col`}>
        {selectedConversation ? (
          <ChatArea
            conversation={selectedConversation}
            messages={selectedMessages}
            currentUser={currentUser}
            isTyping={isOtherUserTyping}
            otherUserStatus={otherUserStatus}
            onSendMessage={handleSendMessage}
            onBack={() => setIsMobileListVisible(true)}
          />
        ) : (
          <EmptyConversationState />
        )}
      </div>
    </div>
  );
}

function EmptyConversationState() {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-4"
      style={{ background: 'var(--chat-bg)' }}
    >
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: 'var(--card)' }}
      >
        <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
          <rect x="3" y="5" width="24" height="18" rx="5" fill="var(--primary)" fillOpacity="0.5" />
          <rect x="9" y="13" width="18" height="14" rx="4" fill="var(--primary)" fillOpacity="0.3" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-base font-600" style={{ color: 'var(--foreground)', fontWeight: 600 }}>
          Select a conversation
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Choose from your chats or search for someone new
        </p>
      </div>
    </div>
  );
}