/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { EnvironmentValidator } from '../EnvironmentValidator';

const originalEnv = { ...process.env } as any;

describe('EnvironmentValidator', () => {
  beforeEach(() => {
    process.env = { ...originalEnv } as any;
  });

  it('shows missing alerts when required envs are absent', () => {
    process.env.VITE_GROQ_API_KEY = '' as any;
    process.env.VITE_SUPABASE_URL = '' as any;
    process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY = '' as any;
    process.env.VITE_CLERK_PUBLISHABLE_KEY = '' as any;

    render(<EnvironmentValidator />);

    expect(screen.getByText(/Configuration Required/i)).toBeInTheDocument();
    expect(screen.getByText(/Story generation will not work/)).toBeInTheDocument();
  });

  it('flags invalid format for Groq and shows invalid alert', () => {
    process.env.VITE_GROQ_API_KEY = 'bad' as any;
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co' as any;
    process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'anon' as any;
    process.env.VITE_CLERK_PUBLISHABLE_KEY = 'pk_test_abc' as any;

    render(<EnvironmentValidator />);

    expect(screen.getByText(/Invalid Configuration/i)).toBeInTheDocument();
  });

  it('shows configuration complete when all valid', () => {
    process.env.VITE_GROQ_API_KEY = 'gsk_abc' as any;
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co' as any;
    process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'anon' as any;
    process.env.VITE_CLERK_PUBLISHABLE_KEY = 'pk_abc' as any;

    render(<EnvironmentValidator />);
    expect(screen.getByText(/Configuration Complete/i)).toBeInTheDocument();
  });

  it('refresh button triggers revalidation', () => {
    process.env.VITE_GROQ_API_KEY = 'gsk_abc' as any;
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co' as any;
    process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'anon' as any;
    process.env.VITE_CLERK_PUBLISHABLE_KEY = 'pk_abc' as any;

    render(<EnvironmentValidator />);
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(screen.getByText(/Configuration Complete/i)).toBeInTheDocument();
  });
});

