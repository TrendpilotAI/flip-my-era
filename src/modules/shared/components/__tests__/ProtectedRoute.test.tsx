/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';

// ── vi.hoisted() – mock values declared before vi.mock() factories ──
const mocks = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
  user: null as any,
}));

vi.mock('@/modules/auth/contexts', () => ({
  useClerkAuth: () => ({
    isAuthenticated: mocks.isAuthenticated,
    isLoading: mocks.isLoading,
    user: mocks.user,
  }),
}));

function renderProtectedRoute(
  requiredSubscription?: 'free' | 'basic' | 'premium',
  initialRoute = '/protected',
) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute requiredSubscription={requiredSubscription}>
              <div data-testid="protected-content">Secret Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/auth" element={<div data-testid="auth-page">Auth Page</div>} />
        <Route path="/upgrade" element={<div data-testid="upgrade-page">Upgrade Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mocks.isAuthenticated = false;
    mocks.isLoading = false;
    mocks.user = null;
  });

  it('shows loading spinner while auth is loading', () => {
    mocks.isLoading = true;
    renderProtectedRoute();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects to /auth when not authenticated', () => {
    mocks.isAuthenticated = false;
    renderProtectedRoute();

    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    mocks.isAuthenticated = true;
    mocks.user = { id: '1', email: 'a@b.com', subscription_status: 'free' };
    renderProtectedRoute();

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('redirects to /upgrade when subscription level is insufficient', () => {
    mocks.isAuthenticated = true;
    mocks.user = { id: '1', email: 'a@b.com', subscription_status: 'free' };
    renderProtectedRoute('premium');

    expect(screen.getByTestId('upgrade-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children when subscription level is sufficient', () => {
    mocks.isAuthenticated = true;
    mocks.user = { id: '1', email: 'a@b.com', subscription_status: 'premium' };
    renderProtectedRoute('basic');

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders children when no subscription requirement is set', () => {
    mocks.isAuthenticated = true;
    mocks.user = { id: '1', email: 'a@b.com', subscription_status: 'free' };
    renderProtectedRoute();

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('basic user can access basic-required routes', () => {
    mocks.isAuthenticated = true;
    mocks.user = { id: '1', email: 'a@b.com', subscription_status: 'basic' };
    renderProtectedRoute('basic');

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('basic user cannot access premium-required routes', () => {
    mocks.isAuthenticated = true;
    mocks.user = { id: '1', email: 'a@b.com', subscription_status: 'basic' };
    renderProtectedRoute('premium');

    expect(screen.getByTestId('upgrade-page')).toBeInTheDocument();
  });
});
