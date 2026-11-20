import { createResourceService } from '../apiService';

// Employee API endpoints: GET /employee/view/all, POST /employee/create, PATCH /employee/update/{id}, DELETE /employee/delete/{id}
export const employeeService = createResourceService({
  list: '/employee/view/all',
  detail: (id) => `/employee/view/${id}`,
  create: '/employee/create',
  update: (id) => `/employee/update/${id}`,
  delete: (id) => `/employee/delete/${id}`,
  updateMethod: 'PATCH',
});

