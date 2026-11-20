import { createResourceService } from '../apiService';

// Warehouse API endpoints: GET /warehouse/view/all, POST /warehouse/create, PATCH /warehouse/update/{id}, DELETE /warehouse/delete/{id}
export const warehouseService = createResourceService({
  list: '/warehouse/view/all',
  detail: (id) => `/warehouse/view/${id}`,
  create: '/warehouse/create',
  update: (id) => `/warehouse/update/${id}`,
  delete: (id) => `/warehouse/delete/${id}`,
  updateMethod: 'PATCH',
});

