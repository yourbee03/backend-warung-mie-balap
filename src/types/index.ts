export interface User {
  id: number;
  role_id: number;
  name: string;
  username: string | null;
  email: string;
  password: string;
  phone: string | null;
  address: string | null;
  avatar: string | null;
  is_active: boolean;
  reset_token: string | null;
  reset_token_expires: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserRole {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image: string;
  is_primary: boolean;
  sort_order: number;
  created_at: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: number;
  user_id: number | null;
  table_id: number | null;
  order_number: string;
  order_type: 'online' | 'qr' | 'takeaway';
  order_service_type?: 'takeaway' | 'delivery' | 'dine_in' | null;
  status: 'pending' | 'processing' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  guest_name: string | null;
  guest_phone: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  subtotal: number;
  created_at: Date;
}

export interface Payment {
  id: number;
  order_id: number;
  method: 'cash' | 'bank_transfer' | 'qris';
  status: 'pending' | 'paid' | 'rejected' | 'expired';
  amount: number;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  snap_token: string | null;
  redirect_url: string | null;
  paid_at: Date | null;
  verified_by: number | null;
  verified_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Table {
  id: number;
  table_number: string;
  qr_code: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TableProduct {
  id: number;
  table_id: number;
  product_id: number;
  is_available: boolean;
  created_at: Date;
}

export interface Banner {
  id: number;
  title: string;
  image: string;
  link: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Setting {
  id: number;
  key: string;
  value: string | null;
  type: 'text' | 'number' | 'boolean' | 'json';
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: number;
  user_id: number | null;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}
