'use client';

import React, { useMemo } from 'react';
import { Search, Edit, Menu, LogOut, X } from 'lucide-react';
import { Conversation, UserInfo, OnlineStatus, MockUser } from '../types';
import ConversationItem from './ConversationItem';
import UserSearchResult from './UserSearchResult';

interface ChatSidebarProps {
  currentUser: UserInfo;
  conversations: Conversation[];
  selectedConversationId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectConversation: (id: string) => void;
  onStartNewChat: (userId: string) => void;
  onLogout: () => void;
  onlineStatuses: Record<string, OnlineStatus>;
  allUsers: MockUser[];
}

export default function ChatSidebar({
  currentUser,
  conversations,
  selectedConversationId,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  onStartNewChat,
  onLogout,
  onlineStatuses,
  allUsers,
}: ChatSidebarProps) {
  const isSearching = searchQuery.trim().length > 0;

  const filteredUsers = useMemo(() => {
    if (!isSearching) return [];
    const q = searchQuery.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.username !== currentUser.username &&
        (u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q))
    );
  }, [searchQuery, allUsers, currentUser.username, isSearching]);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }, [conversations]);

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', minHeight: '60px' }}
      >
        <div className="flex items-center gap-3">
          <button
            className="p-1.5 rounded-lg transition-colors hover:bg-hover-bg"
            style={{ color: 'var(--muted-foreground)' }}
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-lg font-700" style={{ color: 'var(--foreground)', fontWeight: 700 }}>
            Omni
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="p-1.5 rounded-lg transition-colors hover:bg-hover-bg"
            style={{ color: 'var(--primary)' }}
            aria-label="New conversation"
            title="New conversation"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg transition-colors hover:bg-hover-bg"
            style={{ color: 'var(--muted-foreground)' }}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2 flex-shrink-0">
        <div
          className="flex items-center gap-2 px-3 rounded-xl"
          style={{ background: 'var(--input)', border: '1px solid transparent', minHeight: '36px' }}
        >
          <Search size={15} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
          <input
            type="text"
            className="search-input"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search conversations or users"
          />
          {isSearching && (
            <button
              onClick={() => onSearchChange('')}
              className="p-0.5 rounded transition-colors flex-shrink-0"
              style={{ color: 'var(--muted-foreground)' }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isSearching ? (
          <div>
            <div className="px-4 py-2">
              <span className="text-xs font-500 uppercase tracking-wider" style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>
                People
              </span>
            </div>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <UserSearchResult
                  key={`search-${user.username}`}
                  user={user}
                  onlineStatus={onlineStatuses[user.username]}
                  onSelect={() => onStartNewChat(user.username)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <Search size={32} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                <p className="mt-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  No users found for &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            )}
          </div>
        ) : sortedConversations.length > 0 ? (
          sortedConversations.map((conv) => (
            <ConversationItem
              key={`conv-${conv.id}`}
              conversation={conv}
              isActive={conv.id === selectedConversationId}
              onlineStatus={onlineStatuses[conv.otherUserId]}
              onClick={() => onSelectConversation(conv.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--card)' }}
            >
              <Edit size={28} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
            </div>
            <p className="text-sm font-500" style={{ color: 'var(--foreground)', fontWeight: 500 }}>
              No conversations yet
            </p>
            <p className="text-xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
              Search for users to start chatting
            </p>
          </div>
        )}
      </div>

      {/* Current user footer */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--sidebar-bg)' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-700 flex-shrink-0 avatar-gradient-blue"
          style={{ color: 'white', fontWeight: 700 }}
        >
          {currentUser.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-500 truncate" style={{ color: 'var(--foreground)', fontWeight: 500 }}>
            {currentUser.displayName}
          </p>
          <p className="text-2xs truncate" style={{ color: 'var(--online-green)' }}>
            online
          </p>
        </div>
      </div>
    </div>
  );
}