import { createResourceService } from '../apiService';

// State API endpoints: GET /state/view/all, POST /state/create, PATCH /state/update/{id}, DELETE /state/delete/{id}
export const stateService = createResourceService({
  list: '/state/view/all',
  detail: (id) => `/state/view/${id}`,
  create: '/state/create',
  update: (id) => `/state/update/${id}`,
  delete: (id) => `/state/delete/${id}`,
  updateMethod: 'PATCH',
});

