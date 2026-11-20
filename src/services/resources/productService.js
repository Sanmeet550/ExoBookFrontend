import { createResourceService } from '../apiService';

// Product API endpoints: POST /product/create, PATCH /product/update/{id}, etc.
export const productService = createResourceService({
  list: '/product/view/all',
  detail: (id) => `/product/view/${id}`,
  create: '/product/create',
  update: (id) => `/product/update/${id}`,
  delete: (id) => `/product/delete/${id}`,
  updateMethod: 'PATCH',
});

// Product Category lookup (used in product form dropdown)
export const productCategoryService = createResourceService({
  list: '/product-category/view/all',
  detail: (id) => `/product-category/view/${id}`,
  create: '/product-category/create',
  update: (id) => `/product-category/update/${id}`,
  delete: (id) => `/product-category/delete/${id}`,
  updateMethod: 'PATCH',
});

// Unit of Measure lookup (used in product form dropdown)
export const uomService = createResourceService({
  list: '/uom/view/all',
  detail: (id) => `/uom/view/${id}`,
  create: '/uom/create',
  update: (id) => `/uom/update/${id}`,
  delete: (id) => `/uom/delete/${id}`,
  updateMethod: 'PATCH',
});

