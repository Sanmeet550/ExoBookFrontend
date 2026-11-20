import { createResourceService } from '../apiService';

// Currency API endpoints: POST /currency/create, PATCH /currency/update/{id}, etc.
export const currencyService = createResourceService({
  list: '/currency/view/all',
  detail: (id) => `/currency/view/${id}`,
  create: '/currency/create',
  update: (id) => `/currency/update/${id}`,
  delete: (id) => `/currency/delete/${id}`,
  updateMethod: 'PATCH',
});

