import { 
  Shop, 
  Product, 
  Order, 
  Payout, 
  WebhookEvent, 
  GuestSession, 
  QuotationRequest, 
  PurchaseRequest 
} from '../types';
import { getInitialSeedData } from './seed';
import { generateGuestSession } from './crypto';

const STORAGE_KEY = 'soko_hub_db_v2';
const GUEST_STORAGE_KEY = 'soko_hub_guest_session_v2';

export interface SimDatabaseState {
  shops: Shop[];
  products: Product[];
  orders: Order[];
  payouts: Payout[];
  webhooks: WebhookEvent[];
  guestSessions: Record<string, GuestSession>;
  quotations: QuotationRequest[];
  purchaseRequests: PurchaseRequest[];
  loginAttempts: Record<string, { count: number; lastAttempt: number; lockedUntil?: number }>;
  authTokens: Record<string, { role: 'shop_admin' | 'operator'; shopId?: string; email: string }>;
}

class SimDatabase {
  private state: SimDatabaseState;

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): SimDatabaseState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SimDatabaseState;
        if (parsed.shops && parsed.products && parsed.orders) {
          return parsed;
        }
      }
    } catch {
      // Fallback to fresh seed
    }

    const seed = getInitialSeedData();
    const initialState: SimDatabaseState = {
      shops: seed.shops,
      products: seed.products,
      orders: seed.orders,
      payouts: seed.payouts,
      webhooks: [],
      guestSessions: {},
      quotations: seed.quotations,
      purchaseRequests: seed.purchaseRequests,
      loginAttempts: {},
      authTokens: {},
    };

    this.saveToStorage(initialState);
    return initialState;
  }

  private saveToStorage(state = this.state): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  public resetToSeed(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(GUEST_STORAGE_KEY);
    const seed = getInitialSeedData();
    this.state = {
      shops: seed.shops,
      products: seed.products,
      orders: seed.orders,
      payouts: seed.payouts,
      webhooks: [],
      guestSessions: {},
      quotations: seed.quotations,
      purchaseRequests: seed.purchaseRequests,
      loginAttempts: {},
      authTokens: {},
    };
    this.saveToStorage();
  }

  // --- Guest Session Management ---
  public getOrCreateGuestSession(): GuestSession {
    try {
      const storedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
      if (storedGuest) {
        const parsed = JSON.parse(storedGuest) as { id: string; signature: string };
        const session = this.state.guestSessions[parsed.id];
        if (session && session.signature === parsed.signature) {
          return session;
        }
      }
    } catch {
      // Create new
    }

    const newGen = generateGuestSession();
    const newSession: GuestSession = {
      id: newGen.id,
      signature: newGen.signature,
      createdAt: new Date().toISOString(),
      cart: [],
    };

    this.state.guestSessions[newSession.id] = newSession;
    this.saveToStorage();

    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ id: newSession.id, signature: newSession.signature }));
    } catch {
      // ignore
    }

    return newSession;
  }

  public saveGuestSession(session: GuestSession): void {
    this.state.guestSessions[session.id] = session;
    this.saveToStorage();
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ id: session.id, signature: session.signature }));
    } catch {
      // ignore
    }
  }

  public tamperGuestSession(): void {
    try {
      const stored = localStorage.getItem(GUEST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.signature = 'tampered_invalid_signature_xyz';
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {
      // ignore
    }
  }

  // --- Getters ---
  public getShops(): Shop[] {
    return this.state.shops;
  }

  public getShopById(id: string): Shop | undefined {
    return this.state.shops.find((s) => s.id === id);
  }

  public getShopBySlug(slug: string): Shop | undefined {
    return this.state.shops.find((s) => s.slug === slug);
  }

  public updateShop(id: string, update: Partial<Shop>): Shop {
    const idx = this.state.shops.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Shop not found');
    this.state.shops[idx] = { ...this.state.shops[idx], ...update };
    this.saveToStorage();
    return this.state.shops[idx];
  }

  public addShop(shop: Shop): Shop {
    this.state.shops.push(shop);
    this.saveToStorage();
    return shop;
  }

  public getProducts(): Product[] {
    return this.state.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.state.products.find((p) => p.id === id);
  }

  public updateProduct(id: string, update: Partial<Product>): Product {
    const idx = this.state.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    this.state.products[idx] = { ...this.state.products[idx], ...update };
    this.saveToStorage();
    return this.state.products[idx];
  }

  public addProduct(product: Product): Product {
    this.state.products.push(product);
    this.saveToStorage();
    return product;
  }

  public deleteProduct(id: string): void {
    this.state.products = this.state.products.filter((p) => p.id !== id);
    this.saveToStorage();
  }

  public getOrders(): Order[] {
    return this.state.orders;
  }

  public getOrderById(id: string): Order | undefined {
    return this.state.orders.find((o) => o.id === id);
  }

  public addOrder(order: Order): Order {
    this.state.orders.push(order);
    this.saveToStorage();
    return order;
  }

  public updateOrder(id: string, update: Partial<Order>): Order {
    const idx = this.state.orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Order not found');
    this.state.orders[idx] = { ...this.state.orders[idx], ...update };
    this.saveToStorage();
    return this.state.orders[idx];
  }

  public getPayouts(): Payout[] {
    return this.state.payouts;
  }

  public addPayout(payout: Payout): Payout {
    this.state.payouts.push(payout);
    this.saveToStorage();
    return payout;
  }

  public getWebhooks(): WebhookEvent[] {
    return this.state.webhooks;
  }

  public addWebhook(wh: WebhookEvent): WebhookEvent {
    this.state.webhooks.push(wh);
    this.saveToStorage();
    return wh;
  }

  public getQuotations(): QuotationRequest[] {
    return this.state.quotations;
  }

  public addQuotation(q: QuotationRequest): QuotationRequest {
    this.state.quotations.push(q);
    this.saveToStorage();
    return q;
  }

  public updateQuotation(id: string, update: Partial<QuotationRequest>): QuotationRequest {
    const idx = this.state.quotations.findIndex((q) => q.id === id);
    if (idx === -1) throw new Error('Quotation not found');
    this.state.quotations[idx] = { ...this.state.quotations[idx], ...update };
    this.saveToStorage();
    return this.state.quotations[idx];
  }

  public getPurchaseRequests(): PurchaseRequest[] {
    return this.state.purchaseRequests;
  }

  public addPurchaseRequest(pr: PurchaseRequest): PurchaseRequest {
    this.state.purchaseRequests.push(pr);
    this.saveToStorage();
    return pr;
  }

  public updatePurchaseRequest(id: string, update: Partial<PurchaseRequest>): PurchaseRequest {
    const idx = this.state.purchaseRequests.findIndex((pr) => pr.id === id);
    if (idx === -1) throw new Error('Purchase request not found');
    this.state.purchaseRequests[idx] = { ...this.state.purchaseRequests[idx], ...update };
    this.saveToStorage();
    return this.state.purchaseRequests[idx];
  }

  // --- Auth Session Tokens (simulating server-side httpOnly cookies) ---
  public setAuthSession(token: string, data: { role: 'shop_admin' | 'operator'; shopId?: string; email: string }): void {
    this.state.authTokens[token] = data;
    this.saveToStorage();
  }

  public getAuthSession(token: string) {
    return this.state.authTokens[token];
  }

  public removeAuthSession(token: string): void {
    delete this.state.authTokens[token];
    this.saveToStorage();
  }

  // --- Rate limiting for logins ---
  public getLoginAttemptRecord(email: string) {
    return this.state.loginAttempts[email.toLowerCase()];
  }

  public recordLoginFailure(email: string): { locked: boolean; lockedUntil?: number } {
    const lower = email.toLowerCase();
    const now = Date.now();
    const existing = this.state.loginAttempts[lower] || { count: 0, lastAttempt: now };

    // Reset count if last attempt was > 60 seconds ago
    if (now - existing.lastAttempt > 60000) {
      existing.count = 1;
      existing.lockedUntil = undefined;
    } else {
      existing.count += 1;
    }
    existing.lastAttempt = now;

    if (existing.count >= 5) {
      existing.lockedUntil = now + 60000; // 60 seconds lock
    }

    this.state.loginAttempts[lower] = existing;
    this.saveToStorage();

    return {
      locked: existing.count >= 5,
      lockedUntil: existing.lockedUntil,
    };
  }

  public clearLoginFailures(email: string): void {
    delete this.state.loginAttempts[email.toLowerCase()];
    this.saveToStorage();
  }

  public getFullSnapshot(): SimDatabaseState {
    return JSON.parse(JSON.stringify(this.state));
  }
}

export const simDb = new SimDatabase();
