// Backend API URL (local proxy server)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface CartItem {
  id: string;
  product_id: number;
  variant_id: number;
  name: string;
  quantity: number;
  list_price: number;
  sale_price: number;
  image_url?: string;
}

export interface Cart {
  id: string;
  customer_id?: number;
  email?: string;
  currency: {
    code: string;
  };
  cart_amount: number;
  line_items: {
    physical_items: CartItem[];
  };
}

export async function getCartDetails(cartId: string): Promise<Cart> {
  const res = await fetch(`${API_BASE_URL}/carts/${cartId}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `Failed to fetch cart: ${res.statusText}`);
  }

  const response = await res.json();
  console.log("🚀 ~ getCartDetails ~ response:", response);
  return response.data;
}

// ========== Ecommerce Details API ==========

export interface CredentialField {
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'password' | 'url';
  required: boolean;
}

export interface EcommerceDetail {
  _id: string;
  name: string;
  api_urls?: Record<string, { endpoint: string; method: string }>;
  required_credentials?: CredentialField[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getEcommerceDetails(): Promise<EcommerceDetail[]> {
  const res = await fetch(`${API_BASE_URL}/ecommerce-details`);
  if (!res.ok) throw new Error('Failed to fetch ecommerce details');
  const response = await res.json();
  return response.data;
}

export async function createEcommerceDetail(data: Partial<EcommerceDetail>): Promise<EcommerceDetail> {
  const res = await fetch(`${API_BASE_URL}/ecommerce-details`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create ecommerce detail');
  }
  const response = await res.json();
  return response.data;
}

export async function updateEcommerceDetail(id: string, data: Partial<EcommerceDetail>): Promise<EcommerceDetail> {
  const res = await fetch(`${API_BASE_URL}/ecommerce-details/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update ecommerce detail');
  }
  const response = await res.json();
  return response.data;
}

export async function deleteEcommerceDetail(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/ecommerce-details/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to delete ecommerce detail');
  }
}

// ========== Rules API ==========

export interface Rule {
  _id: string;
  id: number;
  key: string;
  enabled: boolean;
  value?: boolean | number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getRules(): Promise<Rule[]> {
  const res = await fetch(`${API_BASE_URL}/rules`);
  if (!res.ok) throw new Error('Failed to fetch rules');
  const response = await res.json();
  return response.data;
}

export async function createRule(data: Partial<Rule>): Promise<Rule> {
  const res = await fetch(`${API_BASE_URL}/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create rule');
  }
  const response = await res.json();
  return response.data;
}

export async function updateRule(id: string, data: Partial<Rule>): Promise<Rule> {
  const res = await fetch(`${API_BASE_URL}/rules/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update rule');
  }
  const response = await res.json();
  return response.data;
}

export async function deleteRule(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/rules/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to delete rule');
  }
}

// ========== Merchants API ==========

export interface Store {
  storeId?: string;
  storeName: string;
  platform: string;
  platformId?: string;
  storeDetails: Record<string, string>;
  businessRules: Record<string, boolean | number>;
  enabled?: boolean;
}

export interface Merchant {
  _id: string;
  userId: string;
  businessName: string;
  email: string;
  name?: string; // Keep for backward compatibility
  stores: Store[];
  createdAt: string;
  updatedAt: string;
}

export async function getMerchants(): Promise<Merchant[]> {
  const res = await fetch(`${API_BASE_URL}/merchants`);
  if (!res.ok) throw new Error('Failed to fetch merchants');
  const response = await res.json();
  return response.data;
}

export async function getMerchantByUserId(userId: string): Promise<Merchant> {
  const res = await fetch(`${API_BASE_URL}/merchants/by-user/${userId}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch merchant');
  }
  const response = await res.json();
  return response.data;
}

export async function createMerchant(data: Partial<Merchant>): Promise<Merchant> {
  const res = await fetch(`${API_BASE_URL}/merchants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create merchant');
  }
  const response = await res.json();
  return response.data;
}

export async function updateMerchant(id: string, data: Partial<Merchant>): Promise<Merchant> {
  const res = await fetch(`${API_BASE_URL}/merchants/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update merchant');
  }
  const response = await res.json();
  return response.data;
}

export async function updateMerchantStore(id: string, storeIndex: number, storeData: any): Promise<Merchant> {
  const url = `${API_BASE_URL}/merchants/${id}/stores/${storeIndex}`;
  console.log('updateMerchantStore - URL:', url);
  console.log('updateMerchantStore - storeData:', storeData);

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(storeData),
  });

  console.log('updateMerchantStore - Response status:', res.status);
  console.log('updateMerchantStore - Response headers:', res.headers.get('content-type'));

  if (!res.ok) {
    const errorText = await res.text();
    console.error('updateMerchantStore - Error response:', errorText);
    try {
      const error = JSON.parse(errorText);
      throw new Error(error.message || 'Failed to update store');
    } catch (e) {
      throw new Error(`Failed to update store: ${errorText.substring(0, 100)}`);
    }
  }
  const response = await res.json();
  return response.data;
}

export async function deleteMerchant(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/merchants/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to delete merchant');
  }
}
