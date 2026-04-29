import axios from 'axios';
import type {
  Product, CreateProductDto, UpdateProductDto,
  Purchase, CreatePurchaseDto,
  SalesOrder, CreateSalesOrderDto,
  Category, Brand, Supplier,
  FinancialSummary, DailySummary, MonthlySummary,
  TopProduct, InventoryReport, DashboardData,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5116/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Catalog ───────────────────────────────────────────────────────────────────
export const catalogApi = {
  getCategories: () => api.get<Category[]>('/catalog/categories').then(r => r.data),
  getBrands:     () => api.get<Brand[]>('/catalog/brands').then(r => r.data),
  getSuppliers:  () => api.get<Supplier[]>('/catalog/suppliers').then(r => r.data),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll:      () => api.get<Product[]>('/products').then(r => r.data),
  getById:     (id: number) => api.get<Product>(`/products/${id}`).then(r => r.data),
  create:      (dto: CreateProductDto) => api.post<Product>('/products', dto).then(r => r.data),
  update:      (id: number, dto: UpdateProductDto) => api.put<Product>(`/products/${id}`, dto).then(r => r.data),
  delete:      (id: number) => api.delete(`/products/${id}`),
  getLowStock: () => api.get<Product[]>('/products/low-stock').then(r => r.data),
};

// ── Purchases ─────────────────────────────────────────────────────────────────
export const purchasesApi = {
  getAll:   () => api.get<Purchase[]>('/purchases').then(r => r.data),
  getById:  (id: number) => api.get<Purchase>(`/purchases/${id}`).then(r => r.data),
  create:   (dto: CreatePurchaseDto) => api.post<Purchase>('/purchases', dto).then(r => r.data),
  receive:  (id: number) => api.post<Purchase>(`/purchases/${id}/receive`).then(r => r.data),
  cancel:   (id: number) => api.post<Purchase>(`/purchases/${id}/cancel`).then(r => r.data),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  getAll:       () => api.get<SalesOrder[]>('/orders').then(r => r.data),
  getById:      (id: number) => api.get<SalesOrder>(`/orders/${id}`).then(r => r.data),
  create:       (dto: CreateSalesOrderDto) => api.post<SalesOrder>('/orders', dto).then(r => r.data),
  updateStatus: (id: number, status: string) => api.patch<SalesOrder>(`/orders/${id}/status`, { status }).then(r => r.data),
  cancel:       (id: number) => api.post<SalesOrder>(`/orders/${id}/cancel`).then(r => r.data),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  getFinancialSummary: (from?: string, to?: string) =>
    api.get<FinancialSummary>('/reports/financial-summary', { params: { from, to } }).then(r => r.data),
  getDaily:   (from?: string, to?: string) =>
    api.get<DailySummary[]>('/reports/daily', { params: { from, to } }).then(r => r.data),
  getMonthly: (year?: number) =>
    api.get<MonthlySummary[]>('/reports/monthly', { params: { year } }).then(r => r.data),
  getTopProducts: (from?: string, to?: string, take = 10) =>
    api.get<TopProduct[]>('/reports/top-products', { params: { from, to, take } }).then(r => r.data),
  getInventory: () =>
    api.get<InventoryReport>('/reports/inventory').then(r => r.data),
  getDashboard: () =>
    api.get<DashboardData>('/reports/dashboard').then(r => r.data),
};
