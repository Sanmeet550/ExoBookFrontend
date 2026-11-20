import { createResourceService } from '../apiService';

/**
 * Sales Team Resource Service
 *
 * FastAPI Backend endpoints:
 *   GET    /sales_team/view/all
 *   GET    /sales_team/view/{id}
 *   POST   /sales_team/create
 *   PATCH  /sales_team/update/{id}
 *   DELETE /sales_team/delete/{id}
 */
export const salesTeamService = createResourceService({
  list: '/sales_team/view/all',
  detail: (id) => `/sales_team/view/${id}`,
  create: '/sales_team/create',
  update: (id) => `/sales_team/update/${id}`,
  delete: (id) => `/sales_team/delete/${id}`,
  updateMethod: 'PATCH',
});

export default salesTeamService;

