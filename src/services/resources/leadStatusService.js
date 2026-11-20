import { createResourceService } from '../apiService';

/**
 * Lead Status / Stage Resource Service
 *
 * FastAPI Backend endpoints:
 *   GET    /lead_status/view/all
 *   GET    /lead_status/view/{status_id}
 *   POST   /lead_status/create
 *   PATCH  /lead_status/update/{status_id}
 *   DELETE /lead_status/delete/{status_id}
 */
export const leadStatusService = createResourceService({
  list: '/lead_status/view/all',
  detail: (id) => `/lead_status/view/${id}`,
  create: '/lead_status/create',
  update: (id) => `/lead_status/update/${id}`,
  delete: (id) => `/lead_status/delete/${id}`,
  updateMethod: 'PATCH',
});

export default leadStatusService;
