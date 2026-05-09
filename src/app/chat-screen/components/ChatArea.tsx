'use client';

import React, { useRef, useEffect } from 'react';
import { ArrowLeft, Search, Phone, MoreVertical } from 'lucide-react';
import { Conversation, Message, UserInfo, OnlineStatus } from '../types';
import { formatLastSeen } from '../utils';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import MessageInput from './MessageInput';
import DateSeparator from './DateSeparator';

interface ChatAreaProps {
  conversation: Conversation;
  messages: Message[];
  currentUser: UserInfo;
  isTyping: boolean;
  otherUserStatus: OnlineStatus | null;
  onSendMessage: (text: string) => void;
  onBack: () => void;
}

const AVATAR_GRADIENT_MAP: Record<string, string> = {
  blue: 'avatar-gradient-blue',
  purple: 'avatar-gradient-purple',
  green: 'avatar-gradient-green',
  orange: 'avatar-gradient-orange',
  pink: 'avatar-gradient-pink',
  teal: 'avatar-gradient-teal',
  red: 'avatar-gradient-red',
  indigo: 'avatar-gradient-indigo',
};

export default function ChatArea({
  conversation,
  messages,
  currentUser,
  isTyping,
  otherUserStatus,
  onSendMessage,
  onBack,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const isOnline = otherUserStatus?.isOnline ?? false;
  const gradientClass = AVATAR_GRADIENT_MAP[conversation.avatarColor] || 'avatar-gradient-blue';

  // Build messages with date separators
  const messageGroups: Array<{ type: 'date'; date: string } | { type: 'message'; message: Message }> = [];
  let lastDate = '';

  messages.forEach((msg) => {
    const msgDate = new Date(msg.timestamp).toDateString();
    if (msgDate !== lastDate) {
      messageGroups.push({ type: 'date', date: msg.timestamp });
      lastDate = msgDate;
    }
    messageGroups.push({ type: 'message', message: msg });
  });

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--chat-bg)' }}>
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{
          background: 'var(--topbar-bg)',
          borderBottom: '1px solid var(--border)',
          minHeight: '60px',
        }}
      >
        {/* Back button (mobile) */}
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg transition-colors md:hidden"
          style={{ color: 'var(--primary)' }}
          aria-label="Back to conversations"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-700 ${gradientClass}`}
            style={{ color: 'white', fontWeight: 700 }}
          >
            {conversation.otherUserName.charAt(0).toUpperCase()}
          </div>
          {isOnline && (
            <div
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style={{ background: 'var(--online-green)', borderColor: 'var(--topbar-bg)' }}
            />
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-600 truncate" style={{ color: 'var(--foreground)', fontWeight: 600 }}>
            {conversation.otherUserName}
          </p>
          <p
            className="text-xs truncate"
            style={{ color: isOnline ? 'var(--online-green)' : 'var(--muted-foreground)' }}
          >
            {isOnline ? 'online' : formatLastSeen(otherUserStatus?.lastSeen)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--hover-bg)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            aria-label="Search in conversation"
          >
            <Search size={18} />
          </button>
          <button
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--hover-bg)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            aria-label="Voice call"
          >
            <Phone size={18} />
          </button>
          <button
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--hover-bg)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            aria-label="More options"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4"
        style={{ background: 'var(--chat-bg)' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-700 ${gradientClass}`}
              style={{ color: 'white', fontWeight: 700 }}
            >
              {conversation.otherUserName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-500" style={{ color: 'var(--foreground)', fontWeight: 500 }}>
                {conversation.otherUserName}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                @{conversation.otherUserUsername}
              </p>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {messageGroups.map((item, idx) => {
              if (item.type === 'date') {
                return <DateSeparator key={`sep-${idx}-${item.date}`} timestamp={item.date} />;
              }
              const msg = item.message;
              const prevItem = messageGroups[idx - 1];
              const prevMsg = prevItem?.type === 'message' ? prevItem.message : null;
              const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
              return (
                <MessageBubble
                  key={`msg-${msg.id}`}
                  message={msg}
                  isFirstInGroup={isFirstInGroup}
                />
              );
            })}
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="mt-2">
            <TypingIndicator name={conversation.otherUserName} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0">
        <MessageInput
          onSendMessage={onSendMessage}
          isTyping={false}
          conversationId={conversation.id}
        />
      </div>
    </div>
  );
}