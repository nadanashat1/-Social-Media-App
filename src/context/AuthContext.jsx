import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/auth.api';
import usersApi from '../api/users.api';
import {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  REMEMBER_ME_KEY,
  getActiveToken,
  getActiveUser,
  setAuthStorage,
  clearAuthStorage,
} from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getActiveToken());
  const [user, setUser] = useState(() => getActiveUser());

  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('route_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('route_theme', theme);
    } catch {
      
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const updateToken = useCallback((newToken) => {
    if (typeof newToken === 'string' && newToken.trim().length > 0) {
      const cleanToken = newToken.trim();
      setToken(cleanToken);
      try {
        const isRemember =
          localStorage.getItem(REMEMBER_ME_KEY) === 'true' ||
          localStorage.getItem(TOKEN_STORAGE_KEY) !== null;
        if (isRemember) {
          localStorage.setItem(TOKEN_STORAGE_KEY, cleanToken);
        } else {
          sessionStorage.setItem(TOKEN_STORAGE_KEY, cleanToken);
        }
      } catch {
      }
    }
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...updatedUserData };
      try {
        const isRemember =
          localStorage.getItem(REMEMBER_ME_KEY) === 'true' ||
          localStorage.getItem(TOKEN_STORAGE_KEY) !== null;
        const serialized = JSON.stringify(next);
        if (isRemember) {
          localStorage.setItem(USER_STORAGE_KEY, serialized);
        } else {
          sessionStorage.setItem(USER_STORAGE_KEY, serialized);
        }
      } catch {
        
      }
      return next;
    });
  }, []);

  
  const logout = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
  }, []);

  
  const refreshProfile = useCallback(async () => {
    try {
      const res = await usersApi.getProfileData();
      if (res && res.data && res.data.user) {
        const profileUser = res.data.user;
        setUser(profileUser);
        try {
          const isRemember =
            localStorage.getItem(REMEMBER_ME_KEY) === 'true' ||
            localStorage.getItem(TOKEN_STORAGE_KEY) !== null;
          const serialized = JSON.stringify(profileUser);
          if (isRemember) {
            localStorage.setItem(USER_STORAGE_KEY, serialized);
          } else {
            sessionStorage.setItem(USER_STORAGE_KEY, serialized);
          }
        } catch {
          
        }
        return profileUser;
      }
    } catch (err) {
     
      if (err.response?.status === 401) {
        logout();
      }
      throw err;
    }
  }, [logout]);

  useEffect(() => {
    let isMounted = true;
    async function initSession() {
      const storedToken = getActiveToken();
      if (storedToken && storedToken.trim().length > 0) {
        try {
          const res = await usersApi.getProfileData();
          if (isMounted && res && res.data && res.data.user) {
            setUser(res.data.user);
            const isRemember =
              localStorage.getItem(REMEMBER_ME_KEY) === 'true' ||
              localStorage.getItem(TOKEN_STORAGE_KEY) !== null;
            const serialized = JSON.stringify(res.data.user);
            if (isRemember) {
              localStorage.setItem(USER_STORAGE_KEY, serialized);
            } else {
              sessionStorage.setItem(USER_STORAGE_KEY, serialized);
            }
          }
        } catch {
          if (isMounted) {
           
            try {
              const savedUser = getActiveUser();
              if (savedUser) setUser(savedUser);
            } catch {
             
            }
          }
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  
  const login = useCallback(
    async (credentials) => {
     
      let payload = { password: credentials.password };
      const id = credentials.identifier ? credentials.identifier.trim() : '';

      if (id.includes('@')) {
        payload.email = id;
      } else {
        payload.login = id;
      }

      const res = await authApi.signin(payload);

     
      const extractedToken = res?.data?.token || res?.token;
      if (!extractedToken || typeof extractedToken !== 'string') {
        throw new Error('No authentication token returned by the server.');
      }

      const remember = credentials.rememberMe ?? true;
      const initialUser = res?.data?.user || null;

      
      setAuthStorage(extractedToken, initialUser, remember);
      setToken(extractedToken);
      if (initialUser) setUser(initialUser);

     
      try {
        const profileRes = await usersApi.getProfileData();
        if (profileRes?.data?.user) {
          const freshUser = profileRes.data.user;
          setUser(freshUser);
          setAuthStorage(extractedToken, freshUser, remember);
        }
      } catch {
       
      }

      return res;
    },
    []
  );

 
  const signup = useCallback(
    async (formData) => {
      const res = await authApi.signup(formData);

      
      const extractedToken = res?.data?.token || res?.token;
      if (extractedToken && typeof extractedToken === 'string') {
        const signupUser = res?.data?.user || null;
        setAuthStorage(extractedToken, signupUser, true);
        setToken(extractedToken);
        if (signupUser) setUser(signupUser);
      }

      return res;
    },
    []
  );

  
  const changePassword = useCallback(
    async ({ password, newPassword }) => {
      const res = await authApi.changePassword({ password, newPassword });

     
      const refreshedToken = res?.data?.token || res?.token;
      if (refreshedToken && typeof refreshedToken === 'string') {
        updateToken(refreshedToken);
      }

      return res;
    },
    [updateToken]
  );

  const uploadPhoto = useCallback(
    async (file) => {
      const res = await usersApi.uploadPhoto(file);

     
      if (res?.data?.photo) {
        updateUser({ photo: res.data.photo });
      } else if (res?.data?.user?.photo) {
        updateUser({ photo: res.data.user.photo });
      } else {
        await refreshProfile();
      }

      return res;
    },
    [updateUser, refreshProfile]
  );

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    isLoading,
    theme,
    toggleTheme,
    login,
    signup,
    changePassword,
    uploadPhoto,
    logout,
    refreshProfile,
    updateToken,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
