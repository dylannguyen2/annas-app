'use client'

import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ZAxis
} from 'recharts'

interface CorrelationData {
  x: number
  y: number
  date: string
}

interface CorrelationChartProps {
  data: CorrelationData[]
  xLabel: string
  yLabel: string
  xFormatter?: (value: number) => string
  yFormatter?: (value: number) => string
}

export function CorrelationChart({ 
  data, 
  xLabel, 
  yLabel,
  xFormatter = (v) => String(v),
  yFormatter = (v) => String(v)
}: CorrelationChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Not enough data for correlation
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          type="number" 
          dataKey="x" 
          name={xLabel}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          tickFormatter={xFormatter}
        />
        <YAxis 
          type="number" 
          dataKey="y" 
          name={yLabel}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          tickFormatter={yFormatter}
        />
        <ZAxis range={[50, 50]} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value, name) => {
            if (name === xLabel) return [xFormatter(Number(value)), xLabel]
            if (name === yLabel) return [yFormatter(Number(value)), yLabel]
            return [value, name]
          }}
          labelFormatter={(_, payload) => {
            if (payload && payload[0]) {
              return payload[0].payload.date
            }
            return ''
          }}
        />
        <Scatter 
          data={data} 
          fill="hsl(var(--primary))"
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
