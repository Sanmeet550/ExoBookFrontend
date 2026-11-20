import apiClient from './apiClient';

/**
 * Chatter Service (generic, works for every model)
 *
 * FastAPI Backend endpoints:
 *   GET    /chatter/{model}/{id}?activity_type=field_change|log_note|message|email
 *   POST   /chatter/{model}/{id}/log_note   { body }
 *   POST   /chatter/{model}/{id}/message    { body, is_internal }
 *   POST   /chatter/{model}/{id}/email      { to, cc, bcc, subject, body }   (503 until a provider exists)
 *   PATCH  /chatter/activity/{id}  { body }      DELETE /chatter/activity/{id}
 *   GET    /chatter/status                       -> { email_configured }
 *   GET    /chatter/tracking/models, GET|PATCH /chatter/tracking/fields/{model}
 */

// Frontend config keys whose backend table name is not simply their snake_case form.
const MODEL_ALIASES = { crm: 'crm_lead', contacts: 'partner', currencies: 'currency', salesorders: 'sales_order' };

/** Maps a view config's model key (e.g. "jobPosition") to the backend model name ("job_position"). */
export const toChatterModel = (model) => {
  if (!model) return null;
  const alias = MODEL_ALIASES[String(model).toLowerCase()];
  return alias || String(model).replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
};

export const chatterService = {
  list: (model, recordId) => apiClient.get(`/chatter/${model}/${recordId}`),
  logNote: (model, recordId, body) => apiClient.post(`/chatter/${model}/${recordId}/log_note`, { body }),
  sendMessage: (model, recordId, body, isInternal) =>
    apiClient.post(`/chatter/${model}/${recordId}/message`, { body, is_internal: isInternal }),
  update: (activityId, body) => apiClient.patch(`/chatter/activity/${activityId}`, { body }),
  remove: (activityId) => apiClient.delete(`/chatter/activity/${activityId}`),
  status: () => apiClient.get('/chatter/status'),
  trackedModels: () => apiClient.get('/chatter/tracking/models'),
  trackedFields: (model) => apiClient.get(`/chatter/tracking/fields/${model}`),
  setTracked: (model, fieldName, tracked) =>
    apiClient.patch(`/chatter/tracking/fields/${model}`, { field_name: fieldName, tracked }),
};

export default chatterService;
