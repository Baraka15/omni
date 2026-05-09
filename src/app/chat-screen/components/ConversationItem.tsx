'use client';

import React from 'react';
import { Conversation, OnlineStatus } from '../types';
import { formatConversationTime } from '../utils';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onlineStatus: OnlineStatus | undefined;
  onClick: () => void;
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

export default function ConversationItem({
  conversation,
  isActive,
  onlineStatus,
  onClick,
}: ConversationItemProps) {
  const isOnline = onlineStatus?.isOnline ?? false;
  const gradientClass = AVATAR_GRADIENT_MAP[conversation.avatarColor] || 'avatar-gradient-blue';
  const initial = conversation.otherUserName.charAt(0).toUpperCase();
  const timeLabel = formatConversationTime(conversation.lastMessageTime);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 transition-colors duration-100 text-left"
      style={{
        background: isActive ? 'var(--active-bg)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--hover-bg)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
      aria-label={`Open conversation with ${conversation.otherUserName}`}
      aria-current={isActive ? 'true' : undefined}
    >
      {/* Avatar with online indicator */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-700 ${gradientClass}`}
          style={{ color: 'white', fontWeight: 700 }}
        >
          {initial}
        </div>
        {isOnline && (
          <div
            className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2"
            style={{
              background: 'var(--online-green)',
              borderColor: isActive ? 'var(--active-bg)' : 'var(--sidebar-bg)',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-sm font-600 truncate"
            style={{ color: 'var(--foreground)', fontWeight: 600 }}
          >
            {conversation.otherUserName}
          </span>
          <span
            className="text-2xs flex-shrink-0"
            style={{ color: conversation.unreadCount > 0 ? 'var(--primary)' : 'var(--muted-foreground)' }}
          >
            {timeLabel}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span
            className="text-xs truncate"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {conversation.lastMessage || 'Start a conversation'}
          </span>
          {conversation.unreadCount > 0 && (
            <span
              className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-2xs font-700"
              style={{
                background: 'var(--unread-badge)',
                color: 'var(--primary-foreground)',
                fontWeight: 700,
              }}
            >
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}