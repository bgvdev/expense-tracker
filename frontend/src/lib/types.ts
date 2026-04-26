export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export interface Expense {
  id: number;
  amount: string;
  description: string | null;
  spent_at: string;
  category: Category;
  created_at: string;
}

export interface NewExpense {
  amount: number;
  category_id: number;
  description?: string;
  spent_at: string;
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

