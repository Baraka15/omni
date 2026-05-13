'use client';

import React, { useState } from 'react';
import { Copy, Check, Users } from 'lucide-react';
import { toast } from 'sonner';

interface DemoCredentialsProps {
  mode: 'login' | 'register';
}

const DEMO_ACCOUNTS = [
  { role: 'User A', username: 'alexchen', password: 'omni2026!', displayName: 'Alex Chen' },
  { role: 'User B', username: 'sarahkim', password: 'omni2026!', displayName: 'Sarah Kim' },
  { role: 'User C', username: 'marcuslee', password: 'omni2026!', displayName: 'Marcus Lee' },
];

export default function DemoCredentials({ mode }: DemoCredentialsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (mode === 'register') return null;

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldKey);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleUse = (account: typeof DEMO_ACCOUNTS[0]) => {
    // BACKEND INTEGRATION: autofill is purely client-side; no API needed
    const setVal = (window as unknown as Record<string, any>).__loginSetValue;
    
    if (typeof setVal === 'function') {
      setVal('username', account.username);
      setVal('password', account.password);
      toast.success(`Filled in ${account.displayName}'s credentials`);
    } else {
      toast.error('Login form not ready');
    }
  };

  return (
    <div
      className="mt-5 rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ background: 'var(--input)' }}
      >
        <Users size={13} style={{ color: 'var(--muted-foreground)' }} />
        <span className="text-xs font-500" style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>
          Demo Accounts
        </span>
      </div>

      <div style={{ background: 'var(--secondary)' }}>
        {DEMO_ACCOUNTS.map((account) => (
          <div
            key={`demo-${account.username}`}
            className="flex items-center gap-3 px-3 py-2.5 transition-colors"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-700"
              style={{
                background: account.username === 'alexchen' ? 'var(--primary)'
                  : account.username === 'sarahkim' ? '#8B5CF6' : '#10B981',
                color: 'white',
                fontWeight: 700,
              }}
            >
              {account.displayName.charAt(0)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-500 truncate" style={{ color: 'var(--foreground)', fontWeight: 500 }}>
                {account.displayName}
              </p>
              <p className="text-2xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                @{account.username} · {account.password}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => handleCopy(account.password, `pwd-${account.username}`)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
                title="Copy password"
              >
                {copiedField === `pwd-${account.username}` ? (
                  <Check size={12} style={{ color: 'var(--online-green)' }} />
                ) : (
                  <Copy size={12} />
                )}
              </button>
              <button
                onClick={() => handleUse(account)}
                className="px-2 py-1 rounded-lg text-2xs font-500 transition-colors"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  fontWeight: 500,
                }}
              >
                Use
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
