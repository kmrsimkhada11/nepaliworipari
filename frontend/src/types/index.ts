export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  parent_id: number | null;
  business_count?: string;
}

export interface Business {
  id: number;
  name: string;
  category_id: number;
  user_id: number | null;
  state: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  description: string;
  image_url: string;
  latitude: number | null;
  longitude: number | null;
  is_featured: boolean;
  category_name: string;
  category_slug: string;
  category_icon: string;
  parent_category_name: string;
  parent_category_slug: string;
  distance_km?: number;
  created_at: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BusinessResponse {
  businesses: Business[];
  pagination: PaginationInfo;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'seeker' | 'provider';
  phone?: string;
  state?: string;
  city?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export type AustralianState = 'ALL' | 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';

export const AUSTRALIAN_STATES: { value: AustralianState; label: string }[] = [
  { value: 'ALL', label: 'All States' },
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NT', label: 'Northern Territory' },
];
