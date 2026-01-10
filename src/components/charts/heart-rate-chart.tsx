'use client'

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts'

interface HeartRateData {
  date: string
  resting_heart_rate: number | null
  min_heart_rate: number | null
  max_heart_rate: number | null
  avg_heart_rate: number | null
}

interface HeartRateChartProps {
  data: HeartRateData[]
}

export function HeartRateChart({ data }: HeartRateChartProps) {
  const chartData = data
    .filter(d => d.resting_heart_rate || d.avg_heart_rate)
    .map(d => ({
      date: new Date(d.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' }),
      resting: d.resting_heart_rate,
      min: d.min_heart_rate,
      max: d.max_heart_rate,
      avg: d.avg_heart_rate,
      range: d.min_heart_rate && d.max_heart_rate ? [d.min_heart_rate, d.max_heart_rate] : null,
    }))
    .reverse()

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No heart rate data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          domain={[40, 180]}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value, name) => {
            const labels: Record<string, string> = {
              resting: 'Resting HR',
              min: 'Min HR',
              max: 'Max HR',
              avg: 'Avg HR'
            }
            return [`${value} bpm`, labels[String(name)] || String(name)]
          }}
        />
        <Area 
          type="monotone" 
          dataKey="max" 
          stroke="none" 
          fill="url(#hrGradient)" 
        />
        <Line 
          type="monotone" 
          dataKey="resting" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="avg" 
          stroke="hsl(var(--muted-foreground))" 
          strokeWidth={1}
          strokeDasharray="5 5"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
