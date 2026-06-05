import { BusinessResponse, Category, AuthResponse, User } from '../types';
import { API_BASE } from '../config';

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE}/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
}

export async function fetchSubcategories(parentSlug: string): Promise<Category[]> {
  const response = await fetch(`${API_BASE}/categories/${parentSlug}/subcategories`);
  if (!response.ok) throw new Error('Failed to fetch subcategories');
  return response.json();
}

export async function fetchCategoryStats(state: string): Promise<Category[]> {
  const response = await fetch(`${API_BASE}/businesses/state/${state}/stats`);
  if (!response.ok) throw new Error('Failed to fetch category stats');
  return response.json();
}

export async function fetchBusinesses(params: {
  state?: string;
  category?: string;
  parentCategory?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<BusinessResponse> {
  const searchParams = new URLSearchParams();
  if (params.state && params.state !== 'ALL') searchParams.set('state', params.state);
  if (params.category) searchParams.set('category', params.category);
  if (params.parentCategory) searchParams.set('parentCategory', params.parentCategory);
  if (params.search) searchParams.set('search', params.search);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const response = await fetch(`${API_BASE}/businesses?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch businesses');
  return response.json();
}

export async function fetchNearbyBusinesses(params: {
  lat: number;
  lng: number;
  radius?: number;
  category?: string;
  parentCategory?: string;
  page?: number;
  limit?: number;
}): Promise<BusinessResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('lat', params.lat.toString());
  searchParams.set('lng', params.lng.toString());
  if (params.radius) searchParams.set('radius', params.radius.toString());
  if (params.category) searchParams.set('category', params.category);
  if (params.parentCategory) searchParams.set('parentCategory', params.parentCategory);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const response = await fetch(`${API_BASE}/businesses/nearby?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch nearby businesses');
  return response.json();
}


// Auth API functions
export async function signup(name: string, email: string, password: string, role: string, phone?: string, state?: string, city?: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role, phone, state, city }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Signup failed');
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function getMe(token: string): Promise<{ user: User }> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to get user');
  return data;
}

export async function fetchMyBusinesses(token: string): Promise<{ businesses: import('../types').Business[] }> {
  const response = await fetch(`${API_BASE}/register/my-businesses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch your businesses');
  return data;
}


export async function googleLogin(credential: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Google login failed');
  return data;
}
