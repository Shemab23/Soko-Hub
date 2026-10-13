import { create } from 'zustand';
import { ApiLogEntry, EventLogEntry, AppNotification, SecurityTestResult } from '../types';

interface MonitorState {
  isOpen: boolean;
  activeTab: 'events' | 'requests' | 'state' | 'security' | 'assertions';
  eventLogs: EventLogEntry[];
  apiLogs: ApiLogEntry[];
  selectedRequest: ApiLogEntry | null;
  notifications: AppNotification[];
  securityTests: SecurityTestResult[];
  theme: 'light' | 'dark';
  
  // Actions
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  setActiveTab: (tab: 'events' | 'requests' | 'state' | 'security' | 'assertions') => void;
  addEventLog: (entry: Omit<EventLogEntry, 'id' | 'timestamp'>) => void;
  clearEventLogs: () => void;
  addApiLog: (entry: Omit<ApiLogEntry, 'id' | 'timestamp'>) => void;
  clearApiLogs: () => void;
  setSelectedRequest: (entry: ApiLogEntry | null) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  setSecurityTestResult: (id: string, update: Partial<SecurityTestResult>) => void;
  resetSecurityTests: () => void;
  toggleTheme: () => void;
}

const INITIAL_SECURITY_TESTS: SecurityTestResult[] = [
  {
    id: 'test_tenant_isolation',
    name: 'Tenant Isolation: Read sibling shop order',
    description: 'Shop A attempts to fetch Order items belonging exclusively to Shop B.',
    expectedStatus: 404,
    status: 'idle',
  },
  {
    id: 'test_feature_gating',
    name: 'Feature Gating: Call disabled analytics module',
    description: 'Umuco Electronics (analytics module disabled) attempts to query analytics endpoint.',
    expectedStatus: 403,
    status: 'idle',
  },
  {
    id: 'test_forged_price',
    name: 'Tamper Protection: Forged cart checkout price',
    description: 'Client checkout payload submits product at 100 RWF instead of database price.',
    expectedStatus: 'Price Recalculated',
    status: 'idle',
  },
  {
    id: 'test_webhook_idempotency',
    name: 'Idempotency: Replay identical webhook event',
    description: 'Send already processed webhook evt_id; must acknowledge with 200 and not duplicate stock reduction or payouts.',
    expectedStatus: '200 (duplicate_ignored)',
    status: 'idle',
  },
  {
    id: 'test_bad_signature',
    name: 'Security: Webhook with corrupt HMAC signature',
    description: 'Simulate corrupted payment webhook signature; engine must reject with 401 and keep order unpaid.',
    expectedStatus: 401,
    status: 'idle',
  },
  {
    id: 'test_disabled_gateway',
    name: 'Gateway Enforcement: Pay with unapproved gateway',
    description: 'Attempt payment checkout with Flutterwave when shop cart prohibits it.',
    expectedStatus: 400,
    status: 'idle',
  },
  {
    id: 'test_guest_session_tampering',
    name: 'Session Integrity: Tamper with guest session',
    description: 'Tamper with guest session signature; engine must discard session, reset cart, and protect data.',
    expectedStatus: 'Cart Reset / New Guest',
    status: 'idle',
  },
  {
    id: 'test_sibling_receipt_access',
    name: 'Receipt Privacy: Access receipt from other guest session',
    description: 'Attempt to view an order receipt without matching authenticated guest session id.',
    expectedStatus: 404,
    status: 'idle',
  },
];

export const useMonitorStore = create<MonitorState>((set) => ({
  isOpen: false,
  activeTab: 'events',
  eventLogs: [
    {
      id: 'init_1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'Soko Hub simulated backend initialized with 3 tenants: Kigali Fresh, Umuco Electronics, Gisenyi Books.',
    },
    {
      id: 'init_2',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'Security sandbox enabled: strict tenant isolation, server-side price recomputation, HMAC webhook verification active.',
    },
  ],
  apiLogs: [],
  selectedRequest: null,
  notifications: [],
  securityTests: INITIAL_SECURITY_TESTS,
  theme: 'light',

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  addEventLog: (entry) =>
    set((state) => ({
      eventLogs: [
        {
          id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toLocaleTimeString(),
          ...entry,
        },
        ...state.eventLogs.slice(0, 199), // Keep latest 200
      ],
    })),

  clearEventLogs: () => set({ eventLogs: [] }),

  addApiLog: (entry) =>
    set((state) => ({
      apiLogs: [
        {
          id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toLocaleTimeString(),
          ...entry,
        },
        ...state.apiLogs.slice(0, 99), // Keep latest 100
      ],
    })),

  clearApiLogs: () => set({ apiLogs: [], selectedRequest: null }),

  setSelectedRequest: (entry) => set({ selectedRequest: entry }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toLocaleTimeString(),
          read: false,
          ...notification,
        },
        ...state.notifications.slice(0, 19),
      ],
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  setSecurityTestResult: (id, update) =>
    set((state) => ({
      securityTests: state.securityTests.map((t) => (t.id === id ? { ...t, ...update } : t)),
    })),

  resetSecurityTests: () => set({ securityTests: INITIAL_SECURITY_TESTS }),

  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: nextTheme };
    }),
}));
