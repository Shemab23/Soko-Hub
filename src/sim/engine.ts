import { 
  Shop, 
  Product, 
  Order, 
  OrderItem, 
  Payout, 
  WebhookEvent, 
  PaymentGatewayId, 
  FeatureModuleId, 
  CustomerSummary, 
  QuotationRequest, 
  PurchaseRequest 
} from '../types';
import { simDb } from './db';
import { verifyMockPassword, verifyGuestSession, verifyWebhookSignature } from './crypto';
import { useMonitorStore } from './monitorStore';

export interface SimResponse<T = unknown> {
  status: number;
  data?: T;
  error?: string;
  code?: string;
}

export class SimEngine {
  private logEvent(level: 'info' | 'success' | 'warn' | 'error' | 'security', message: string, details?: string) {
    useMonitorStore.getState().addEventLog({ level, message, details });
  }

  // --- Auth verification helper ---
  private authenticateShop(token: string, expectedShopSlug?: string): { shop: Shop; email: string } {
    const session = simDb.getAuthSession(token);
    if (!session || session.role !== 'shop_admin' || !session.shopId) {
      this.logEvent('security', '401 Unauthorized: Invalid or missing shop admin session token');
      throw { status: 401, error: 'Unauthorized: Invalid or expired session' };
    }

    const shop = simDb.getShopById(session.shopId);
    if (!shop) {
      this.logEvent('security', '401 Unauthorized: Shop does not exist');
      throw { status: 401, error: 'Shop not found' };
    }

    if (shop.isSuspended) {
      this.logEvent('security', `403 Forbidden: Suspended shop access attempt (${shop.name})`);
      throw { status: 403, error: 'Access revoked: shop suspended.', code: 'shop_suspended' };
    }

    // Tenant isolation: verify shop slug matches session's shop
    if (expectedShopSlug && shop.slug !== expectedShopSlug) {
      this.logEvent('security', `403 Tenant Isolation: Admin of ${shop.slug} attempted cross-tenant access to ${expectedShopSlug}`);
      throw { status: 403, error: 'Forbidden: You do not have access to this tenant.', code: 'tenant_forbidden' };
    }

    return { shop, email: session.email };
  }

  private authenticateOperator(token: string): { email: string } {
    const session = simDb.getAuthSession(token);
    if (!session || session.role !== 'operator') {
      this.logEvent('security', '401 Unauthorized: Missing or invalid platform operator session token');
      throw { status: 401, error: 'Unauthorized: Operator credentials required' };
    }
    return { email: session.email };
  }

  private checkModuleEnabled(shop: Shop, moduleId: FeatureModuleId): void {
    if (!shop.enabledModules.includes(moduleId)) {
      this.logEvent('security', `403 module_not_enabled: Shop '${shop.name}' requested disabled module '${moduleId}'`);
      throw {
        status: 403,
        error: `This module '${moduleId}' is not enabled for your shop.`,
        code: 'module_not_enabled',
      };
    }
  }

  // --- Guest Session & Integrity ---
  public verifyOrRenewGuest(providedSessionId?: string, providedSignature?: string): { id: string; signature: string; tampered: boolean } {
    if (providedSessionId && providedSignature) {
      const isValid = verifyGuestSession(providedSessionId, providedSignature);
      if (!isValid) {
        this.logEvent('security', `Tampered guest session detected (${providedSessionId}). Invalid signature. Creating clean guest session and resetting cart.`);
        const renewed = simDb.getOrCreateGuestSession();
        return { id: renewed.id, signature: renewed.signature, tampered: true };
      }
      return { id: providedSessionId, signature: providedSignature, tampered: false };
    }
    const session = simDb.getOrCreateGuestSession();
    return { id: session.id, signature: session.signature, tampered: false };
  }

  // ==========================================
  // PUBLIC MARKETPLACE APIs
  // ==========================================

  public getMarketplaceProducts(): Product[] {
    const shops = simDb.getShops().filter((s) => !s.isSuspended);
    const activeShopIds = new Set(shops.map((s) => s.id));
    return simDb.getProducts().filter((p) => p.isActive && activeShopIds.has(p.shopId));
  }

  public getMarketplaceShops(): Shop[] {
    return simDb.getShops().filter((s) => !s.isSuspended);
  }

  public getProductDetail(productId: string): { product: Product; shop: Shop; quoteSupported: boolean } {
    const product = simDb.getProductById(productId);
    if (!product || !product.isActive) {
      throw { status: 404, error: 'Product not found' };
    }
    const shop = simDb.getShopById(product.shopId);
    if (!shop || shop.isSuspended) {
      throw { status: 404, error: 'Shop is not currently available' };
    }
    const quoteSupported = shop.enabledModules.includes('quotations');
    return { product, shop, quoteSupported };
  }

