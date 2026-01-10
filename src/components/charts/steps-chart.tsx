'use client'

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts'

interface StepsData {
  date: string
  steps: number | null
}

interface StepsChartProps {
  data: StepsData[]
  goal?: number
}

export function StepsChart({ data, goal = 10000 }: StepsChartProps) {
  const chartData = data
    .filter(d => d.steps !== null)
    .map(d => ({
      date: new Date(d.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' }),
      steps: d.steps || 0,
      metGoal: (d.steps || 0) >= goal,
    }))
    .reverse()

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No steps data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value) => [Number(value).toLocaleString(), 'Steps']}
        />
        <ReferenceLine y={goal} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
        <Bar dataKey="steps" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.metGoal ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
