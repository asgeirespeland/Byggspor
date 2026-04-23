/**
 * Local state hook for invoice line items in the generate-invoice dialog.
 * On dialog open, prefills lines from entities/materials/api.listProjectMaterials.
 * Exports: LineItem type and useProjectLineItems hook.
 * Cross-slice coupling: reads entities/materials/ (FSD note — export entity depends on materials).
 */
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/react'
import { getTokenOrThrow } from '@/shared/auth/getToken'
import { listProjectMaterials } from '@/entities/materials/api'

export interface LineItem {
  id: string
  sourceId: number | null // project_material id — null for manually added rows
  description: string
  price: string
  quantity: string
  unit: string
  discount: string
}

function newLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    sourceId: null,
    description: '',
    price: '0.00',
    quantity: '1',
    unit: 'STK',
    discount: '0',
  }
}

export function useProjectLineItems(projectId: number, open: boolean) {
  const { getToken } = useAuth()
  const [lineItems, setLineItems] = useState<LineItem[]>([newLineItem()])
  const [isLoading, setIsLoading] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!open || hasFetched.current) return

    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const token = await getTokenOrThrow(getToken)
        const groups = await listProjectMaterials(projectId, token)

        const items: LineItem[] = groups.flatMap((group) =>
          group.items.map((item) => {
            const qty = item.quantity ?? 1
            // Prefer price_per_unit; fall back to total_price / qty
            const unitPrice =
              item.price_per_unit ??
              (item.total_price != null && qty > 0 ? item.total_price / qty : 0)

            return {
              id: crypto.randomUUID(),
              sourceId: item.id,
              description: item.material_name ?? '',
              price: unitPrice.toFixed(2),
              quantity: qty.toString(),
              unit: item.unit ?? 'STK',
              discount: '0',
            }
          }),
        )

        if (!cancelled) {
          setLineItems(items.length > 0 ? items : [newLineItem()])
          hasFetched.current = true
        }
      } catch {
        if (!cancelled) setLineItems([newLineItem()])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateLineItem(id: string, patch: Partial<LineItem>) {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  function removeLineItem(id: string) {
    setLineItems((prev) => {
      const next = prev.filter((item) => item.id !== id)
      return next.length > 0 ? next : [newLineItem()]
    })
  }

  function addLine() {
    setLineItems((prev) => [...prev, newLineItem()])
  }

  return { lineItems, isLoading, updateLineItem, removeLineItem, addLine }
}
