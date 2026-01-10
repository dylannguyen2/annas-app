import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'json'

  const [habitsResult, completionsResult, moodsResult, workoutsResult, healthResult] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('habit_completions').select('*').eq('user_id', user.id).order('date', { ascending: true }),
    supabase.from('moods').select('*').eq('user_id', user.id).order('date', { ascending: true }),
    supabase.from('workouts').select('*').eq('user_id', user.id).order('date', { ascending: true }),
    supabase.from('health_data').select('*').eq('user_id', user.id).order('date', { ascending: true }),
  ])

  const exportData = {
    exportedAt: new Date().toISOString(),
    habits: habitsResult.data || [],
    habitCompletions: completionsResult.data || [],
    moods: moodsResult.data || [],
    workouts: workoutsResult.data || [],
    healthData: healthResult.data || [],
  }

  if (format === 'csv') {
    const csvSections: string[] = []

    if (exportData.habits.length > 0) {
      const headers = Object.keys(exportData.habits[0]).join(',')
      const rows = exportData.habits.map(h => Object.values(h).map(v => `"${v}"`).join(','))
      csvSections.push(`# HABITS\n${headers}\n${rows.join('\n')}`)
    }

    if (exportData.habitCompletions.length > 0) {
      const headers = Object.keys(exportData.habitCompletions[0]).join(',')
      const rows = exportData.habitCompletions.map(c => Object.values(c).map(v => `"${v}"`).join(','))
      csvSections.push(`# HABIT COMPLETIONS\n${headers}\n${rows.join('\n')}`)
    }

    if (exportData.moods.length > 0) {
      const headers = Object.keys(exportData.moods[0]).join(',')
      const rows = exportData.moods.map(m => Object.values(m).map(v => `"${v}"`).join(','))
      csvSections.push(`# MOODS\n${headers}\n${rows.join('\n')}`)
    }

    if (exportData.workouts.length > 0) {
      const headers = Object.keys(exportData.workouts[0]).join(',')
      const rows = exportData.workouts.map(w => Object.values(w).map(v => `"${v}"`).join(','))
      csvSections.push(`# WORKOUTS\n${headers}\n${rows.join('\n')}`)
    }

    if (exportData.healthData.length > 0) {
      const headers = Object.keys(exportData.healthData[0]).join(',')
      const rows = exportData.healthData.map(h => Object.values(h).map(v => `"${v}"`).join(','))
      csvSections.push(`# HEALTH DATA\n${headers}\n${rows.join('\n')}`)
    }

    const csv = csvSections.join('\n\n')
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="annas-app-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="annas-app-export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
