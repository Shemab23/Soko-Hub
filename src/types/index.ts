export type FeatureModuleId = 
  | 'orders' 
  | 'analytics' 
  | 'deliveries' 
  | 'quotations' 
  | 'purchase_requests';

export type PaymentGatewayId = 'stripe' | 'paypal' | 'flutterwave';

export interface Shop {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl?: string;
  category: 'Groceries' | 'Electronics' | 'Books' | 'Fashion' | 'General';
  location: string;
  phone: string;
  email: string;
  passwordHash: string; // hash$sha256$mock...
  enabledModules: FeatureModuleId[];
  enabledGateways: PaymentGatewayId[];
  isSuspended: boolean;
  createdAt: string;
  balance: number; // in RWF
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string;
  category: string;
  price: number; // in RWF, integer
  stock: number;
  isActive: boolean;
  unit: string; // e.g. "kg", "item", "pack"
  badge?: string; // e.g. "Organic", "Warranty", "Bestseller"
  sku: string;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'failed';

export type DeliveryStatus = 'pending_dispatch' | 'shipped' | 'delivered';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  shopId: string;
  shopName: string;
  unitPrice: number; // Verified server price
  quantity: number;
  subtotal: number;
  deliveryStatus?: DeliveryStatus; // Only if shop has delivery module enabled
  deliveredAt?: string;
}

export interface Order {
  id: string; // e.g. "ORD-1024"
  guestSessionId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  status: OrderStatus;
  totalAmount: number; // Verified server total in RWF
  gateway: PaymentGatewayId;
  paymentReference?: string;
  webhookReceivedAt?: string;
  paidAt?: string;
  createdAt: string;
  items: OrderItem[];
  shopSubtotals: Record<string, number>; // shopId -> subtotal
}

export interface Payout {
  id: string;
  orderId: string;
  shopId: string;
  grossAmount: number; // Shop item subtotal
  platformFeeRate: number; // 0.05 (5%)
  platformFeeAmount: number; // 5%
  netAmount: number; // 95%
  status: 'pending' | 'processed';
  createdAt: string;
}

export interface WebhookEvent {
  id: string; // evt_...
  provider: PaymentGatewayId;
  orderId: string;
  eventType: 'payment.succeeded' | 'payment.failed';
  signature: string;
  payload: {
    orderId: string;
    amount: number;
    currency: string;
    gateway: PaymentGatewayId;
    customerEmail: string;
  };
  processedAt?: string;
  status: 'received' | 'processed' | 'duplicate_ignored' | 'rejected_bad_signature';
  createdAt: string;
}

export interface GuestSession {
  id: string; // guest_...
  signature: string;
  createdAt: string;
  cart: {
    productId: string;
    quantity: number;
  }[];
}

export interface CustomerSummary {
  email: string;
  name: string;
  orderCount: number;
  lifetimeSpend: number;
  lastPurchaseDate: string;
  isReturning: boolean;
}

export interface QuotationRequest {
  id: string;
  shopId: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requestedQuantity: number;
  notes: string;
  status: 'pending' | 'quoted' | 'rejected';
  offeredPrice?: number;
  respondedAt?: string;
  createdAt: string;
}

export interface PurchaseRequest {
  id: string;
  shopId: string;
  supplierName: string;
  itemName: string;
  quantity: number;
  estimatedCost: number;
  status: 'draft' | 'submitted' | 'approved' | 'received';
  notes: string;
  createdAt: string;
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  shopSlug?: string;
  status: number;
  durationMs: number;
  requestBody?: unknown;
  responseBody?: unknown;
  error?: string;
}

export interface EventLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error' | 'security';
  message: string;
  details?: string;
}

export interface SecurityTestResult {
  id: string;
  name: string;
  description: string;
  expectedStatus: number | string;
  actualStatus?: number | string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  outputMessage?: string;
  details?: string;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  recipient: 'guest' | 'shop' | 'operator';
  shopId?: string;
  title: string;
  message: string;
  read: boolean;
}

export interface LoginSession {
  role: 'shop_admin' | 'operator';
  shopId?: string;
  shopSlug?: string;
  shopName?: string;
  email: string;
  token: string;
}
