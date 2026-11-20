import { createResourceService } from '../apiService';

// Partner/Contacts API endpoints: POST /partner/create, PATCH /partner/update/{id}, etc.
export const contactService = createResourceService({
  list: '/partner/view/all',
  detail: (id) => `/partner/view/${id}`,
  create: '/partner/create',
  update: (id) => `/partner/update/${id}`,
  delete: (id) => `/partner/delete/${id}`,
  updateMethod: 'PATCH',
});

