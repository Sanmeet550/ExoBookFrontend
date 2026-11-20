import apiClient from '../apiClient';

/**
 * Sale Order Service
 *
 * FastApi endpoints:
 *   GET    /sales/view/all
 *   GET    /sales/view/{order_id}
 *   POST   /sales/create
 *   PATCH  /sales/update/{order_id}
 *   DELETE /sales/delete/{order_id}
 *   DELETE /sales-order-line/delete/{order_id}?line_id={line_id}
 */
export const saleOrderService = {
  // GET /sales/view/all
  getAll: () => apiClient.get('/sales/view/all'),

  // GET /sales/view/{id}
  getById: (id) => apiClient.get(`/sales/view/${id}`),

  // POST /sales/create — creates order with order_lines array
  create: (data) => apiClient.post('/sales/create', data),

  // PATCH /sales/update/{id} — backend endpoint is registered as PATCH
  update: (id, data) => apiClient.patch(`/sales/update/${id}`, data),

  // DELETE /sales/delete/{id}
  delete: (id) => apiClient.delete(`/sales/delete/${id}`),

  // DELETE /sales-order-line/delete/{order_id}?line_id={lineId} — delete individual line
  deleteOrderLine: (orderId, lineId) =>
    apiClient.delete(`/sales-order-line/delete/${orderId}`, { params: { line_id: lineId } }),
};