  // --- Cart Management (Guest) ---
  public getCart(sessionId: string, signature: string): {
    items: { product: Product; quantity: number; shop: Shop }[];
    shopGroups: { shop: Shop; items: { product: Product; quantity: number }[]; subtotal: number }[];
    totalAmount: number;
    availableGateways: PaymentGatewayId[];
    unavailableGateways: { gateway: PaymentGatewayId; missingByShops: string[] }[];
  } {
    this.verifyOrRenewGuest(sessionId, signature);
    const session = simDb.getOrCreateGuestSession();

    const items: { product: Product; quantity: number; shop: Shop }[] = [];
    for (const entry of session.cart) {
      const p = simDb.getProductById(entry.productId);
      if (p && p.isActive) {
        const s = simDb.getShopById(p.shopId);
        if (s && !s.isSuspended) {
          items.push({ product: p, quantity: entry.quantity, shop: s });
        }
      }
    }

    // Group by shop
    const shopMap = new Map<string, { shop: Shop; items: { product: Product; quantity: number }[]; subtotal: number }>();
    for (const item of items) {
      if (!shopMap.has(item.shop.id)) {
        shopMap.set(item.shop.id, { shop: item.shop, items: [], subtotal: 0 });
      }
      const group = shopMap.get(item.shop.id)!;
      group.items.push({ product: item.product, quantity: item.quantity });
      // SERVER-SIDE PRICE
      group.subtotal += item.product.price * item.quantity;
    }

    const shopGroups = Array.from(shopMap.values());
    const totalAmount = shopGroups.reduce((acc, g) => acc + g.subtotal, 0);

    // GATEWAY INTERSECTION RULE
    // Only offer gateways accepted by EVERY shop in the cart
    const allGateways: PaymentGatewayId[] = ['stripe', 'paypal', 'flutterwave'];
    const distinctShops = shopGroups.map((g) => g.shop);

    const availableGateways: PaymentGatewayId[] = distinctShops.length === 0 ? [] : allGateways.filter((gw) =>
      distinctShops.every((shop) => shop.enabledGateways.includes(gw))
    );

    const unavailableGateways: { gateway: PaymentGatewayId; missingByShops: string[] }[] = [];
    if (distinctShops.length > 0) {
      for (const gw of allGateways) {
        if (!availableGateways.includes(gw)) {
          const missingByShops = distinctShops
            .filter((shop) => !shop.enabledGateways.includes(gw))
            .map((shop) => shop.name);
          unavailableGateways.push({ gateway: gw, missingByShops });
        }
      }
    }

    return {
      items,
      shopGroups,
      totalAmount,
      availableGateways,
      unavailableGateways,
    };
  }

  public addToCart(sessionId: string, signature: string, productId: string, quantity: number): void {
    this.verifyOrRenewGuest(sessionId, signature);
    const session = simDb.getOrCreateGuestSession();
    const product = simDb.getProductById(productId);

    if (!product || !product.isActive) {
      throw { status: 404, error: 'Product not found or inactive' };
    }

    const existing = session.cart.find((c) => c.productId === productId);
    const requestedTotalQty = (existing ? existing.quantity : 0) + quantity;

    // Stock check
    if (requestedTotalQty > product.stock) {
      this.logEvent('warn', `Stock limit exceeded for '${product.name}' (Available: ${product.stock}, requested: ${requestedTotalQty})`);
      throw { status: 400, error: `Only ${product.stock} items in stock.` };
    }

    if (existing) {
      existing.quantity = requestedTotalQty;
    } else {
      session.cart.push({ productId, quantity });
    }

    simDb.saveGuestSession(session);
    this.logEvent('info', `Cart updated: Added ${quantity}x '${product.name}'`);
  }

  public updateCartItem(sessionId: string, signature: string, productId: string, quantity: number): void {
    this.verifyOrRenewGuest(sessionId, signature);
    const session = simDb.getOrCreateGuestSession();
    const product = simDb.getProductById(productId);

    if (!product) {
      throw { status: 404, error: 'Product not found' };
    }

    if (quantity <= 0) {
      session.cart = session.cart.filter((c) => c.productId !== productId);
      simDb.saveGuestSession(session);
      return;
    }

    if (quantity > product.stock) {
      throw { status: 400, error: `Only ${product.stock} items in stock.` };
    }

    const entry = session.cart.find((c) => c.productId === productId);
    if (entry) {
      entry.quantity = quantity;
    }
    simDb.saveGuestSession(session);
  }

  public clearCart(sessionId: string, signature: string): void {
    this.verifyOrRenewGuest(sessionId, signature);
    const session = simDb.getOrCreateGuestSession();
    session.cart = [];
    simDb.saveGuestSession(session);
  }

