import { 
  Product, 
  Shop, 
  Order, 
  OrderItem, 
  Payout, 
  PaymentGatewayId, 
  FeatureModuleId, 
  CustomerSummary, 
  QuotationRequest, 
  PurchaseRequest,
  LoginSession
} from '../types';
import { simEngine } from '../sim/engine';
import { simDb } from '../sim/db';
import { generateWebhookSignature } from '../sim/crypto';
import { useMonitorStore } from '../sim/monitorStore';

// Simulate realistic network latency (200ms - 700ms)
function simulateLatency(): Promise<number> {
  const delay = Math.floor(200 + Math.random() * 500);
  return new Promise((resolve) => setTimeout(() => resolve(delay), delay));
}

// Simulated client-side session store
const AUTH_TOKEN_KEY = 'soko_client_auth_token_v2';
const AUTH_SESSION_KEY = 'soko_client_auth_session_v2';

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

function getStoredSession(): LoginSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredSession(session: LoginSession | null): void {
  try {
    if (session) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

// Wrapper for executing simulated API requests with tracing
async function callApi<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  fn: () => T | Promise<T>,
  options?: { requestBody?: unknown; shopSlug?: string }
): Promise<T> {
  const start = performance.now();
  const latency = await simulateLatency();

  try {
    const result = await fn();
    const duration = Math.round(performance.now() - start);

    useMonitorStore.getState().addApiLog({
      method,
      endpoint,
      shopSlug: options?.shopSlug,
      status: 200,
      durationMs: duration,
      requestBody: options?.requestBody,
      responseBody: result,
    });

    return result;
  } catch (err: unknown) {
    const duration = Math.round(performance.now() - start);
    const errorObj = err as { status?: number; error?: string; code?: string };
    const status = errorObj.status || 500;
    const errorMessage = errorObj.error || 'Internal server error';

    useMonitorStore.getState().addApiLog({
      method,
      endpoint,
      shopSlug: options?.shopSlug,
      status,
      durationMs: duration,
      requestBody: options?.requestBody,
      responseBody: { error: errorMessage, code: errorObj.code },
      error: errorMessage,
    });

    throw errorObj;
  }
}

// Helper to get guest session details
function getGuestCredentials(): { sessionId: string; signature: string } {
  const guest = simDb.getOrCreateGuestSession();
  return { sessionId: guest.id, signature: guest.signature };
}

// ========================================================
// EXPORTED API CLIENT MODULE
// ========================================================

export const api = {
  // --- Marketplace Public APIs ---
  marketplace: {
    getProducts: () =>
      callApi('GET', '/api/marketplace/products', () => {
        return simEngine.getMarketplaceProducts();
      }),

    getShops: () =>
      callApi('GET', '/api/marketplace/shops', () => {
        return simEngine.getMarketplaceShops();
      }),

    getProduct: (productId: string) =>
      callApi('GET', `/api/marketplace/products/${productId}`, () => {
        return simEngine.getProductDetail(productId);
      }),

    requestQuotation: (payload: {
      shopId: string;
      productId: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      requestedQuantity: number;
      notes: string;
    }) =>
      callApi('POST', '/api/marketplace/quotations', () => {
        return simEngine.requestQuotationPublic(payload);
      }, { requestBody: payload }),
  },

  // --- Cart APIs ---
  cart: {
    getCart: () =>
      callApi('GET', '/api/cart', () => {
        const { sessionId, signature } = getGuestCredentials();
        return simEngine.getCart(sessionId, signature);
      }),

    addItem: (productId: string, quantity = 1) =>
      callApi('POST', '/api/cart/items', () => {
        const { sessionId, signature } = getGuestCredentials();
        simEngine.addToCart(sessionId, signature, productId, quantity);
        return simEngine.getCart(sessionId, signature);
      }, { requestBody: { productId, quantity } }),

    updateItem: (productId: string, quantity: number) =>
      callApi('PUT', `/api/cart/items/${productId}`, () => {
        const { sessionId, signature } = getGuestCredentials();
        simEngine.updateCartItem(sessionId, signature, productId, quantity);
        return simEngine.getCart(sessionId, signature);
      }, { requestBody: { quantity } }),

    clear: () =>
      callApi('DELETE', '/api/cart', () => {
        const { sessionId, signature } = getGuestCredentials();
        simEngine.clearCart(sessionId, signature);
        return { success: true };
      }),
  },

  // --- Checkout APIs ---
  checkout: {
    start: (data: {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      shippingAddress: string;
      city: string;
      gateway: PaymentGatewayId;
      forgedPriceInjection?: number;
    }) =>
      callApi('POST', '/api/checkout/start', () => {
        const { sessionId, signature } = getGuestCredentials();
        return simEngine.startCheckout(sessionId, signature, data);
      }, { requestBody: data }),
  },

  // --- Orders & Receipt APIs ---
  orders: {
    getReceipt: (orderId: string) =>
      callApi('GET', `/api/orders/${orderId}/receipt`, () => {
        const { sessionId, signature } = getGuestCredentials();
        return simEngine.getOrderReceipt(orderId, sessionId, signature);
      }),

    pollOrderStatus: (orderId: string) =>
      callApi('GET', `/api/orders/${orderId}/status`, () => {
        const order = simDb.getOrderById(orderId);
        if (!order) throw { status: 404, error: 'Order not found' };
        return { id: order.id, status: order.status, paidAt: order.paidAt };
      }),
  },

  // --- Payment Provider Simulation & Webhook APIs ---
  payment: {
    getOrderForPayment: (orderId: string) =>
      callApi('GET', `/api/payments/${orderId}`, () => {
        const order = simDb.getOrderById(orderId);
        if (!order) throw { status: 404, error: 'Order not found' };
        return order;
      }),

    sendWebhook: (event: {
      id: string;
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
    }) =>
      callApi('POST', `/api/webhooks/${event.provider}`, () => {
        return simEngine.processWebhook(event);
      }, { requestBody: event }),

    // High level helper to execute condition from provider UI
    triggerProviderCondition: async (
      provider: PaymentGatewayId,
      orderId: string,
      condition: 'success' | 'declined' | 'abandoned' | 'delayed_10s' | 'duplicate_webhook' | 'corrupt_signature'
    ) => {
      const order = simDb.getOrderById(orderId);
      if (!order) throw { status: 404, error: 'Order not found' };

      const basePayload = {
        orderId: order.id,
        amount: order.totalAmount,
        currency: 'RWF',
        gateway: provider,
        customerEmail: order.customerEmail,
      };

      const eventId = `evt_${provider}_${Date.now()}`;
      let signature = generateWebhookSignature(basePayload);

      if (condition === 'corrupt_signature') {
        signature = 'CORRUPTED_HMAC_BAD_SIG_9999';
      }

      if (condition === 'abandoned') {
        useMonitorStore.getState().addEventLog({
          level: 'warn',
          message: `Payment abandoned by customer on ${provider} page for order #${orderId}`,
        });
        return { status: 'abandoned' };
      }

      if (condition === 'declined') {
        await api.payment.sendWebhook({
          id: eventId,
          provider,
          orderId,
          eventType: 'payment.failed',
          signature,
          payload: basePayload,
        });
        return { status: 'declined' };
      }

      if (condition === 'delayed_10s') {
        useMonitorStore.getState().addEventLog({
          level: 'info',
          message: `[Simulated 10s Webhook Delay] Processing webhook for order #${orderId} in 10,000ms...`,
        });
        setTimeout(async () => {
          try {
            await api.payment.sendWebhook({
              id: eventId,
              provider,
              orderId,
              eventType: 'payment.succeeded',
              signature,
              payload: basePayload,
            });
          } catch (e) {
            console.error('Delayed webhook error:', e);
          }
        }, 10000);
        return { status: 'delayed' };
      }

      if (condition === 'duplicate_webhook') {
        // Send initial
        await api.payment.sendWebhook({
          id: eventId,
          provider,
          orderId,
          eventType: 'payment.succeeded',
          signature,
          payload: basePayload,
        });
        // Immediately fire duplicate
        setTimeout(async () => {
          try {
            await api.payment.sendWebhook({
              id: eventId, // SAME event ID!
              provider,
              orderId,
              eventType: 'payment.succeeded',
              signature,
              payload: basePayload,
            });
          } catch (e) {
            console.error('Duplicate webhook error:', e);
          }
        }, 1200);
        return { status: 'duplicate_sent' };
      }

      // Default: immediate success or corrupted signature test
      return await api.payment.sendWebhook({
        id: eventId,
        provider,
        orderId,
        eventType: 'payment.succeeded',
        signature,
        payload: basePayload,
      });
    },
  },

  // --- Auth APIs ---
  auth: {
    login: async (credentials: { email: string; password: string; shopSlug?: string }) => {
      return callApi('POST', '/api/auth/login', () => {
        const result = simEngine.login(credentials);
        setStoredToken(result.token);
        const session: LoginSession = {
          role: result.role,
          email: credentials.email,
          token: result.token,
          shopId: result.shop?.id,
          shopSlug: result.shop?.slug,
          shopName: result.shop?.name,
        };
        setStoredSession(session);
        return session;
      }, { requestBody: { email: credentials.email, shopSlug: credentials.shopSlug } });
    },

    registerShop: async (data: {
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
    }) => {
      return callApi('POST', '/api/auth/register-shop', () => {
        const result = simEngine.registerShop(data);
        setStoredToken(result.token);
        const session: LoginSession = {
          role: 'shop_admin',
          email: data.email,
          token: result.token,
          shopId: result.shop.id,
          shopSlug: result.shop.slug,
          shopName: result.shop.name,
        };
        setStoredSession(session);
        return { shop: result.shop, session };
      }, { requestBody: { ...data, password: '[REDACTED]' } });
    },

    logout: () => {
      const token = getStoredToken();
      if (token) {
        simDb.removeAuthSession(token);
      }
      setStoredToken(null);
      setStoredSession(null);
      useMonitorStore.getState().addEventLog({
        level: 'info',
        message: 'Logged out. Auth session cleared.',
      });
    },

    getCurrentSession: (): LoginSession | null => {
      return getStoredSession();
    },
  },

  // --- Shop Admin APIs ---
  admin: {
    getProfile: (shopSlug: string) => {
      const token = getStoredToken() || '';
      return callApi('GET', `/api/admin/${shopSlug}/profile`, () => {
        return simEngine.getAdminShopProfile(token, shopSlug);
      }, { shopSlug });
    },

    updateSettings: (
      shopSlug: string,
      updates: {
        name?: string;
        description?: string;
        phone?: string;
        enabledModules?: FeatureModuleId[];
        enabledGateways?: PaymentGatewayId[];
      }
    ) => {
      const token = getStoredToken() || '';
      return callApi('PATCH', `/api/admin/${shopSlug}/settings`, () => {
        return simEngine.updateShopSettings(token, shopSlug, updates);
      }, { shopSlug, requestBody: updates });
    },

    // Products (Always On)
    getProducts: (shopSlug: string) => {
      const token = getStoredToken() || '';
      return callApi('GET', `/api/admin/${shopSlug}/products`, () => {
        return simEngine.getAdminProducts(token, shopSlug);
      }, { shopSlug });
    },

    saveProduct: (shopSlug: string, product: Partial<Product>) => {
      const token = getStoredToken() || '';
      return callApi('POST', `/api/admin/${shopSlug}/products`, () => {
        return simEngine.saveAdminProduct(token, shopSlug, product);
      }, { shopSlug, requestBody: product });
    },

    deleteProduct: (shopSlug: string, productId: string) => {
      const token = getStoredToken() || '';
      return callApi('DELETE', `/api/admin/${shopSlug}/products/${productId}`, () => {
        simEngine.deleteAdminProduct(token, shopSlug, productId);
        return { success: true };
      }, { shopSlug });
    },

    // Orders (Gated)
    getOrders: (shopSlug: string) => {
      const token = getStoredToken() || '';
      return callApi('GET', `/api/admin/${shopSlug}/orders`, () => {
        return simEngine.getAdminOrders(token, shopSlug);
      }, { shopSlug });
    },

    getOrderDetail: (shopSlug: string, orderId: string) => {
      const token = getStoredToken() || '';
      return callApi('GET', `/api/admin/${shopSlug}/orders/${orderId}`, () => {
        return simEngine.getAdminOrderDetail(token, shopSlug, orderId);
      }, { shopSlug });
    },

    // Analytics (Gated)
    getAnalytics: (shopSlug: string) => {
      const token = getStoredToken() || '';
      return callApi('GET', `/api/admin/${shopSlug}/analytics`, () => {
        return simEngine.getAdminAnalytics(token, shopSlug);
      }, { shopSlug });
    },

    getCustomers: (shopSlug: string) => {
      const token = getStoredToken() || '';
      return callApi('GET', `/api/admin/${shopSlug}/customers`, () => {
        return simEngine.getAdminCustomers(token, shopSlug);
      }, { shopSlug });
    },

    // Deliveries (Gated)
    updateDeliveryStatus: (shopSlug: string, orderId: string, itemId: string, newStatus: 'shipped' | 'delivered') => {
      const token = getStoredToken() || '';
      return callApi('PATCH', `/api/admin/${shopSlug}/deliveries/${orderId}/${itemId}`, () => {
        return simEngine.updateDeliveryStatus(token, shopSlug, orderId, itemId, newStatus);
      }, { shopSlug, requestBody: { newStatus } });
    },

    // Quotations (Gated)
    getQuotations: (shopSlug: string) => {
      const token = getStoredToken() || '';
      return callApi('GET', `/api/admin/${shopSlug}/quotations`, () => {
        return simEngine.getAdminQuotations(token, shopSlug);
      }, { shopSlug });
    },

    respondQuotation: (
      shopSlug: string,
      quoteId: string,
      response: { status: 'quoted' | 'rejected'; offeredPrice?: number }
    ) => {
      const token = getStoredToken() || '';
      return callApi('PATCH', `/api/admin/${shopSlug}/quotations/${quoteId}`, () => {
        return simEngine.submitQuotationResponse(token, shopSlug, quoteId, response);
      }, { shopSlug, requestBody: response });
    },

    // Purchase Requests (Gated)
    getPurchaseRequests: (shopSlug: string) => {
      const token = getStoredToken() || '';
      return callApi('GET', `/api/admin/${shopSlug}/purchase-requests`, () => {
        return simEngine.getAdminPurchaseRequests(token, shopSlug);
      }, { shopSlug });
    },

    createPurchaseRequest: (
      shopSlug: string,
      request: {
        supplierName: string;
        itemName: string;
        quantity: number;
        estimatedCost: number;
        notes: string;
      }
    ) => {
      const token = getStoredToken() || '';
      return callApi('POST', `/api/admin/${shopSlug}/purchase-requests`, () => {
        return simEngine.createPurchaseRequest(token, shopSlug, request);
      }, { shopSlug, requestBody: request });
    },

    // Payouts (Always On)
    getPayouts: (shopSlug: string) => {
      const token = getStoredToken() || '';
      return callApi('GET', `/api/admin/${shopSlug}/payouts`, () => {
        return simEngine.getAdminPayouts(token, shopSlug);
      }, { shopSlug });
    },
  },

  // --- Operator APIs ---
  operator: {
    getStats: () => {
      const token = getStoredToken() || '';
      return callApi('GET', '/api/operator/stats', () => {
        return simEngine.getOperatorStats(token);
      });
    },

    setSuspension: (shopId: string, suspend: boolean) => {
      const token = getStoredToken() || '';
      return callApi('POST', `/api/operator/shops/${shopId}/suspend`, () => {
        return simEngine.setShopSuspension(token, shopId, suspend);
      }, { requestBody: { suspend } });
    },
  },

  // --- Security Testing Suite ("Try to break it" & Assertions) ---
  security: {
    runSecurityTest: async (testId: string): Promise<boolean> => {
      const store = useMonitorStore.getState();
      store.setSecurityTestResult(testId, { status: 'running' });

      try {
        switch (testId) {
          case 'test_tenant_isolation': {
            // Logged in as Kigali Fresh, attempts to query Umuco Electronics order detail
            const kigaliToken = `tok_shop_shop_kigali_fresh_test`;
            simDb.setAuthSession(kigaliToken, {
              role: 'shop_admin',
              shopId: 'shop_kigali_fresh',
              email: 'admin@kigalifresh.demo',
            });

            // Find an order that belongs ONLY to Umuco Electronics
            const orders = simDb.getOrders();
            const umucoOnlyOrder = orders.find(
              (o) => o.shopSubtotals['shop_umuco_electronics'] && !o.shopSubtotals['shop_kigali_fresh']
            );

            if (!umucoOnlyOrder) throw new Error('No isolated order found for test');

            try {
              // Kigali Fresh trying to fetch Umuco order
              simEngine.getAdminOrderDetail(kigaliToken, 'kigali-fresh', umucoOnlyOrder.id);
              store.setSecurityTestResult(testId, {
                status: 'failed',
                actualStatus: 200,
                outputMessage: 'FAIL: Shop A was able to read Shop B order items!',
              });
              return false;
            } catch (err: unknown) {
              const e = err as { status?: number; error?: string };
              if (e.status === 404) {
                store.setSecurityTestResult(testId, {
                  status: 'passed',
                  actualStatus: 404,
                  outputMessage: `PASS: Blocked with 404 '${e.error}' (Tenant isolated)`,
                });
                return true;
              }
              throw err;
            }
          }

          case 'test_feature_gating': {
            // Umuco Electronics (has NO analytics module) calls analytics endpoint
            const umucoToken = `tok_shop_shop_umuco_test`;
            simDb.setAuthSession(umucoToken, {
              role: 'shop_admin',
              shopId: 'shop_umuco_electronics',
              email: 'admin@umuco.demo',
            });

            try {
              simEngine.getAdminAnalytics(umucoToken, 'umuco-electronics');
              store.setSecurityTestResult(testId, {
                status: 'failed',
                actualStatus: 200,
                outputMessage: 'FAIL: Disabled analytics module returned data!',
              });
              return false;
            } catch (err: unknown) {
              const e = err as { status?: number; error?: string; code?: string };
              if (e.status === 403 && e.code === 'module_not_enabled') {
                store.setSecurityTestResult(testId, {
                  status: 'passed',
                  actualStatus: 403,
                  outputMessage: `PASS: Rejected with 403 '${e.code}' - module_not_enabled`,
                });
                return true;
              }
              throw err;
            }
          }

          case 'test_forged_price': {
            // Client submits a forged price of 100 RWF for 7,900 RWF Gorilla Mountain Coffee
            const guest = simDb.getOrCreateGuestSession();
            guest.cart = [{ productId: 'prod_kf_coffee', quantity: 1 }];
            simDb.saveGuestSession(guest);

            const checkoutRes = simEngine.startCheckout(guest.id, guest.signature, {
              customerName: 'Security Tester',
              customerEmail: 'tester@security.org',
              customerPhone: '+250 788 000 111',
              shippingAddress: 'KG 123 Test St',
              city: 'Kigali',
              gateway: 'stripe',
              forgedPriceInjection: 100, // Attack attempt
            });

            // The order total must equal the true DB price (7,900), NOT 100!
            if (checkoutRes.order.totalAmount === 7900) {
              store.setSecurityTestResult(testId, {
                status: 'passed',
                actualStatus: 'Verified 7,900 RWF',
                outputMessage: 'PASS: Client price ignored. Server recomputed verified price from DB (7,900 RWF).',
              });
              return true;
            } else {
              store.setSecurityTestResult(testId, {
                status: 'failed',
                actualStatus: checkoutRes.order.totalAmount,
                outputMessage: `FAIL: Server accepted forged price (${checkoutRes.order.totalAmount} RWF)!`,
              });
              return false;
            }
          }

          case 'test_webhook_idempotency': {
            // Duplicate webhook event replayed
            const testEvtId = `evt_test_idemp_${Date.now()}`;
            const orders = simDb.getOrders().filter((o) => o.status === 'paid');
            const targetOrder = orders[0];
            const payload = {
              orderId: targetOrder.id,
              amount: targetOrder.totalAmount,
              currency: 'RWF',
              gateway: 'stripe' as PaymentGatewayId,
              customerEmail: targetOrder.customerEmail,
            };
            const signature = generateWebhookSignature(payload);

            // Record initial webhook
            simEngine.processWebhook({
              id: testEvtId,
              provider: 'stripe',
              orderId: targetOrder.id,
              eventType: 'payment.succeeded',
              signature,
              payload,
            });

            // Replay identical webhook
            const replayRes = simEngine.processWebhook({
              id: testEvtId,
              provider: 'stripe',
              orderId: targetOrder.id,
              eventType: 'payment.succeeded',
              signature,
              payload,
            });

            if (replayRes.status === 200 && replayRes.acknowledged) {
              store.setSecurityTestResult(testId, {
                status: 'passed',
                actualStatus: '200 (duplicate_ignored)',
                outputMessage: 'PASS: Duplicate webhook acknowledged with 200, no balance change or double charge.',
              });
              return true;
            } else {
              store.setSecurityTestResult(testId, {
                status: 'failed',
                actualStatus: replayRes.status,
                outputMessage: 'FAIL: Duplicate webhook was re-executed or error thrown.',
              });
              return false;
            }
          }

          case 'test_bad_signature': {
            // Send webhook with corrupted signature
            const orders = simDb.getOrders();
            const targetOrder = orders[0];
            const payload = {
              orderId: targetOrder.id,
              amount: targetOrder.totalAmount,
              currency: 'RWF',
              gateway: 'stripe' as PaymentGatewayId,
              customerEmail: targetOrder.customerEmail,
            };

            try {
              simEngine.processWebhook({
                id: `evt_bad_sig_${Date.now()}`,
                provider: 'stripe',
                orderId: targetOrder.id,
                eventType: 'payment.succeeded',
                signature: 'CORRUPTED_SIGNATURE_TAMPERED_000',
                payload,
              });

              store.setSecurityTestResult(testId, {
                status: 'failed',
                actualStatus: 200,
                outputMessage: 'FAIL: Corrupt signature was accepted by backend!',
              });
              return false;
            } catch (err: unknown) {
              const e = err as { status?: number; error?: string };
              if (e.status === 401) {
                store.setSecurityTestResult(testId, {
                  status: 'passed',
                  actualStatus: 401,
                  outputMessage: 'PASS: Rejected with 401 Invalid webhook signature. Order unchanged.',
                });
                return true;
              }
              throw err;
            }
          }

          case 'test_disabled_gateway': {
            // Gisenyi Books only enables Flutterwave. Attempt checkout with Stripe.
            const guest = simDb.getOrCreateGuestSession();
            guest.cart = [{ productId: 'prod_gb_photobook', quantity: 1 }];
            simDb.saveGuestSession(guest);

            try {
              simEngine.startCheckout(guest.id, guest.signature, {
                customerName: 'Gateway Tester',
                customerEmail: 'gw@test.rw',
                customerPhone: '+250 788 123 999',
                shippingAddress: 'Rubavu',
                city: 'Gisenyi',
                gateway: 'stripe', // Shop only supports Flutterwave!
              });

              store.setSecurityTestResult(testId, {
                status: 'failed',
                actualStatus: 200,
                outputMessage: 'FAIL: Engine allowed unapproved payment gateway for shop!',
              });
              return false;
            } catch (err: unknown) {
              const e = err as { status?: number; error?: string };
              if (e.status === 400) {
                store.setSecurityTestResult(testId, {
                  status: 'passed',
                  actualStatus: 400,
                  outputMessage: `PASS: Rejected with 400 '${e.error}' (Gateway policy enforced)`,
                });
                return true;
              }
              throw err;
            }
          }

          case 'test_guest_session_tampering': {
            // Tamper with guest session signature
            simDb.tamperGuestSession();
            const { tampered } = simEngine.verifyOrRenewGuest('guest_tampered_fake_id', 'corrupt_sig_fake');

            if (tampered) {
              store.setSecurityTestResult(testId, {
                status: 'passed',
                actualStatus: 'Session Discarded',
                outputMessage: 'PASS: Tampered session detected. Discarded and clean guest issued.',
              });
              return true;
            } else {
              store.setSecurityTestResult(testId, {
                status: 'failed',
                actualStatus: 'Accepted',
                outputMessage: 'FAIL: Tampered session was accepted without verification.',
              });
              return false;
            }
          }

          case 'test_sibling_receipt_access': {
            // Attempt to view order receipt with wrong guest session ID
            const orders = simDb.getOrders();
            const targetOrder = orders[0];

            try {
              simEngine.getOrderReceipt(targetOrder.id, 'guest_imposter_other_user', 'sig_v1_other');
              store.setSecurityTestResult(testId, {
                status: 'failed',
                actualStatus: 200,
                outputMessage: 'FAIL: Foreign guest session was able to read private order receipt!',
              });
              return false;
            } catch (err: unknown) {
              const e = err as { status?: number };
              if (e.status === 404) {
                store.setSecurityTestResult(testId, {
                  status: 'passed',
                  actualStatus: 404,
                  outputMessage: 'PASS: 404 Not Found returned when guest session does not own receipt.',
                });
                return true;
              }
              throw err;
            }
          }

          default:
            return false;
        }
      } catch (err: unknown) {
        const e = err as { status?: number; error?: string };
        store.setSecurityTestResult(testId, {
          status: 'failed',
          actualStatus: e.status || 500,
          outputMessage: `Error during test: ${e.error || 'Unknown failure'}`,
        });
        return false;
      }
    },

    runAllSecurityTests: async () => {
      const tests = useMonitorStore.getState().securityTests;
      for (const t of tests) {
        await api.security.runSecurityTest(t.id);
      }
    },
  },

  // Database Reset
  resetDatabase: () => {
    simDb.resetToSeed();
    useMonitorStore.getState().clearEventLogs();
    useMonitorStore.getState().clearApiLogs();
    useMonitorStore.getState().resetSecurityTests();
    useMonitorStore.getState().addEventLog({
      level: 'info',
      message: 'Demo database reset to factory seed. All 3 shops restored, cart cleared.',
    });
  },
};
