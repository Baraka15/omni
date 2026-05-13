// =====================================================
// SUPABASE CLIENT - REAL-TIME CONFIGURATION
// =====================================================

import { createBrowserClient } from '@supabase/ssr';
import { createClient as createServerClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client for client-side operations
export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey);

// Server client for API routes
export const createServerSideClient = () =>
  createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Get all cookies from headers
        if (typeof document === 'undefined') return [];
        return document.cookie
          .split('; ')
          .map((c) => {
            const [name, value] = c.split('=');
            return { name, value };
          });
      },
      setAll(cookiesToSet) {
        if (typeof document === 'undefined') return;
        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = `${name}=${value}; path=/; max-age=${options?.maxAge || 86400}`;
        });
      },
    },
  });

export type Database = any; // Import from generated types
