export type DemoOrder = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  items: unknown;
  total_cents: number;
  payment_status: string;
  fulfillment_status: string;
  privacy_accepted: boolean;
  marketing_consent: boolean;
  created_at: string;
  stripe_session_id?: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __DEMO_ORDERS__: DemoOrder[] | undefined;
  // eslint-disable-next-line no-var
  var __DEMO_STORE_OPEN__: boolean | undefined;
}

if (!globalThis.__DEMO_ORDERS__) {
  globalThis.__DEMO_ORDERS__ = [];
}

if (typeof globalThis.__DEMO_STORE_OPEN__ !== "boolean") {
  globalThis.__DEMO_STORE_OPEN__ = true;
}

export const getDemoOrders = () => globalThis.__DEMO_ORDERS__!;

export const addDemoOrder = (order: DemoOrder) => {
  globalThis.__DEMO_ORDERS__!.unshift(order);
};

export const updateDemoOrder = (id: string, updates: Partial<DemoOrder>) => {
  const item = globalThis.__DEMO_ORDERS__!.find(o => o.id === id);
  if (item) {
    Object.assign(item, updates);
  }
};

export const getDemoStoreOpen = () => globalThis.__DEMO_STORE_OPEN__!;

export const setDemoStoreOpen = (isOpen: boolean) => {
  globalThis.__DEMO_STORE_OPEN__ = isOpen;
};
