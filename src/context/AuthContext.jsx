import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { ACCESS_TOKEN_STORAGE_KEY, UNAUTHORIZED_EVENT } from '../services/apiClient';
import { relationCacheService } from '../services/relationCacheService';
import { searchService } from '../services/searchService';

const AuthContext = createContext(null);

/**
 * AuthProvider
 *
 * Holds the signed-in user. Every backend API requires one, so the app is only shown after sign-in.
 * The access token is kept in localStorage and attached to backend requests by apiClient.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(() => Boolean(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)));

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    relationCacheService.clear(); // dropdown data loaded for the previous user
    searchService.clear();
    setUser(null);
  }, []);

  // Restore the session from a stored token (an expired or revoked token leads to the login page).
  useEffect(() => {
    if (!localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)) return undefined;
    let isMounted = true;
    authService
      .me()
      .then((current) => isMounted && setUser(current))
      .catch(() => isMounted && logout())
      .finally(() => isMounted && setChecking(false));
    return () => {
      isMounted = false;
    };
  }, [logout]);

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  const login = useCallback(async (loginName, password) => {
    const result = await authService.login(loginName, password);
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, result.access_token);
    setUser(result.user);
    return result.user;
  }, []);

  const value = useMemo(() => ({ user, checking, login, logout }), [user, checking, login, logout]);

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
