'use client';

import React from 'react';
import { formatDateSeparator } from '../utils';

interface DateSeparatorProps {
  timestamp: string;
}

export default function DateSeparator({ timestamp }: DateSeparatorProps) {
  const label = formatDateSeparator(timestamp);

  return (
    <div className="flex items-center justify-center my-4">
      <span
        className="px-3 py-1 rounded-full text-xs"
        style={{
          background: 'rgba(30, 44, 58, 0.85)',
          color: 'var(--muted-foreground)',
          backdropFilter: 'blur(4px)',
          border: '1px solid var(--border)',
        }}
      >
        {label}
      </span>
    </div>
  );
}