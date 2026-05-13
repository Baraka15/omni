'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({ mode: 'onBlur' });

  // Expose setValue for demo credential autofill (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, any>).__loginSetValue = setValue;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as unknown as Record<string, any>).__loginSetValue;
      }
    };
  }, [setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setServerError(null);

    try {
      const email = `${data.username.toLowerCase()}@omni.app`;
      await signIn(email, data.password);
      toast.success('Welcome back!');
      onSuccess();
    } catch (err: any) {
      const msg = err?.message || '';
      if (
        msg.toLowerCase().includes('invalid login') ||
        msg.toLowerCase().includes('invalid credentials') ||
        msg.toLowerCase().includes('email not confirmed') ||
        msg.toLowerCase().includes('wrong password')
      ) {
        setServerError('Invalid username or password');
      } else {
        setServerError(msg || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {serverError && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)' }}
        >
          {serverError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-500 tracking-wide" style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>
          Username
        </label>
        <input
          {...register('username', {
            required: 'Username is required',
            minLength: { value: 3, message: 'Username must be at least 3 characters' },
          })}
          className={`auth-input ${errors.username ? 'error' : ''}`}
          placeholder="your username"
          autoComplete="username"
          autoCapitalize="none"
          onChange={(e) => {
            e.target.value = e.target.value.toLowerCase();
            register('username').onChange(e);
          }}
        />
        {errors.username && (
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.username.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-500 tracking-wide" style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>
          Password
        </label>
        <div className="relative">
          <input
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' },
            })}
            type={showPassword ? 'text' : 'password'}
            className={`auth-input pr-11 ${errors.password ? 'error' : ''}`}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary mt-1"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}
