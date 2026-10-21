import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import apiClient, {
  setUnauthorizedHandler,
  setAuthStorage,
  clearAuthStorage,
  getActiveToken,
  getActiveUser,
} from '../api/client';

function rejectingAdapter(status) {
  return async (config) => {
    const err = new Error(`Request failed with status code ${status}`);
    err.config = config;
    err.isAxiosError = true;
    err.response = { status, statusText: String(status), data: { message: 'failed' }, headers: {}, config };
    throw err;
  };
}

describe('apiClient 401 handling', () => {
  beforeEach(() => {
    clearAuthStorage();
  });

  afterEach(() => {
    setUnauthorizedHandler(null);
    clearAuthStorage();
    delete apiClient.defaults.adapter;
  });

  it('clears storage and notifies the app on 401 when a token existed', async () => {
    setAuthStorage('stale-token', { name: 'Nada' }, true);
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    apiClient.defaults.adapter = rejectingAdapter(401);

    await expect(apiClient.get('/users/profile-data')).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(getActiveToken()).toBeNull();
    expect(getActiveUser()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not fire the unauthorized handler on non-401 errors', async () => {
    setAuthStorage('good-token', { name: 'Nada' }, true);
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    apiClient.defaults.adapter = rejectingAdapter(500);

    await expect(apiClient.get('/posts')).rejects.toBeTruthy();

    expect(getActiveToken()).toBe('good-token');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('does not fire the unauthorized handler on 401 when there was no token', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    apiClient.defaults.adapter = rejectingAdapter(401);

    await expect(apiClient.get('/posts')).rejects.toBeTruthy();

    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
