import { useState } from 'react'
import { Label, Pie, PieChart, Sector } from 'recharts'
import type { PieSectorDataItem } from 'recharts/types/polar/Pie'
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart'
import { fmt } from '@/entities/report/utils'
import { CATEGORY_KEYS, CATEGORY_THEME } from '@/entities/report/theme'

const CHART_CONFIG: ChartConfig = Object.fromEntries(
  CATEGORY_KEYS.map((key) => [
    key,
    { label: CATEGORY_THEME[key].label, color: CATEGORY_THEME[key].colorVar },
  ]),
)

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
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)
  const [overlayHovered, setOverlayHovered] = useState(false)

  const data = categories.map((c) => ({
    name: c.key,
    label: c.label,
    value: Math.abs(c.co2),
    fill: CHART_CONFIG[c.key]?.color ?? 'var(--muted-foreground)',
  }))

  const grossTotal = data.reduce((s, d) => s + d.value, 0)
  const seqAbs = Math.abs(sequestration)
  const seqPct = grossTotal > 0 ? Math.min(seqAbs / grossTotal, 1) : 0

  const overlayData =
    seqPct > 0
      ? [
          { name: 'sequestration', value: seqAbs, fill: 'var(--carbon)' },
          {
            name: 'rest',
            value: Math.max(grossTotal - seqAbs, 0),
            fill: 'transparent',
          },
        ]
      : []

  return (
    <ChartContainer
      config={CHART_CONFIG}
      className="h-[200px] w-[200px] overflow-visible [&_svg]:overflow-visible"
    >
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
              stroke="var(--carbon-strong)"
              strokeWidth={2}
            />
          </pattern>
        </defs>
        <ChartTooltip
          cursor={false}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload as {
              label: string
              name: string
              value: number
            }
            const isSeq = d.name === 'sequestration'
            return (
              <div className="rounded-md bg-foreground px-3 py-1.5 text-xs text-background">
                {isSeq ? '−' : ''}
                {fmt(d.value)} kg CO₂e
              </div>
            )
          }}
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
          onMouseEnter={(_: unknown, i: number) => setActiveIndex(i)}
          onMouseLeave={() => setActiveIndex(undefined)}
          activeShape={(props: PieSectorDataItem) => (
            <Sector {...props} innerRadius={(props.innerRadius ?? 55) - 4} />
          )}
          {...({ activeIndex } as Record<string, unknown>)}
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
            outerRadius={overlayHovered ? 92 : 87}
            strokeWidth={0}
            isAnimationActive={false}
            onMouseEnter={(_: unknown, i: number) => {
              if (overlayData[i]?.name === 'sequestration')
                setOverlayHovered(true)
            }}
            onMouseLeave={() => setOverlayHovered(false)}
            shape={(props: PieSectorDataItem & { name?: string }) => (
              <Sector
                {...props}
                style={
                  props.name === 'rest' ? { pointerEvents: 'none' } : undefined
                }
              />
            )}
          />
        )}
      </PieChart>
    </ChartContainer>
  )
}
