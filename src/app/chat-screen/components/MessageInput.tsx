'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Paperclip, Mic, Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  conversationId: string;
}

export default function MessageInput({ onSendMessage, conversationId }: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Reset text when conversation changes
  useEffect(() => {
    setText('');
    textareaRef.current?.focus();
  }, [conversationId]);

  const adjustTextareaHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, []);

  const emitTypingStart = useCallback(() => {
    // BACKEND INTEGRATION: Emit 'typing_start' WebSocket event
    if (!isTypingRef.current) {
      isTypingRef.current = true;
    }
  }, []);

  const emitTypingStop = useCallback(() => {
    // BACKEND INTEGRATION: Emit 'typing_stop' WebSocket event
    isTypingRef.current = false;
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      adjustTextareaHeight();

      emitTypingStart();

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        emitTypingStop();
      }, 1500);
    },
    [adjustTextareaHeight, emitTypingStart, emitTypingStop]
  );

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    emitTypingStop();
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, [text, onSendMessage, emitTypingStop]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const hasText = text.trim().length > 0;

  return (
    <div
      className="flex items-end gap-3 px-4 py-3"
      style={{
        background: 'var(--topbar-bg)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {/* Attach */}
      <button
        className="p-2 rounded-full flex-shrink-0 transition-colors mb-0.5"
        style={{ color: 'var(--muted-foreground)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
        aria-label="Attach file"
      >
        <Paperclip size={20} />
      </button>

      {/* Input container */}
      <div
        className="flex-1 flex items-end rounded-2xl px-4 py-2"
        style={{ background: 'var(--input-bg)' }}
      >
        <textarea
          ref={textareaRef}
          className="message-input"
          placeholder="Message"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="Type a message"
        />
      </div>

      {/* Send / Mic */}
      <button
        onClick={hasText ? handleSend : undefined}
       
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150 mb-0.5"
        style={{
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          transform: 'scale(1)',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary-dark)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary)'; }}
        onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)'; }}
        onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        aria-label={hasText ? 'Send message' : 'Voice message'}
      >
        {hasText ? <Send size={18} /> : <Mic size={18} />}
      </button>
    </div>
  );
}