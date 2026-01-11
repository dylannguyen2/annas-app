export interface BudgetCategory {
  id: string
  name: string
  icon: string
  color: string
  type: 'expense' | 'income'
}

export const EXPENSE_CATEGORIES: BudgetCategory[] = [
  { id: 'food-dining', name: 'Food & Dining', icon: '🍔', color: '#f97316', type: 'expense' },
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#84cc16', type: 'expense' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#06b6d4', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#a855f7', type: 'expense' },
  { id: 'bills', name: 'Bills & Utilities', icon: '📱', color: '#eab308', type: 'expense' },
  { id: 'health', name: 'Health', icon: '💊', color: '#ef4444', type: 'expense' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#14b8a6', type: 'expense' },
  { id: 'subscriptions', name: 'Subscriptions', icon: '📺', color: '#6366f1', type: 'expense' },
  { id: 'education', name: 'Education', icon: '📚', color: '#0ea5e9', type: 'expense' },
  { id: 'personal-care', name: 'Personal Care', icon: '💅', color: '#f43f5e', type: 'expense' },
  { id: 'home', name: 'Home', icon: '🏠', color: '#78716c', type: 'expense' },
  { id: 'gifts', name: 'Gifts', icon: '🎁', color: '#e879f9', type: 'expense' },
  { id: 'other-expense', name: 'Other', icon: '📦', color: '#6b7280', type: 'expense' },
]

export const INCOME_CATEGORIES: BudgetCategory[] = [
  { id: 'salary', name: 'Salary', icon: '💰', color: '#22c55e', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#3b82f6', type: 'income' },
  { id: 'investments', name: 'Investments', icon: '📈', color: '#8b5cf6', type: 'income' },
  { id: 'business', name: 'Business', icon: '🏢', color: '#0891b2', type: 'income' },
  { id: 'rental', name: 'Rental Income', icon: '🔑', color: '#ca8a04', type: 'income' },
  { id: 'gifts-received', name: 'Gifts Received', icon: '🎀', color: '#db2777', type: 'income' },
  { id: 'refunds', name: 'Refunds', icon: '↩️', color: '#64748b', type: 'income' },
  { id: 'other-income', name: 'Other', icon: '💵', color: '#6b7280', type: 'income' },
]

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]

export const getCategoryById = (id: string): BudgetCategory | undefined => 
  ALL_CATEGORIES.find(c => c.id === id)

export const getCategoryByName = (name: string): BudgetCategory | undefined =>
  ALL_CATEGORIES.find(c => c.name.toLowerCase() === name.toLowerCase())

export const getCategoriesByType = (type: 'expense' | 'income'): BudgetCategory[] =>
  type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
