import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getEffectiveUser } from '@/lib/get-effective-user'
import { NextResponse } from 'next/server'

const DEFAULT_CATEGORIES = [
  { name: 'Salary', icon: '💰', color: '#22c55e', type: 'income', sort_order: 0 },
  { name: 'Freelance', icon: '💻', color: '#3b82f6', type: 'income', sort_order: 1 },
  { name: 'Investments', icon: '📈', color: '#8b5cf6', type: 'income', sort_order: 2 },
  { name: 'Other Income', icon: '💵', color: '#6b7280', type: 'income', sort_order: 3 },
  { name: 'Food & Dining', icon: '🍔', color: '#f97316', type: 'expense', sort_order: 10 },
  { name: 'Groceries', icon: '🛒', color: '#84cc16', type: 'expense', sort_order: 11 },
  { name: 'Transport', icon: '🚗', color: '#06b6d4', type: 'expense', sort_order: 12 },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'expense', sort_order: 13 },
  { name: 'Entertainment', icon: '🎬', color: '#a855f7', type: 'expense', sort_order: 14 },
  { name: 'Bills & Utilities', icon: '📱', color: '#eab308', type: 'expense', sort_order: 15 },
  { name: 'Health', icon: '💊', color: '#ef4444', type: 'expense', sort_order: 16 },
  { name: 'Travel', icon: '✈️', color: '#14b8a6', type: 'expense', sort_order: 17 },
  { name: 'Subscriptions', icon: '📺', color: '#6366f1', type: 'expense', sort_order: 18 },
  { name: 'Other', icon: '📦', color: '#6b7280', type: 'expense', sort_order: 99 },
]

export async function POST() {
  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (effectiveUser.isReadOnly) {
    return NextResponse.json({ error: 'Read-only access' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  const { count } = await supabase
    .from('budget_categories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', effectiveUser.userId)

  if (count && count > 0) {
    return NextResponse.json({ message: 'Categories already exist', seeded: false })
  }

  const { error } = await supabase
    .from('budget_categories')
    .insert(DEFAULT_CATEGORIES.map(cat => ({ ...cat, user_id: effectiveUser.userId })))

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Default categories created', seeded: true })
}
