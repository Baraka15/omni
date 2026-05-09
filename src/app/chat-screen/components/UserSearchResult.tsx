'use client';

import React from 'react';
import { MockUser, OnlineStatus } from '../types';

interface UserSearchResultProps {
  user: MockUser;
  onlineStatus: OnlineStatus | undefined;
  onSelect: () => void;
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

export default function UserSearchResult({ user, onlineStatus, onSelect }: UserSearchResultProps) {
  const isOnline = onlineStatus?.isOnline ?? false;
  const gradientClass = AVATAR_GRADIENT_MAP[user.avatarColor] || 'avatar-gradient-blue';

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-3 transition-colors text-left"
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--hover-bg)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      aria-label={`Start chat with ${user.displayName}`}
    >
      <div className="relative flex-shrink-0">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-700 ${gradientClass}`}
          style={{ color: 'white', fontWeight: 700 }}
        >
          {user.displayName.charAt(0).toUpperCase()}
        </div>
        {isOnline && (
          <div
            className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2"
            style={{ background: 'var(--online-green)', borderColor: 'var(--sidebar-bg)' }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-600 truncate" style={{ color: 'var(--foreground)', fontWeight: 600 }}>
          {user.displayName}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
          @{user.username}
          {isOnline && (
            <span style={{ color: 'var(--online-green)' }}> · online</span>
          )}
        </p>
      </div>
    </button>
  );
}