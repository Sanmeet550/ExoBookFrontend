import apiClient from '../apiClient';
import { createResourceService } from '../apiService';

/**
 * Helpdesk Resource Services
 *
 * FastAPI Backend endpoints (all require a signed-in user with a Helpdesk role in the active company):
 *   Masters:   /helpdesk/{team|ticket_type|stage|priority|tag|sla_policy|assignment_rule|access}/...
 *              view/all, view/{id}, create, update/{id}, delete/{id}
 *   Tickets:   /helpdesk/ticket/view/all (paginated), view/{id}, create, update/{id}, delete/{id}
 *   Actions:   POST /helpdesk/ticket/{assign|stage|resolve|close|reopen|escalate|duplicate|apply_sla|rate}/{id}
 *   SLA:       GET /helpdesk/ticket/{id}/sla   (the timeline uses the generic /chatter API)
 *   Other:     GET /helpdesk/me, /helpdesk/agents, /helpdesk/dashboard, /helpdesk/sla_status/view/all
 */
export const HELPDESK_ENDPOINTS = {
  agents: '/helpdesk/agents',
  teams: '/helpdesk/team/view/all',
  ticketTypes: '/helpdesk/ticket_type/view/all',
  stages: '/helpdesk/stage/view/all',
  priorities: '/helpdesk/priority/view/all',
  tags: '/helpdesk/tag/view/all',
};

const masterService = (slug) =>
  createResourceService({
    list: `/helpdesk/${slug}/view/all`,
    detail: (id) => `/helpdesk/${slug}/view/${id}`,
    create: `/helpdesk/${slug}/create`,
    update: (id) => `/helpdesk/${slug}/update/${id}`,
    delete: (id) => `/helpdesk/${slug}/delete/${id}`,
    updateMethod: 'PATCH',
  });

export const helpdeskTeamService = masterService('team');
export const helpdeskTicketTypeService = masterService('ticket_type');
export const helpdeskStageService = masterService('stage');
export const helpdeskPriorityService = masterService('priority');
export const helpdeskTagService = masterService('tag');
export const helpdeskSlaPolicyService = masterService('sla_policy');
export const helpdeskAssignmentRuleService = masterService('assignment_rule');
export const helpdeskAccessService = masterService('access');

/** Drops empty filter values so they are not sent as "undefined" query strings. */
const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== false)
  );

export const helpdeskTicketService = {
  ...masterService('ticket'),
  getPage: (params) => apiClient.get('/helpdesk/ticket/view/all', { params: cleanParams(params) }),
  action: (name, id, body = {}) => apiClient.post(`/helpdesk/ticket/${name}/${id}`, body),
  getSla: (id) => apiClient.get(`/helpdesk/ticket/${id}/sla`),
};

export const helpdeskService = {
  me: () => apiClient.get('/helpdesk/me'),
  agents: () => apiClient.get(HELPDESK_ENDPOINTS.agents),
  dashboard: (params) => apiClient.get('/helpdesk/dashboard', { params: cleanParams(params) }),
  slaStatuses: (params) => apiClient.get('/helpdesk/sla_status/view/all', { params: cleanParams(params) }),
};

export default helpdeskService;
