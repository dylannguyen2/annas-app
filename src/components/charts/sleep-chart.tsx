'use client'

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

interface SleepData {
  date: string
  sleep_duration_seconds: number | null
  deep_sleep_seconds: number | null
  light_sleep_seconds: number | null
  rem_sleep_seconds: number | null
}

interface SleepChartProps {
  data: SleepData[]
}

export function SleepChart({ data }: SleepChartProps) {
  const chartData = data
    .filter(d => d.sleep_duration_seconds)
    .map(d => ({
      date: new Date(d.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' }),
      total: d.sleep_duration_seconds ? +(d.sleep_duration_seconds / 3600).toFixed(1) : 0,
      deep: d.deep_sleep_seconds ? +(d.deep_sleep_seconds / 3600).toFixed(1) : 0,
      light: d.light_sleep_seconds ? +(d.light_sleep_seconds / 3600).toFixed(1) : 0,
      rem: d.rem_sleep_seconds ? +(d.rem_sleep_seconds / 3600).toFixed(1) : 0,
    }))
    .reverse()

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No sleep data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
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
          domain={[0, 12]}
          tickFormatter={(value) => `${value}h`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value) => [`${value}h`, 'Sleep']}
        />
        <ReferenceLine y={8} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
        <Area 
          type="monotone" 
          dataKey="total" 
          stroke="hsl(var(--primary))" 
          fillOpacity={1} 
          fill="url(#sleepGradient)" 
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4, stroke: 'hsl(var(--background))' }}
          activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
