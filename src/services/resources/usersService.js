import { createResourceService } from '../apiService';

import apiClient from '../apiClient';

// Users API endpoints: GET /view/users, POST /create/users, PATCH /update/users/{id}, DELETE /delete/users/{id}
// Password: POST /set_password/users/{id}  { password, password_confirmation }  (stored as a bcrypt hash)
const baseUsersService = createResourceService({
  list: '/view/users',
  detail: (id) => `/view/users/${id}`,
  create: '/create/users',
  update: (id) => `/update/users/${id}`,
  delete: (id) => `/delete/users/${id}`,
  updateMethod: 'PATCH',
});

export const usersService = {
  ...baseUsersService,
  setPassword: (id, values) => apiClient.post(`/set_password/users/${id}`, values),
};

