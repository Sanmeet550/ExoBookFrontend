import { createResourceService } from '../apiService';

// Department API endpoints: GET /department/view/all, POST /department/create, PATCH /department/update/{id}, DELETE /department/delete/{id}
export const departmentService = createResourceService({
  list: '/department/view/all',
  detail: (id) => `/department/view/${id}`,
  create: '/department/create',
  update: (id) => `/department/update/${id}`,
  delete: (id) => `/department/delete/${id}`,
  updateMethod: 'PATCH',
});

