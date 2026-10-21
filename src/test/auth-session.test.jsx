import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import apiClient, { setAuthStorage, clearAuthStorage, getActiveToken } from '../api/client';

function rejectingAdapter(makeError) {
  return async (config) => {
    const err = makeError(config);
    err.config = config;
    err.isAxiosError = true;
    throw err;
  };
}

function AuthProbe() {
  const { isAuthenticated, isLoading, user } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authed">{String(isAuthenticated)}</span>
      <span data-testid="username">{user?.name || 'none'}</span>
    </div>
  );
}

describe('AuthContext session restore', () => {
  afterEach(() => {
    clearAuthStorage();
    delete apiClient.defaults.adapter;
  });

  it('fully ends the session when the stored token is rejected (401)', async () => {
    setAuthStorage('stale-token', { name: 'Nada' }, true);
    apiClient.defaults.adapter = rejectingAdapter((config) => {
      const err = new Error('Request failed with status code 401');
      err.response = { status: 401, data: { message: 'unauthorized' }, headers: {}, config };
      return err;
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('authed')).toHaveTextContent('false');
    expect(screen.getByTestId('username')).toHaveTextContent('none');
    expect(getActiveToken()).toBeNull();
  });

  it('keeps the cached session on a network failure (offline grace)', async () => {
    setAuthStorage('offline-token', { name: 'Nada' }, true);
    apiClient.defaults.adapter = rejectingAdapter(() => new Error('Network Error'));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('authed')).toHaveTextContent('true');
    expect(screen.getByTestId('username')).toHaveTextContent('Nada');
  });
});
