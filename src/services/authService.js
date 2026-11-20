import apiClient from './apiClient';

/**
 * Authentication Service
 *
 * FastAPI Backend endpoints:
 *   POST /auth/login   { login, password } -> { access_token, token_type, user }
 *   GET  /auth/me      -> current user
 */
export const authService = {
  login: (login, password) => apiClient.post('/auth/login', { login, password }),
  me: () => apiClient.get('/auth/me'),
};

export default authService;
