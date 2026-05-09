'use client';

import React from 'react';

interface TypingIndicatorProps {
  name: string;
}

export default function TypingIndicator({ name }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start fade-in">
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl rounded-bl-sm"
        style={{ background: 'var(--bubble-in)' }}
      >
        <div className="flex items-center gap-1">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {name} is typing
        </span>
      </div>
    </div>
  );
}