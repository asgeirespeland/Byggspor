import { Label, Pie, PieChart } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { fmt } from '../utils'

const CHART_CONFIG: ChartConfig = {
  materials: { label: 'Materialer', color: '#3b82f6' },
  transport: { label: 'Transport', color: '#f97316' },
  waste: { label: 'Avfall', color: '#ef4444' },
  energy: { label: 'Energi', color: '#eab308' },
}

interface CategoryDonutProps {
  categories: { key: string; label: string; co2: number }[]
  total: number
}

export default function CategoryDonut({
  categories,
  total,
}: CategoryDonutProps) {
  const SEQUESTER_COLOR = '#34d399'

  const data = categories.map((c) => ({
    name: c.key,
    label: c.label,
    value: Math.abs(c.co2),
    fill:
      c.co2 < 0 ? SEQUESTER_COLOR : (CHART_CONFIG[c.key]?.color ?? '#9ca3af'),
  }))

  return (
    <ChartContainer config={CHART_CONFIG} className="h-[180px] w-[180px]">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => `${fmt(Number(value))} kg CO₂e`}
              hideLabel
            />
          }
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={80}
          strokeWidth={2}
          stroke="white"
          isAnimationActive={false}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) - 6}
                      className="fill-gray-900 text-lg font-bold"
                    >
                      {fmt(total)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 12}
                      className="fill-gray-400 text-[10px]"
                    >
                      kg CO₂e netto
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
