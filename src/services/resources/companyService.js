import { createResourceService } from '../apiService';

// Company API endpoints: POST /company/create, PATCH /company/update/{id}, etc.
export const companyService = createResourceService({
  list: '/company/view/all',
  detail: (id) => `/company/view/${id}`,
  create: '/company/create',
  update: (id) => `/company/update/${id}`,
  delete: (id) => `/company/delete/${id}`,
  updateMethod: 'PATCH',
});

