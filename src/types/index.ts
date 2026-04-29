// ── Catalog ──────────────────────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  description?: string;
  productCount: number;
}

export interface Brand {
  id: number;
  name: string;
  country?: string;
  productCount: number;
}

export interface Supplier {
  id: number;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// ── Products ──────────────────────────────────────────────────────────────────
export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  purchasePrice: number;
  sellingPrice: number;
  averageCost: number;
  stockQuantity: number;
  minStockLevel: number;
  isLowStock: boolean;
  inventoryValue: number;
  margin: number;
}

export interface CreateProductDto {
  name: string;
  sku: string;
  description?: string;
  categoryId: number;
  brandId: number;
  purchasePrice: number;
  sellingPrice: number;
  minStockLevel: number;
}

export interface UpdateProductDto {
  name: string;
  description?: string;
  categoryId: number;
  brandId: number;
  purchasePrice: number;
  sellingPrice: number;
  minStockLevel: number;
}

// ── Purchases ─────────────────────────────────────────────────────────────────
export type PurchaseStatus = 'Draft' | 'Confirmed' | 'Received' | 'Cancelled';

export interface PurchaseItem {
  id: number;
  productId: number;
  productName: string;
  productSKU: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Purchase {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName: string;
  orderDate: string;
  receivedDate?: string;
  status: number;
  statusName: PurchaseStatus;
  notes?: string;
  totalAmount: number;
  items: PurchaseItem[];
}

export interface CreatePurchaseItemDto {
  productId: number;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseDto {
  supplierId: number;
  orderDate: string;
  notes?: string;
  items: CreatePurchaseItemDto[];
}

// ── Sales Orders ──────────────────────────────────────────────────────────────
export type OrderStatus = 'Draft' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface SalesOrderItem {
  id: number;
  productId: number;
  productName: string;
  productSKU: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  lineRevenue: number;
  lineCost: number;
  lineProfit: number;
}

export interface SalesOrder {
  id: number;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  orderDate: string;
  status: number;
  statusName: OrderStatus;
  notes?: string;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  marginPct: number;
  items: SalesOrderItem[];
}

export interface CreateSalesOrderItemDto {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateSalesOrderDto {
  customerName?: string;
  customerEmail?: string;
  orderDate: string;
  notes?: string;
  items: CreateSalesOrderItemDto[];
}

// ── Reports ───────────────────────────────────────────────────────────────────
export interface FinancialSummary {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPct: number;
  totalPurchaseExpenses: number;
  totalOrders: number;
  totalPurchases: number;
  inventoryValue: number;
}

export interface DailySummary {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  orderCount: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  monthName: string;
  revenue: number;
  cost: number;
  profit: number;
  purchaseExpenses: number;
  orderCount: number;
  purchaseCount: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  sku: string;
  categoryName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface InventoryItem {
  productId: number;
  productName: string;
  sku: string;
  categoryName: string;
  brandName: string;
  stockQuantity: number;
  minStockLevel: number;
  averageCost: number;
  sellingPrice: number;
  inventoryValue: number;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface InventoryReport {
  totalInventoryValue: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  items: InventoryItem[];
}

export interface DashboardData {
  thisMonth: FinancialSummary;
  lastMonth: FinancialSummary;
  ytd: FinancialSummary;
  monthly: MonthlySummary[];
  topProducts: TopProduct[];
  inventory: {
    totalInventoryValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalProducts: number;
  };
  daily: DailySummary[];
}
