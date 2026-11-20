import apiClient from '../apiClient';

/**
 * Model Registry Service (read-only; the backend fills it from the code at startup)
 *
 *   GET  /ir_model/view/all             models with their field count
 *   GET  /ir_model/view/{id}            one model with its fields
 *   GET  /ir_model_field/view/all?model_name=&field_type=
 *   POST /ir_model/sync                 re-read the models from code now
 */
export const modelRegistryService = {
  getAll: () => apiClient.get('/ir_model/view/all'),
  getById: (id) => apiClient.get(`/ir_model/view/${id}`),
  fields: (params) => apiClient.get('/ir_model_field/view/all', { params }),
  sync: () => apiClient.post('/ir_model/sync', {}),
};

export default modelRegistryService;
