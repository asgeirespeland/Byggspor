import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PriceZone } from '../types'

interface EnergyFormProps {
  zones: { value: string; label: string }[] | undefined
  onSubmit: (data: {
    kwh: number
    priceZone: PriceZone | ''
    recordedDate: string
  }) => void
  isPending: boolean
  error: Error | null
}

export default function EnergyForm({
  zones,
  onSubmit,
  isPending,
  error,
}: EnergyFormProps) {
  const [kwhUsed, setKwhUsed] = useState('')
  const [priceZone, setPriceZone] = useState<PriceZone | ''>('')
  const [recordedDate, setRecordedDate] = useState(
    () => new Date().toISOString().split('T')[0],
  )

  const shortLabel = (label: string) => label.replace(/\s*\(.*$/, '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const kwh = parseFloat(kwhUsed)
    if (isNaN(kwh) || kwh < 0) return
    onSubmit({ kwh, priceZone, recordedDate })
    setKwhUsed('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="kwh">Strømforbruk (kWh)</Label>
          <Input
            id="kwh"
            type="number"
            min="0"
            step="any"
            placeholder="f.eks. 15000"
            value={kwhUsed}
            onChange={(e) => setKwhUsed(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zone">Prisområde (valgfritt)</Label>
          <Select
            value={priceZone}
            onValueChange={(v) => setPriceZone((v ?? '') as PriceZone | '')}
          >
            <SelectTrigger id="zone" className="w-full">
              <SelectValue placeholder="Velg prisområde…">
                {(v) => {
                  const z = zones?.find((zone) => zone.value === v)
                  return z
                    ? `${z.value} — ${shortLabel(z.label)}`
                    : String(v ?? '')
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {zones?.map((z) => (
                <SelectItem key={z.value} value={z.value}>
                  {z.value} — {shortLabel(z.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Dato (valgfritt)</Label>
          <Input
            id="date"
            type="date"
            value={recordedDate}
            onChange={(e) => setRecordedDate(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger-strong">
          {error instanceof Error ? error.message : 'Noe gikk galt'}
        </p>
      )}

      <Button type="submit" size="sm" disabled={!kwhUsed || isPending}>
        {isPending ? 'Beregner…' : 'Beregn CO₂'}
      </Button>
    </form>
  )
}
