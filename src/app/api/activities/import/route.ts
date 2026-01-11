import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function parseTimeToSeconds(timeStr: string): number | null {
  if (!timeStr || timeStr === '--') return null
  const parts = timeStr.split(':')
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts.map(p => parseFloat(p))
    return hours * 3600 + minutes * 60 + seconds
  }
  if (parts.length === 2) {
    const [minutes, seconds] = parts.map(p => parseFloat(p))
    return minutes * 60 + seconds
  }
  return null
}

function parsePaceToSpeed(paceStr: string): number | null {
  if (!paceStr || paceStr === '--') return null
  const seconds = parseTimeToSeconds(paceStr)
  if (!seconds || seconds === 0) return null
  const milesPerSecond = 1 / seconds
  const metersPerSecond = milesPerSecond * 1609.34
  return metersPerSecond
}

function parseNumber(str: string): number | null {
  if (!str || str === '--') return null
  const cleaned = str.replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function milesToMeters(miles: number | null): number | null {
  if (miles === null) return null
  return miles * 1609.34
}

function feetToMeters(feet: number | null): number | null {
  if (feet === null) return null
  return feet * 0.3048
}

function parseBoolean(str: string): boolean {
  return str?.toLowerCase() === 'true'
}

function normalizeActivityType(type: string): string {
  return type
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = parseCSVLine(lines[0])
  const records: Record<string, string>[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = values[index] || ''
    })
    records.push(record)
  }
  
  return records
}

function parseGarminCSVRow(row: Record<string, string>) {
  const startTime = row['Date'] ? new Date(row['Date']).toISOString() : null
  const garminActivityId = startTime ? Date.parse(startTime) : Date.now()
  
  const distanceMiles = parseNumber(row['Distance'])
  const elevationGainFeet = parseNumber(row['Total Ascent'])
  const elevationLossFeet = parseNumber(row['Total Descent'])
  
  const activityType = normalizeActivityType(row['Activity Type'] || 'other')
  
  const title = row['Title'] || ''
  const locationMatch = title.match(/^(Sydney|Melbourne|Brisbane|Perth|Adelaide|[A-Z][a-z]+)\s/)
  const locationName = locationMatch ? locationMatch[1] : null
  const activityName = title
  
  return {
    garmin_activity_id: garminActivityId,
    activity_name: activityName || null,
    activity_type: activityType,
    start_time: startTime,
    duration_seconds: parseTimeToSeconds(row['Time']),
    moving_duration_seconds: parseTimeToSeconds(row['Moving Time']),
    elapsed_duration_seconds: parseTimeToSeconds(row['Elapsed Time']),
    distance_meters: milesToMeters(distanceMiles),
    calories: parseNumber(row['Calories']),
    avg_heart_rate: parseNumber(row['Avg HR']),
    max_heart_rate: parseNumber(row['Max HR']),
    avg_speed: parsePaceToSpeed(row['Avg Speed']),
    max_speed: parsePaceToSpeed(row['Max Speed']),
    elevation_gain: feetToMeters(elevationGainFeet),
    elevation_loss: feetToMeters(elevationLossFeet),
    steps: parseNumber(row['Steps']),
    avg_cadence: parseNumber(row['Avg Bike Cadence']),
    max_cadence: parseNumber(row['Max Bike Cadence']),
    avg_power: parseNumber(row['Avg Power']),
    max_power: parseNumber(row['Max Power']),
    total_sets: parseNumber(row['Total Sets']),
    total_reps: parseNumber(row['Total Reps']),
    location_name: locationName,
    favorite: parseBoolean(row['Favorite']),
    has_polyline: false,
    raw_data: row,
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const csvContent = await file.text()
    const rows = parseCSV(csvContent)
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid data in CSV' }, { status: 400 })
    }

    const activities = rows.map(parseGarminCSVRow)
    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (const activity of activities) {
      const { data: existing } = await supabase
        .from('activities')
        .select('id')
        .eq('user_id', user.id)
        .eq('garmin_activity_id', activity.garmin_activity_id)
        .single()

      if (existing) {
        skipped++
        continue
      }

      const { error } = await supabase
        .from('activities')
        .insert({
          ...activity,
          user_id: user.id,
          synced_at: new Date().toISOString(),
        })

      if (error) {
        errors.push(`Failed to import activity from ${activity.start_time}: ${error.message}`)
      } else {
        imported++
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: rows.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to import CSV' 
    }, { status: 500 })
  }
}
