import { createResourceService } from '../apiService';

/**
 * CRM Lead / Opportunity Resource Service
 *
 * FastAPI Backend endpoints:
 *   GET    /crm/view/all
 *   GET    /crm/view/{lead_id}
 *   POST   /crm/create
 *   PATCH  /crm/update/{lead_id}
 *   DELETE /crm/delete/{lead_id}
 */
export const crmService = createResourceService({
  list: '/crm/view/all',
  detail: (id) => `/crm/view/${id}`,
  create: '/crm/create',
  update: (id) => `/crm/update/${id}`,
  delete: (id) => `/crm/delete/${id}`,
  updateMethod: 'PATCH',
});

export default crmService;

