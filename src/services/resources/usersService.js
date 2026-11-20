import { createResourceService } from '../apiService';

// Users API endpoints: GET /view/users, POST /create/users, PATCH /update/users/{id}, DELETE /delete/users/{id}
export const usersService = createResourceService({
  list: '/view/users',
  detail: (id) => `/view/users/${id}`,
  create: '/create/users',
  update: (id) => `/update/users/${id}`,
  delete: (id) => `/delete/users/${id}`,
  updateMethod: 'PATCH',
});

