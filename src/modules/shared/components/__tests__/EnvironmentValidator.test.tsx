import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { act, render, screen } from '@/test/test-utils';
import { EnvironmentValidator } from '../EnvironmentValidator';

const envValues = new Map<string, string | undefined>();

vi.mock('@/modules/shared/utils/env', () => ({
  getEnvVar: (key: string) => envValues.get(key),
}));

describe('EnvironmentValidator', () => {
  beforeEach(() => {
    envValues.clear();
  });

  it('shows missing alerts when required envs are absent', () => {
    envValues.set('VITE_GROQ_API_KEY', undefined);
    envValues.set('VITE_SUPABASE_URL', undefined);
    envValues.set('VITE_SUPABASE_PUBLISHABLE_KEY', undefined);

    render(<EnvironmentValidator />);

    expect(screen.getByText(/Configuration Required/i)).toBeInTheDocument();
    expect(screen.getByText(/Story generation will not work/i)).toBeInTheDocument();
  });

  it('flags invalid configurations when keys have wrong format', () => {
    envValues.set('VITE_GROQ_API_KEY', 'invalid');
    envValues.set('VITE_SUPABASE_URL', 'http://example.com');
    envValues.set('VITE_SUPABASE_PUBLISHABLE_KEY', 'anon');

    render(<EnvironmentValidator />);

    expect(screen.getByText(/Invalid Configuration/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Invalid Format/i).length).toBeGreaterThan(0);
  });

  it('confirms configuration when all values are valid', () => {
    envValues.set('VITE_GROQ_API_KEY', 'gsk_valid');
    envValues.set('VITE_SUPABASE_URL', 'https://example.supabase.co');
    envValues.set('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key');
    envValues.set('VITE_OPENAI_API_KEY', 'sk_test');

    render(<EnvironmentValidator />);

    expect(screen.getByText(/Configuration Complete/i)).toBeInTheDocument();
    expect(screen.queryByText(/Configuration Required/i)).not.toBeInTheDocument();
  });

  it('revalidates configuration when refresh is clicked', async () => {
    const user = userEvent.setup();

    envValues.set('VITE_SUPABASE_URL', 'https://example.supabase.co');
    envValues.set('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key');

    render(<EnvironmentValidator />);
    expect(screen.getByText(/Configuration Complete/i)).toBeInTheDocument();

    // Remove a required key to trigger invalid config
    envValues.delete('VITE_SUPABASE_URL');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /refresh/i }));
    });

    expect(screen.getByText(/Configuration Required/i)).toBeInTheDocument();
  });
});

