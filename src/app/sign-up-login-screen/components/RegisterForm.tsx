'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface RegisterFormData {
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({ mode: 'onBlur' });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setServerError(null);

    try {
      const email = `${data.username.toLowerCase()}@omni.app`;
      await signUp(email, data.password, {
        fullName: data.displayName,
        avatarUrl: '',
      });

      // Store user info for chat screen
      localStorage.setItem(
        'omni_user',
        JSON.stringify({ username: data.username.toLowerCase(), displayName: data.displayName })
      );

      setSuccess(true);
      toast.success(`Account created! Welcome, ${data.displayName}`);

      await new Promise((r) => setTimeout(r, 600));
      onSuccess();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setServerError('Username already exists — please choose a different username');
      } else {
        setServerError(msg || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CheckCircle2 size={48} style={{ color: 'var(--online-green)' }} />
        <p className="text-sm font-500" style={{ color: 'var(--foreground)', fontWeight: 500 }}>Account created!</p>
        <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>Redirecting you to Omni...</p>
      </div>
    );
  }

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
        <label className="text-xs tracking-wide" style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>
          Username
        </label>
        <input
          {...register('username', {
            required: 'Username is required',
            minLength: { value: 3, message: 'At least 3 characters' },
            maxLength: { value: 24, message: 'Maximum 24 characters' },
            pattern: { value: /^[a-z0-9_]+$/, message: 'Only lowercase letters, numbers, and underscores' },
          })}
          className={`auth-input ${errors.username ? 'error' : ''}`}
          placeholder="choose a username"
          autoCapitalize="none"
          onChange={(e) => {
            e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
            register('username').onChange(e);
          }}
        />
        <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
          Lowercase letters, numbers, underscores only
        </p>
        {errors.username && (
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.username.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs tracking-wide" style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>
          Display Name
        </label>
        <input
          {...register('displayName', {
            required: 'Display name is required',
            minLength: { value: 2, message: 'At least 2 characters' },
            maxLength: { value: 40, message: 'Maximum 40 characters' },
          })}
          className={`auth-input ${errors.displayName ? 'error' : ''}`}
          placeholder="Your full name"
          autoComplete="name"
        />
        {errors.displayName && (
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.displayName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs tracking-wide" style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>
          Password
        </label>
        <div className="relative">
          <input
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'At least 8 characters' },
              pattern: {
                value: /^(?=.*[A-Za-z])(?=.*\d)/,
                message: 'Must contain at least one letter and one number',
              },
            })}
            type={showPassword ? 'text' : 'password'}
            className={`auth-input pr-11 ${errors.password ? 'error' : ''}`}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
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

      <div className="flex flex-col gap-1.5">
        <label className="text-xs tracking-wide" style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>
          Confirm Password
        </label>
        <div className="relative">
          <input
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (val) => val === password || 'Passwords do not match',
            })}
            type={showConfirm ? 'text' : 'password'}
            className={`auth-input pr-11 ${errors.confirmPassword ? 'error' : ''}`}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
            style={{ color: 'var(--muted-foreground)' }}
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.confirmPassword.message}</p>
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
            <span>Creating account...</span>
          </>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
}