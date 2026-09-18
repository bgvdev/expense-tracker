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
  // Required, not optional: every endpoint that returns a User returns this.
  // Making it optional let PATCH /auth/profile omit it and silently strip
  // admin rights from the client's user object without a type error.
  is_admin: boolean;
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

// ── Admin types ──────────────────────────────────────────────────

export interface AdminStats {
  total_users: number;
  new_users_this_month: number;
  total_expenses_count: number;
  expenses_this_month_count: number;
  total_expenses_sum: string;
  expenses_this_month_sum: string;
  total_categories: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  expense_count: number;
  expense_sum: string;
}

export interface AdminCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  expense_count: number;
  is_global: true;
}

export interface ActivityItem {
  id: number;
  user_name: string;
  amount: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  description: string | null;
  spent_at: string;
}

// ── Pagination ───────────────────────────────────────────────────

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
