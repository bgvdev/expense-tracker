export interface PaymentMethod {
  id: number;
  name: string;
  slug: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_global?: boolean;
}

export interface NewCategory {
  name: string;
  icon: string;
  color: string;
}

export interface UpdateCategory {
  name?: string;
  icon?: string;
  color?: string;
}

export interface Expense {
  id: number;
  amount: string;
  description: string | null;
  spent_at: string;
  category: Category;
  payment_method: PaymentMethod | null;
  created_at: string;
}

export interface NewExpense {
  amount: number;
  category_id: number;
  payment_method_id?: number | null;
  description?: string;
  spent_at: string;
}

export interface UpdateExpense {
  amount?: number;
  category_id?: number;
  payment_method_id?: number | null;
  description?: string | null;
  spent_at?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UpdateProfileData {
  name: string;
  email: string;
}

export interface UpdatePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
