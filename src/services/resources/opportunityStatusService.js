import { createResourceService } from '../apiService';

/**
 * Opportunity Status / Stage Resource Service
 *
 * FastAPI Backend endpoints:
 *   GET    /opportunity_status/view/all
 *   GET    /opportunity_status/view/{status_id}
 *   POST   /opportunity_status/create
 *   PATCH  /opportunity_status/update/{status_id}
 *   DELETE /opportunity_status/delete/{status_id}
 */
export const opportunityStatusService = createResourceService({
  list: '/opportunity_status/view/all',
  detail: (id) => `/opportunity_status/view/${id}`,
  create: '/opportunity_status/create',
  update: (id) => `/opportunity_status/update/${id}`,
  delete: (id) => `/opportunity_status/delete/${id}`,
  updateMethod: 'PATCH',
});

export default opportunityStatusService;

