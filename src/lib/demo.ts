import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const DEMO_ACCOUNT_EMAIL = 'demo@annnas.world'
export const DEMO_ACCOUNT_PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD || 'demo-password-change-me'

export async function clearDemoAccountData() {
  const supabase = getSupabaseAdmin()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === DEMO_ACCOUNT_EMAIL)?.id)
    .single()

  if (!profile) {
    console.log('Demo account not found')
    return
  }

  const demoUserId = profile.id
  const tables = [
    'habits', 
    'habit_completions', 
    'moods', 
    'meals', 
    'books', 
    'todos', 
    'daily_entries',
    'health_data',
    'activities'
  ]
  
  for (const table of tables) {
    await supabase
      .from(table)
      .delete()
      .eq('user_id', demoUserId)
  }

  console.log('Demo account data cleared')
}

export async function getDemoAccountId(): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase.auth.admin.listUsers()
  const demoUser = data.users.find(u => u.email === DEMO_ACCOUNT_EMAIL)
  return demoUser?.id || null
}
