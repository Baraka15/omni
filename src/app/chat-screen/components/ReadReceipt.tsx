'use client';

import React from 'react';

interface ReadReceiptProps {
  status: 'sent' | 'delivered' | 'read';
}

export default function ReadReceipt({ status }: ReadReceiptProps) {
  const color = status === 'read' ? 'var(--tick-blue)' : 'var(--tick-gray)';

  if (status === 'sent') {
    // Single tick
    return (
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-label="Sent">
        <path
          d="M1 5L4.5 8.5L13 1"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Double tick for delivered and read
  return (
    <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-label={status === 'read' ? 'Read' : 'Delivered'}>
      <path
        d="M1 5L4.5 8.5L13 1"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 5L8.5 8.5L17 1"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}