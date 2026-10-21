import axios from 'axios';

export const API_BASE_URL = 'https://route-posts.routemisr.com';
export const TOKEN_STORAGE_KEY = 'route_auth_token';
export const USER_STORAGE_KEY = 'route_auth_user';
export const REMEMBER_ME_KEY = 'route_remember_me';

/**
 * @returns {string|null}
 */
export function getActiveToken() {
  try {
    const local = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (local && typeof local === 'string' && local.trim().length > 0) {
      return local.trim();
    }
    const session = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (session && typeof session === 'string' && session.trim().length > 0) {
      return session.trim();
    }
  } catch {
  }
  return null;
}

/**
 * @returns {object|null}
 */
export function getActiveUser() {
  try {
    const rawLocal = localStorage.getItem(USER_STORAGE_KEY);
    if (rawLocal) return JSON.parse(rawLocal);
    const rawSession = sessionStorage.getItem(USER_STORAGE_KEY);
    if (rawSession) return JSON.parse(rawSession);
  } catch {
  }
  return null;
}

/**
 * @param {string} token
 * @param {object|null} user
 * @param {boolean} [rememberMe=true]
 */
export function setAuthStorage(token, user, rememberMe = true) {
  try {
    if (rememberMe) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
      if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(USER_STORAGE_KEY);
    } else {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      sessionStorage.setItem(REMEMBER_ME_KEY, 'false');
      if (user) sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  } catch {
  }
}


export function clearAuthStorage() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
  } catch {}
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(REMEMBER_ME_KEY);
  } catch {}
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
  timeout: 20000,
});

apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = getActiveToken();
      if (token && typeof token === 'string' && token.trim().length > 0) {
        config.headers.Authorization = `Bearer ${token.trim()}`;
      }
    } catch {
    }

    if (config.data && !(config.data instanceof FormData) && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success === false) {
      const errorMsg = normalizeErrorMessage(response.data);
      const customError = new Error(errorMsg);
      customError.response = response;
      return Promise.reject(customError);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      clearAuthStorage();
    }

    const formattedMessage = normalizeErrorMessage(error.response?.data || error);
    error.friendlyMessage = formattedMessage;
    return Promise.reject(error);
  }
);

/**
 * @param {object|string} data
 * @returns {string}
 */
export function normalizeErrorMessage(data) {
  if (!data) return 'An unexpected error occurred. Please try again.';

  if (typeof data === 'string') return data;

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.join('. ');
  }

  if (typeof data.errors === 'string' && data.errors.trim().length > 0) {
    return data.errors;
  }

  if (typeof data.errors === 'object' && data.errors !== null) {
    const errorVals = Object.values(data.errors).flat().filter(Boolean);
    if (errorVals.length > 0) return errorVals.join('. ');
  }

  if (data.message && typeof data.message === 'string') {
    return data.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

export default apiClient;
