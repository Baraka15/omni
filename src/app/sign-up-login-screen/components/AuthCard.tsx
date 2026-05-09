'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import DemoCredentials from './DemoCredentials';

type AuthMode = 'login' | 'register';

export default function AuthCard() {
  const [mode, setMode] = useState<AuthMode>('login');
  const router = useRouter();
  const { session } = useAuth();

  const handleAuthSuccess = () => {
    router.push('/chat-screen');
  };

  return (
    <div
      className="rounded-2xl p-6 auth-card-shadow"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Mode toggle */}
      <div
        className="flex rounded-xl p-1 mb-6"
        style={{ background: 'var(--input)' }}
      >
        <button
          onClick={() => setMode('login')}
          className="flex-1 py-2 text-sm font-600 rounded-lg transition-all duration-200"
          style={{
            background: mode === 'login' ? 'var(--primary)' : 'transparent',
            color: mode === 'login' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
            fontWeight: mode === 'login' ? 600 : 400,
          }}
        >
          Sign In
        </button>
        <button
          onClick={() => setMode('register')}
          className="flex-1 py-2 text-sm rounded-lg transition-all duration-200"
          style={{
            background: mode === 'register' ? 'var(--primary)' : 'transparent',
            color: mode === 'register' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
            fontWeight: mode === 'register' ? 600 : 400,
          }}
        >
          Register
        </button>
      </div>

      {/* Form */}
      <div className="fade-in" key={mode}>
        {mode === 'login' ? (
          <LoginForm onSuccess={handleAuthSuccess} />
        ) : (
          <RegisterForm onSuccess={handleAuthSuccess} onSwitchToLogin={() => setMode('login')} />
        )}
      </div>

      {/* Demo credentials */}
      <DemoCredentials mode={mode} />
    </div>
  );
}