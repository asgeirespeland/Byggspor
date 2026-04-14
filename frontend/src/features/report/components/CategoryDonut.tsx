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
  sequestration?: number
}

export default function CategoryDonut({
  categories,
  total,
  sequestration = 0,
}: CategoryDonutProps) {
  const data = categories.map((c) => ({
    name: c.key,
    label: c.label,
    value: Math.abs(c.co2),
    fill: CHART_CONFIG[c.key]?.color ?? '#9ca3af',
  }))

  const grossTotal = data.reduce((s, d) => s + d.value, 0)
  const seqAbs = Math.abs(sequestration)
  const seqPct = grossTotal > 0 ? Math.min(seqAbs / grossTotal, 1) : 0

  const overlayData =
    seqPct > 0
      ? [
          { name: 'sequestration', value: seqAbs, fill: '#34d399' },
          {
            name: 'rest',
            value: Math.max(grossTotal - seqAbs, 0),
            fill: 'transparent',
          },
        ]
      : []

  return (
    <ChartContainer config={CHART_CONFIG} className="h-[180px] w-[180px]">
      <PieChart>
        <defs>
          <pattern
            id="hatch-green"
            patternUnits="userSpaceOnUse"
            width={5}
            height={5}
            patternTransform="rotate(45)"
          >
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={5}
              stroke="rgba(5, 150, 105, 0.8)"
              strokeWidth={2}
            />
          </pattern>
        </defs>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) =>
                `${name === 'sequestration' ? '−' : ''}${fmt(Number(value))} kg CO₂e`
              }
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
        {overlayData.length > 0 && (
          <Pie
            data={overlayData}
            dataKey="value"
            nameKey="name"
            innerRadius={80}
            outerRadius={85}
            strokeWidth={0}
            isAnimationActive={false}
          />
        )}
      </PieChart>
    </ChartContainer>
  )
}
