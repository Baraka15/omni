'use client';

import React from 'react';
import { Message } from '../types';
import { formatMessageTime } from '../utils';
import ReadReceipt from './ReadReceipt';

interface MessageBubbleProps {
  message: Message;
  isFirstInGroup: boolean;
}

export default function MessageBubble({ message, isFirstInGroup }: MessageBubbleProps) {
  const time = formatMessageTime(message.timestamp);

  if (message.isOwn) {
    return (
      <div
        className={`flex justify-end message-enter ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}
      >
        <div
          className="relative max-w-[70%] px-3 pt-2 pb-1.5 rounded-2xl rounded-br-sm bubble-tail-out"
          style={{ background: 'var(--bubble-out)' }}
        >
          <p
            className="text-sm leading-relaxed break-words whitespace-pre-wrap"
            style={{ color: 'var(--foreground)' }}
          >
            {message.text}
          </p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-2xs" style={{ color: 'rgba(232, 237, 242, 0.5)' }}>
              {time}
            </span>
            <ReadReceipt status={message.status} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex justify-start message-enter ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}
    >
      <div
        className="relative max-w-[70%] px-3 pt-2 pb-1.5 rounded-2xl rounded-bl-sm bubble-tail-in"
        style={{ background: 'var(--bubble-in)' }}
      >
        <p
          className="text-sm leading-relaxed break-words whitespace-pre-wrap"
          style={{ color: 'var(--foreground)' }}
        >
          {message.text}
        </p>
        <div className="flex items-center justify-end mt-1">
          <span className="text-2xs" style={{ color: 'rgba(232, 237, 242, 0.4)' }}>
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}