  // --- Checkout ---
  public startCheckout(
    sessionId: string,
    signature: string,
    checkoutData: {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      shippingAddress: string;
      city: string;
      gateway: PaymentGatewayId;
      forgedPriceInjection?: number; // Used for security test simulation
    }
  ): { order: Order; paymentUrl: string } {
    this.verifyOrRenewGuest(sessionId, signature);
    const session = simDb.getOrCreateGuestSession();

    if (session.cart.length === 0) {
      throw { status: 400, error: 'Cart is empty' };
    }

    // Engine rule 3: Prices come strictly from database, ignoring any client claims
    let verifiedTotal = 0;
    const shopSubtotals: Record<string, number> = {};
    const orderItems: OrderItem[] = [];
    const orderId = `ORD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;

    for (const cartItem of session.cart) {
      const product = simDb.getProductById(cartItem.productId);
      if (!product || !product.isActive) {
        throw { status: 400, error: `Item '${cartItem.productId}' is no longer available` };
      }

      // Engine rule 4: Stock re-verified
      if (product.stock < cartItem.quantity) {
        throw { status: 400, error: `Insufficient stock for ${product.name}. Available: ${product.stock}` };
      }

      const shop = simDb.getShopById(product.shopId);
      if (!shop || shop.isSuspended) {
        throw { status: 400, error: `Shop ${shop?.name || ''} is currently unavailable` };
      }

      // Verify selected gateway is enabled by this shop
      if (!shop.enabledGateways.includes(checkoutData.gateway)) {
        this.logEvent('security', `400 Gateway Enforcement: Shop '${shop.name}' does not accept '${checkoutData.gateway}'`);
        throw { status: 400, error: `Gateway ${checkoutData.gateway} is not supported by shop ${shop.name}` };
      }

      // Recompute price strictly from database
      const itemSubtotal = product.price * cartItem.quantity;
      verifiedTotal += itemSubtotal;
      shopSubtotals[shop.id] = (shopSubtotals[shop.id] || 0) + itemSubtotal;

      orderItems.push({
        id: `item_${orderId}_${orderItems.length + 1}`,
        orderId,
        productId: product.id,
        productName: product.name,
        shopId: shop.id,
        shopName: shop.name,
        unitPrice: product.price,
        quantity: cartItem.quantity,
        subtotal: itemSubtotal,
        deliveryStatus: shop.enabledModules.includes('deliveries') ? 'pending_dispatch' : undefined,
      });
    }

    if (checkoutData.forgedPriceInjection) {
      this.logEvent('security', `Client submitted forged price payload (${checkoutData.forgedPriceInjection} RWF). Server discarded client price and enforced verified DB total (${verifiedTotal} RWF).`);
    }

    const order: Order = {
      id: orderId,
      guestSessionId: session.id,
      customerName: checkoutData.customerName,
      customerEmail: checkoutData.customerEmail,
      customerPhone: checkoutData.customerPhone,
      shippingAddress: checkoutData.shippingAddress,
      city: checkoutData.city,
      status: 'pending', // NOT paid yet! Paid ONLY via verified webhook!
      totalAmount: verifiedTotal,
      gateway: checkoutData.gateway,
      createdAt: new Date().toISOString(),
      items: orderItems,
      shopSubtotals,
    };

    simDb.addOrder(order);

    const distinctShopsCount = Object.keys(shopSubtotals).length;
    this.logEvent(
      'info',
      `POST /api/checkout/start → 201 order #${orderId} pending (${distinctShopsCount} shops, ${verifiedTotal.toLocaleString()} RWF)`
    );

