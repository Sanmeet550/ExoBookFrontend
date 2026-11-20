import apiClient from './apiClient';

/**
 * Reusable Dynamic CRUD Service Factory
 * 
 * Adapts to any resource's endpoint pattern without hardcoding URLs in UI components.
 * 
 * Example usage:
 * export const companyService = createResourceService({
 *   list: '/company/view/all',
 *   detail: (id) => `/company/view/${id}`,
 *   create: '/company/create',
 *   update: (id) => `/company/update/${id}`,
 *   delete: (id) => `/company/delete/${id}`,
 *   updateMethod: 'PATCH' // Default PATCH to match FastAPI backend
 * });
 */
export const createResourceService = (endpoints = {}) => {
  return {
    /**
     * Fetch all records
     * GET {list}
     */
    getAll: async (params = {}) => {
      if (!endpoints.list) {
        throw new Error('List endpoint is not configured for this resource');
      }
      return apiClient.get(endpoints.list, { params });
    },

    /**
     * Fetch a single record by ID
     * GET {detail(id)}
     */
    getById: async (id) => {
      if (!endpoints.detail) {
        throw new Error('Detail endpoint is not configured for this resource');
      }
      return apiClient.get(endpoints.detail(id));
    },

    /**
     * Create a new record
     * POST {create}
     */
    create: async (payload) => {
      if (!endpoints.create) {
        throw new Error('Create endpoint is not configured for this resource');
      }
      return apiClient.post(endpoints.create, payload);
    },

    /**
     * Update an existing record
     * PATCH or PUT {update(id)}
     */
    update: async (id, payload) => {
      if (!endpoints.update) {
        throw new Error('Update endpoint is not configured for this resource');
      }
      const method = (endpoints.updateMethod || 'PATCH').toUpperCase();
      if (method === 'PUT') {
        return apiClient.put(endpoints.update(id), payload);
      }
      return apiClient.patch(endpoints.update(id), payload);
    },

    /**
     * Delete a record by ID
     * DELETE {delete(id)}
     */
    delete: async (id) => {
      if (!endpoints.delete) {
        throw new Error('Delete endpoint is not configured for this resource');
      }
      return apiClient.delete(endpoints.delete(id));
    },

    /**
     * Reference to raw endpoints for custom actions if needed
     */
    endpoints,
  };
};

export default createResourceService;

