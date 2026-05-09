'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthCard from './AuthCard';

export default function AuthScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      router.replace('/chat-screen');
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <OmniLogoMark size={28} />
          </div>
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
        </div>
      </div>
    );
  }

  if (session) return null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'var(--background)' }}
    >
      {/* Background gradient blobs */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-10 blur-[120px]"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[300px] opacity-5 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
        />
      </div>

      {/* Brand header */}
      <div className="flex flex-col items-center gap-3 mb-8 relative z-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}
        >
          <OmniLogoMark size={36} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Omni
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Fast. Private. Always connected.
          </p>
        </div>
      </div>

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-sm">
        <AuthCard />
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
        By continuing, you agree to our{' '}
        <span className="cursor-pointer hover:underline" style={{ color: 'var(--primary)' }}>Terms</span>
        {' '}and{' '}
        <span className="cursor-pointer hover:underline" style={{ color: 'var(--primary)' }}>Privacy Policy</span>
      </p>
    </div>
  );
}

function OmniLogoMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="24" height="18" rx="5" fill="white" fillOpacity="0.95" />
      <rect x="9" y="13" width="18" height="14" rx="4" fill="white" fillOpacity="0.6" />
      <circle cx="10" cy="14" r="2" fill="white" fillOpacity="0.3" />
    </svg>
  );
}