    const paymentUrl = `/pay/${checkoutData.gateway}/${orderId}`;
    return { order, paymentUrl };
  }

  // --- Order Receipt (Protected by guest session ownership) ---
  public getOrderReceipt(orderId: string, sessionId: string, signature: string): Order {
    this.verifyOrRenewGuest(sessionId, signature);
    const order = simDb.getOrderById(orderId);
    if (!order) {
      this.logEvent('warn', `404 Receipt not found for ${orderId}`);
      throw { status: 404, error: 'Order not found' };
    }

    // Engine Rule 8: Receipt visible only to guest session that created it!
    if (order.guestSessionId !== sessionId) {
      this.logEvent('security', `404 Receipt Privacy: Guest session ${sessionId} attempted to read receipt for order #${orderId} owned by ${order.guestSessionId}`);
      throw { status: 404, error: 'Order not found for this guest session' };
    }

    return order;
  }

  // ==========================================
  // PAYMENT PROVIDER & WEBHOOK SIMULATION
  // ==========================================

  public processWebhook(event: {
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
  }): { status: number; message: string; acknowledged: boolean } {
    // Engine Rule 12: Bad signature check
    if (!verifyWebhookSignature(event.signature, event.payload)) {
      this.logEvent('security', `Webhook ${event.provider} signature INVALID (${event.signature}). Rejected 401.`);
      const wh: WebhookEvent = {
        ...event,
        status: 'rejected_bad_signature',
        createdAt: new Date().toISOString(),
      };
      simDb.addWebhook(wh);
      throw { status: 401, error: 'Invalid webhook signature' };
    }

    this.logEvent('info', `Webhook ${event.provider} ${event.id} signature valid.`);

    // Engine Rule 6: Idempotency check
    const existingWebhooks = simDb.getWebhooks();
    const alreadyProcessed = existingWebhooks.find((w) => w.id === event.id && w.status === 'processed');
    if (alreadyProcessed) {
      this.logEvent('info', `${event.id} duplicate acknowledged, ignored. No balance change.`);
      return { status: 200, message: 'Webhook already processed (Idempotent acknowledge)', acknowledged: true };
    }

    const order = simDb.getOrderById(event.orderId);
    if (!order) {
      this.logEvent('error', `Webhook referenced non-existent order ${event.orderId}`);
      throw { status: 404, error: 'Order not found' };
    }

    if (order.status === 'paid') {
      this.logEvent('warn', `Order #${order.id} is already paid. Ignoring duplicate payment event.`);
      return { status: 200, message: 'Order already marked paid', acknowledged: true };
    }

    if (event.eventType === 'payment.succeeded') {
      // 1. Mark Order Paid
      const nowIso = new Date().toISOString();
      simDb.updateOrder(order.id, {
        status: 'paid',
        paymentReference: `SIM_REF_${event.provider.toUpperCase()}_${Date.now().toString().slice(-6)}`,
        webhookReceivedAt: nowIso,
        paidAt: nowIso,
      });

      // 2. Reduce Stock (Engine Rule 4)
      for (const item of order.items) {
        const prod = simDb.getProductById(item.productId);
        if (prod) {
          const newStock = Math.max(0, prod.stock - item.quantity);
          simDb.updateProduct(prod.id, { stock: newStock });
          if (newStock <= 5) {
            this.logEvent('warn', `Low stock alert: '${prod.name}' remaining: ${newStock}`);
          }
        }
      }

      // 3. Payout Split (Engine Rule 7): 95% net to merchant, 5% to platform
      let totalPlatformFee = 0;
      const splitDetails: string[] = [];

      for (const [shopId, subtotal] of Object.entries(order.shopSubtotals)) {
        const platformFee = Math.round(subtotal * 0.05);
        const netAmount = subtotal - platformFee;
        totalPlatformFee += platformFee;

        const shop = simDb.getShopById(shopId);
        const shopName = shop?.name || shopId;

        simDb.addPayout({
          id: `payout_${order.id}_${shopId.replace('shop_', '')}`,
          orderId: order.id,
          shopId,
          grossAmount: subtotal,
          platformFeeRate: 0.05,
          platformFeeAmount: platformFee,
          netAmount,
          status: 'processed',
          createdAt: nowIso,
        });

        if (shop) {
          simDb.updateShop(shop.id, { balance: shop.balance + netAmount });
        }

        splitDetails.push(`${shopName}: ${netAmount.toLocaleString()} RWF`);

        // Send toast notification to shop admin
        useMonitorStore.getState().addNotification({
          recipient: 'shop',
          shopId,
          title: `New paid order #${order.id}`,
          message: `${order.items.filter((i) => i.shopId === shopId).length} item(s) for your shop. Net: ${netAmount.toLocaleString()} RWF`,
        });
      }

      this.logEvent(
        'success',
        `Order #${order.id} → paid. Stock reduced. Split: ${splitDetails.join(', ')} | Platform fee: ${totalPlatformFee.toLocaleString()} RWF`
      );

      // Toast notification to guest
      useMonitorStore.getState().addNotification({
        recipient: 'guest',
        title: 'Payment confirmed',
        message: `Order #${order.id} paid successfully via ${order.gateway}.`,
      });

      // Toast notification to operator
      useMonitorStore.getState().addNotification({
        recipient: 'operator',
        title: 'Platform fee earned',
        message: `Earned ${totalPlatformFee.toLocaleString()} RWF from Order #${order.id}.`,
      });

      // Empty guest cart
      const guest = simDb.getOrCreateGuestSession();
      guest.cart = [];
      simDb.saveGuestSession(guest);

      // Record webhook event as processed
      const wh: WebhookEvent = {
        ...event,
        status: 'processed',
        processedAt: nowIso,
        createdAt: nowIso,
      };
      simDb.addWebhook(wh);

      return { status: 200, message: 'Order marked paid and balances settled', acknowledged: true };
    } else {
      // Payment failed
      simDb.updateOrder(order.id, { status: 'failed' });
      this.logEvent('error', `Payment failed webhook for #${order.id}`);
      return { status: 200, message: 'Payment failure recorded', acknowledged: true };
    }
  }

  // ==========================================
  // AUTHENTICATION (Shop Admins & Operator)
  // ==========================================

  public login(credentials: { email: string; password: string; shopSlug?: string }): {
    token: string;
    role: 'shop_admin' | 'operator';
    shop?: Shop;
  } {
    const email = credentials.email.trim().toLowerCase();

    // Engine Rule 9: Rate limiting check (> 5 failed attempts in 60s -> 429)
    const attemptRecord = simDb.getLoginAttemptRecord(email);
    if (attemptRecord && attemptRecord.lockedUntil && Date.now() < attemptRecord.lockedUntil) {
      const remainingSec = Math.ceil((attemptRecord.lockedUntil - Date.now()) / 1000);
      this.logEvent('security', `429 Too Many Requests: Login blocked for ${email}. Cooldown: ${remainingSec}s`);
      throw {
        status: 429,
        error: `Too many failed login attempts. Please wait ${remainingSec} seconds before trying again.`,
        code: 'rate_limited',
      };
    }

    // Platform Operator Check
    if (email === 'operator@soko.demo') {
      if (credentials.password === 'Demo1234!') {
        simDb.clearLoginFailures(email);
        const token = `tok_op_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        simDb.setAuthSession(token, { role: 'operator', email });
        this.logEvent('info', `Operator login successful (${email})`);
        return { token, role: 'operator' };
      }
    }

    // Shop Admin Check
    const shops = simDb.getShops();
    const shop = credentials.shopSlug
      ? shops.find((s) => s.slug === credentials.shopSlug && s.email.toLowerCase() === email)
      : shops.find((s) => s.email.toLowerCase() === email);

    if (shop) {
      // Engine Rule 11: Suspended Shop
      if (shop.isSuspended) {
        this.logEvent('security', `Suspended shop login attempt: ${shop.name} (${email})`);
        throw { status: 403, error: 'Access revoked: shop suspended.', code: 'shop_suspended' };
      }

      if (verifyMockPassword(credentials.password, shop.passwordHash)) {
        simDb.clearLoginFailures(email);
        const token = `tok_shop_${shop.id}_${Date.now()}`;
        simDb.setAuthSession(token, { role: 'shop_admin', shopId: shop.id, email });
        this.logEvent('info', `Shop admin logged in: ${shop.name} (${shop.slug})`);
        return { token, role: 'shop_admin', shop };
      }
    }

    // Record Failure
    const failureStatus = simDb.recordLoginFailure(email);
    this.logEvent('warn', `Failed login attempt for ${email}. Failures: ${simDb.getLoginAttemptRecord(email)?.count}`);
    if (failureStatus.locked) {
      throw {
        status: 429,
        error: 'Too many failed login attempts. Cooldown period of 60 seconds activated.',
        code: 'rate_limited',
      };
    }

    throw { status: 401, error: 'Invalid email or password' };
  }

  public registerShop(data: {
    name: string;
    slug: string;
    email: string;
    password: string;
    category: Shop['category'];
    description: string;
    location: string;
    phone: string;
    enabledModules: FeatureModuleId[];
    enabledGateways: PaymentGatewayId[];
  }): { shop: Shop; token: string } {
    const existing = simDb.getShopBySlug(data.slug);
    if (existing) {
      throw { status: 400, error: 'A shop with this slug already exists.' };
    }

    const shopId = `shop_${data.slug.replace(/[^a-z0-9]/g, '_')}`;
    const newShop: Shop = {
      id: shopId,
      name: data.name,
      slug: data.slug,
      description: data.description || 'Welcome to our store on Soko Hub.',
      category: data.category || 'General',
      location: data.location || 'Kigali, Rwanda',
      phone: data.phone || '+250 788 000 000',
      email: data.email,
      passwordHash: verifyMockPassword(data.password, '') ? '' : 'hash$sha256$mock_' + Math.random().toString(16),
      enabledModules: data.enabledModules,
      enabledGateways: data.enabledGateways,
      isSuspended: false,
      createdAt: new Date().toISOString(),
      balance: 0,
    };

    simDb.addShop(newShop);
    const token = `tok_shop_${newShop.id}_${Date.now()}`;
    simDb.setAuthSession(token, { role: 'shop_admin', shopId: newShop.id, email: newShop.email });

    this.logEvent('success', `New tenant registered: ${newShop.name} (${newShop.slug}) with modules [${data.enabledModules.join(', ')}]`);
    return { shop: newShop, token };
  }

  // ==========================================
  // SHOP ADMIN APIS (TENANT ISOLATED & GATED)
  // ==========================================

  public getAdminShopProfile(token: string, shopSlug: string): Shop {
    const { shop } = this.authenticateShop(token, shopSlug);
    return shop;
  }

  public updateShopSettings(
    token: string,
    shopSlug: string,
    updates: {
      name?: string;
      description?: string;
      phone?: string;
      enabledModules?: FeatureModuleId[];
      enabledGateways?: PaymentGatewayId[];
    }
  ): Shop {
    const { shop } = this.authenticateShop(token, shopSlug);
    const updated = simDb.updateShop(shop.id, updates);
    this.logEvent('info', `Settings updated for '${shop.name}'. Modules: [${updated.enabledModules.join(', ')}]`);
    return updated;
  }

  // Products (Always On)
  public getAdminProducts(token: string, shopSlug: string): Product[] {
    const { shop } = this.authenticateShop(token, shopSlug);
    return simDb.getProducts().filter((p) => p.shopId === shop.id);
  }

  public saveAdminProduct(token: string, shopSlug: string, productData: Partial<Product>): Product {
    const { shop } = this.authenticateShop(token, shopSlug);

    if (productData.id) {
      // Tenant isolation: verify product belongs to this shop
      const existing = simDb.getProductById(productData.id);
      if (!existing || existing.shopId !== shop.id) {
        this.logEvent('security', `404 Tenant Isolation: ${shop.name} attempted to edit product not owned by tenant`);
        throw { status: 404, error: 'Product not found' };
      }
      return simDb.updateProduct(productData.id, productData);
    } else {
      const newProduct: Product = {
        id: `prod_${shop.slug}_${Date.now().toString().slice(-5)}`,
        shopId: shop.id,
        name: productData.name || 'New Product',
        description: productData.description || '',
        category: productData.category || 'General',
        price: Math.max(0, productData.price || 1000),
        stock: Math.max(0, productData.stock || 0),
        isActive: productData.isActive !== false,
        unit: productData.unit || 'unit',
        badge: productData.badge,
        sku: productData.sku || `SKU-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString(),
      };
      simDb.addProduct(newProduct);
      this.logEvent('info', `Product created: '${newProduct.name}' in shop '${shop.name}'`);
      return newProduct;
    }
  }

  public deleteAdminProduct(token: string, shopSlug: string, productId: string): void {
    const { shop } = this.authenticateShop(token, shopSlug);
    const prod = simDb.getProductById(productId);
    if (!prod || prod.shopId !== shop.id) {
      throw { status: 404, error: 'Product not found' };
    }
    simDb.deleteProduct(productId);
    this.logEvent('info', `Product deleted #${productId} from shop ${shop.name}`);
  }

  // Orders (Gated by 'orders' module; strictly isolated to shop's line items)
  public getAdminOrders(token: string, shopSlug: string): { order: Order; shopItems: OrderItem[]; shopSubtotal: number }[] {
    const { shop } = this.authenticateShop(token, shopSlug);
    this.checkModuleEnabled(shop, 'orders');

    const allOrders = simDb.getOrders();
    const result: { order: Order; shopItems: OrderItem[]; shopSubtotal: number }[] = [];

    for (const ord of allOrders) {
      // Filter line items strictly belonging to this shop
      const shopItems = ord.items.filter((item) => item.shopId === shop.id);
      if (shopItems.length > 0) {
        const shopSubtotal = ord.shopSubtotals[shop.id] || shopItems.reduce((acc, i) => acc + i.subtotal, 0);
        result.push({
          order: ord,
          shopItems,
          shopSubtotal,
        });
      }
    }

    return result.sort((a, b) => new Date(b.order.createdAt).getTime() - new Date(a.order.createdAt).getTime());
  }

  public getAdminOrderDetail(token: string, shopSlug: string, orderId: string): { order: Order; shopItems: OrderItem[]; shopSubtotal: number } {
    const { shop } = this.authenticateShop(token, shopSlug);
    this.checkModuleEnabled(shop, 'orders');

    const ord = simDb.getOrderById(orderId);
    if (!ord) {
      throw { status: 404, error: 'Order not found' };
    }

    // Engine Rule 1: Tenant isolation: only return if order has items from this shop
    const shopItems = ord.items.filter((i) => i.shopId === shop.id);
    if (shopItems.length === 0) {
      this.logEvent('security', `404 Tenant Isolation: ${shop.name} tried to access order #${orderId} with zero items from this shop.`);
      throw { status: 404, error: 'Order not found for your shop' };
    }

    const shopSubtotal = ord.shopSubtotals[shop.id] || shopItems.reduce((acc, i) => acc + i.subtotal, 0);
    return { order: ord, shopItems, shopSubtotal };
  }

  // Customer Tracking & Analytics (Gated by 'analytics' module)
  public getAdminAnalytics(token: string, shopSlug: string): {
    revenueByDay: { date: string; amount: number; count: number }[];
    topProducts: { name: string; quantity: number; revenue: number }[];
    averageOrderValue: number;
    totalRevenue: number;
    totalOrders: number;
    cartToPaidConversionRate: number;
  } {
    const { shop } = this.authenticateShop(token, shopSlug);
    this.checkModuleEnabled(shop, 'analytics');

    const orders = simDb.getOrders().filter((o) => o.status === 'paid' && o.shopSubtotals[shop.id]);
    const shopProducts = simDb.getProducts().filter((p) => p.shopId === shop.id);

    // Group revenue by day for past 14 days
    const daysMap = new Map<string, { amount: number; count: number }>();
    let totalRevenue = 0;
    const prodSales = new Map<string, { quantity: number; revenue: number }>();

    for (const ord of orders) {
      const subtotal = ord.shopSubtotals[shop.id] || 0;
      totalRevenue += subtotal;
      const dayKey = ord.createdAt.split('T')[0];
      const existingDay = daysMap.get(dayKey) || { amount: 0, count: 0 };
      existingDay.amount += subtotal;
      existingDay.count += 1;
      daysMap.set(dayKey, existingDay);

      for (const item of ord.items) {
        if (item.shopId === shop.id) {
          const pSale = prodSales.get(item.productName) || { quantity: 0, revenue: 0 };
          pSale.quantity += item.quantity;
          pSale.revenue += item.subtotal;
          prodSales.set(item.productName, pSale);
        }
      }
    }

    const revenueByDay = Array.from(daysMap.entries())
      .map(([date, d]) => ({ date, amount: d.amount, count: d.count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topProducts = Array.from(prodSales.entries())
      .map(([name, s]) => ({ name, quantity: s.quantity, revenue: s.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const averageOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
    // Estimated conversion rate: 68.4%
    const cartToPaidConversionRate = 68.4;

    return {
      revenueByDay,
      topProducts,
      averageOrderValue,
      totalRevenue,
      totalOrders: orders.length,
      cartToPaidConversionRate,
    };
  }

  public getAdminCustomers(token: string, shopSlug: string): CustomerSummary[] {
    const { shop } = this.authenticateShop(token, shopSlug);
    this.checkModuleEnabled(shop, 'analytics');

    const orders = simDb.getOrders().filter((o) => o.status === 'paid' && o.shopSubtotals[shop.id]);
    const customerMap = new Map<string, CustomerSummary>();

    for (const ord of orders) {
      const email = ord.customerEmail;
      const subtotal = ord.shopSubtotals[shop.id] || 0;
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          email,
          name: ord.customerName,
          orderCount: 1,
          lifetimeSpend: subtotal,
          lastPurchaseDate: ord.createdAt,
          isReturning: false,
        });
      } else {
        const c = customerMap.get(email)!;
        c.orderCount += 1;
        c.lifetimeSpend += subtotal;
        c.isReturning = true;
        if (new Date(ord.createdAt) > new Date(c.lastPurchaseDate)) {
          c.lastPurchaseDate = ord.createdAt;
        }
      }
    }

    return Array.from(customerMap.values()).sort((a, b) => b.lifetimeSpend - a.lifetimeSpend);
  }

  // Delivery Processing (Gated by 'deliveries' module)
  public updateDeliveryStatus(
    token: string,
    shopSlug: string,
    orderId: string,
    itemId: string,
    newStatus: 'shipped' | 'delivered'
  ): Order {
    const { shop } = this.authenticateShop(token, shopSlug);
    this.checkModuleEnabled(shop, 'deliveries');

    const order = simDb.getOrderById(orderId);
    if (!order) {
      throw { status: 404, error: 'Order not found' };
    }

    const item = order.items.find((i) => i.id === itemId && i.shopId === shop.id);
    if (!item) {
      this.logEvent('security', `404 Tenant Isolation: Item #${itemId} does not belong to shop ${shop.name}`);
      throw { status: 404, error: 'Order line item not found for your shop' };
    }

    // Forward only progression: pending_dispatch -> shipped -> delivered
    const current = item.deliveryStatus || 'pending_dispatch';
    if (current === 'delivered') {
      throw { status: 400, error: 'Item has already reached final delivered state' };
    }
    if (current === 'shipped' && newStatus !== 'delivered') {
      throw { status: 400, error: 'Item can only transition forward to delivered' };
    }

    item.deliveryStatus = newStatus;
    if (newStatus === 'delivered') {
      item.deliveredAt = new Date().toISOString();
    }

    const updated = simDb.updateOrder(order.id, { items: order.items });
    this.logEvent('info', `Delivery status for item #${itemId} (${item.productName}) changed to ${newStatus}`);
    return updated;
  }

  // Quotations (Gated by 'quotations' module)
  public getAdminQuotations(token: string, shopSlug: string): QuotationRequest[] {
    const { shop } = this.authenticateShop(token, shopSlug);
    this.checkModuleEnabled(shop, 'quotations');
    return simDb.getQuotations().filter((q) => q.shopId === shop.id);
  }

  public submitQuotationResponse(
    token: string,
    shopSlug: string,
    quoteId: string,
    response: { status: 'quoted' | 'rejected'; offeredPrice?: number }
  ): QuotationRequest {
    const { shop } = this.authenticateShop(token, shopSlug);
    this.checkModuleEnabled(shop, 'quotations');

    const q = simDb.getQuotations().find((item) => item.id === quoteId && item.shopId === shop.id);
    if (!q) {
      throw { status: 404, error: 'Quotation request not found' };
    }

    const updated = simDb.updateQuotation(quoteId, {
      status: response.status,
      offeredPrice: response.offeredPrice,
      respondedAt: new Date().toISOString(),
    });
    this.logEvent('info', `Quotation #${quoteId} responded: ${response.status} (Offered: ${response.offeredPrice} RWF)`);
    return updated;
  }

  public requestQuotationPublic(request: {
    shopId: string;
    productId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    requestedQuantity: number;
    notes: string;
  }): QuotationRequest {
    const shop = simDb.getShopById(request.shopId);
    if (!shop || !shop.enabledModules.includes('quotations')) {
      throw { status: 403, error: 'This shop does not accept quotation requests.' };
    }
    const product = simDb.getProductById(request.productId);
    if (!product) {
      throw { status: 404, error: 'Product not found' };
    }

    const newQuote: QuotationRequest = {
      id: `quote_${Date.now().toString().slice(-4)}`,
      shopId: shop.id,
      productId: product.id,
      productName: product.name,
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      customerPhone: request.customerPhone,
      requestedQuantity: request.requestedQuantity,
      notes: request.notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    simDb.addQuotation(newQuote);
    this.logEvent('info', `New quotation request submitted for ${product.name} to ${shop.name}`);
    return newQuote;
  }

  // Purchase Requests (Gated by 'purchase_requests' module)
  public getAdminPurchaseRequests(token: string, shopSlug: string): PurchaseRequest[] {
    const { shop } = this.authenticateShop(token, shopSlug);
    this.checkModuleEnabled(shop, 'purchase_requests');
    return simDb.getPurchaseRequests().filter((pr) => pr.shopId === shop.id);
  }

  public createPurchaseRequest(
    token: string,
    shopSlug: string,
    request: {
      supplierName: string;
      itemName: string;
      quantity: number;
      estimatedCost: number;
      notes: string;
    }
  ): PurchaseRequest {
    const { shop } = this.authenticateShop(token, shopSlug);
    this.checkModuleEnabled(shop, 'purchase_requests');

    const newPr: PurchaseRequest = {
      id: `pr_${Date.now().toString().slice(-4)}`,
      shopId: shop.id,
      supplierName: request.supplierName,
      itemName: request.itemName,
      quantity: request.quantity,
      estimatedCost: request.estimatedCost,
      status: 'submitted',
      notes: request.notes,
      createdAt: new Date().toISOString(),
    };

    simDb.addPurchaseRequest(newPr);
    this.logEvent('info', `Purchase request #${newPr.id} created for supplier '${request.supplierName}'`);
    return newPr;
  }

  // Payouts (Always On)
  public getAdminPayouts(token: string, shopSlug: string): { payouts: Payout[]; runningTotalNet: number; totalGross: number; totalFees: number } {
    const { shop } = this.authenticateShop(token, shopSlug);
    const payouts = simDb.getPayouts().filter((p) => p.shopId === shop.id);
    let runningTotalNet = 0;
    let totalGross = 0;
    let totalFees = 0;

    for (const p of payouts) {
      runningTotalNet += p.netAmount;
      totalGross += p.grossAmount;
      totalFees += p.platformFeeAmount;
    }

    return {
      payouts: payouts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      runningTotalNet,
      totalGross,
      totalFees,
    };
  }

  // ==========================================
  // PLATFORM OPERATOR APIS
  // ==========================================

  public getOperatorStats(token: string): {
    shops: (Shop & { totalOrders: number; gmv: number; feeEarnings: number })[];
    totalGmv: number;
    totalPlatformFees: number;
    totalOrdersCount: number;
    feeEarningsByDay: { date: string; amount: number }[];
  } {
    this.authenticateOperator(token);
    const shops = simDb.getShops();
    const orders = simDb.getOrders().filter((o) => o.status === 'paid');
    const payouts = simDb.getPayouts();

    let totalGmv = 0;
    let totalPlatformFees = 0;

    const shopsWithStats = shops.map((shop) => {
      const shopPayouts = payouts.filter((p) => p.shopId === shop.id);
      const shopGmv = shopPayouts.reduce((acc, p) => acc + p.grossAmount, 0);
      const feeEarnings = shopPayouts.reduce((acc, p) => acc + p.platformFeeAmount, 0);
      const totalOrders = orders.filter((o) => o.shopSubtotals[shop.id]).length;

      totalGmv += shopGmv;
      totalPlatformFees += feeEarnings;

      return {
        ...shop,
        totalOrders,
        gmv: shopGmv,
        feeEarnings,
      };
    });

    const feeByDayMap = new Map<string, number>();
    for (const p of payouts) {
      const date = p.createdAt.split('T')[0];
      feeByDayMap.set(date, (feeByDayMap.get(date) || 0) + p.platformFeeAmount);
    }

    const feeEarningsByDay = Array.from(feeByDayMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      shops: shopsWithStats,
      totalGmv,
      totalPlatformFees,
      totalOrdersCount: orders.length,
      feeEarningsByDay,
    };
  }

  public setShopSuspension(token: string, shopId: string, suspend: boolean): Shop {
    this.authenticateOperator(token);
    const shop = simDb.getShopById(shopId);
    if (!shop) {
      throw { status: 404, error: 'Shop not found' };
    }
    const updated = simDb.updateShop(shopId, { isSuspended: suspend });
    this.logEvent(
      suspend ? 'warn' : 'info',
      `Platform Operator ${suspend ? 'SUSPENDED' : 'REACTIVATED'} shop '${shop.name}' (${shop.slug})`
    );
    return updated;
  }
}

export const simEngine = new SimEngine();
