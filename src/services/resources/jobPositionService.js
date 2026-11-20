import { createResourceService } from '../apiService';

// Job Position API endpoints: GET /job_position/view/all, POST /job_position/create, PATCH /job_position/update/{id}, DELETE /job_position/delete/{id}
export const jobPositionService = createResourceService({
  list: '/job_position/view/all',
  detail: (id) => `/job_position/view/${id}`,
  create: '/job_position/create',
  update: (id) => `/job_position/update/${id}`,
  delete: (id) => `/job_position/delete/${id}`,
  updateMethod: 'PATCH',
});

