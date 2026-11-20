import { createResourceService } from '../apiService';

// Country API endpoints: GET /country/view/all, POST /country/create, PATCH /country/update/{id}, DELETE /country/delete/{id}
export const countryService = createResourceService({
  list: '/country/view/all',
  detail: (id) => `/country/view/${id}`,
  create: '/country/create',
  update: (id) => `/country/update/${id}`,
  delete: (id) => `/country/delete/${id}`,
  updateMethod: 'PATCH',
});

