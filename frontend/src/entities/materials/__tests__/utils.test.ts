/**
 * Unit tests for features/invoice/utils.ts
 *
 * Pure functions — no mocks, no React needed.
 */

import { describe, it, expect } from 'vitest'
import { getGwpA1A3 } from '../lib/utils'
import type { LineItem } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeLineItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    line_number: '1',
    name: 'Test item',
    seller_item_id: null,
    gtin: null,
    nobb_number: null,
    quantity: 1,
    unit: 'STK',
    price_per_unit: 100,
    line_total: 100,
    flagged: false,
    enriched: false,
    nobb_data: null,
    ...overrides,
  }
}

// ── getGwpA1A3 ────────────────────────────────────────────────────────────────

describe('getGwpA1A3', () => {
  it('returns null when nobb_data is null', () => {
    const item = makeLineItem({ nobb_data: null })
    expect(getGwpA1A3(item)).toBeNull()
  })

  it('returns null when epd is null', () => {
    const item = makeLineItem({
      nobb_data: {
        nobb_number: '12345678',
        name: 'Test',
        secondary_text: null,
        description: null,
        product_group: null,
        product_group_number: null,
        environment_labels: [],
        has_epd: false,
        epd: null,
      },
    })
    expect(getGwpA1A3(item)).toBeNull()
  })

  it('returns null when gwp_stages is empty', () => {
    const item = makeLineItem({
      nobb_data: {
        nobb_number: '12345678',
        name: 'Test',
        secondary_text: null,
        description: null,
        product_group: null,
        product_group_number: null,
        environment_labels: [],
        has_epd: true,
        epd: {
          epd_number: 'EPD-001',
          declared_unit: '1 stk',
          conversion_factor_kg: 10,
          price_unit_factor: 1,
          reference_service_life: null,
          gwp_stages: {}, // ← no stages
        },
      },
    })
    expect(getGwpA1A3(item)).toBeNull()
  })

  it('returns the a1_a3 total when present (snake_case key)', () => {
    const item = makeLineItem({
      nobb_data: {
        nobb_number: '12345678',
        name: 'Test',
        secondary_text: null,
        description: null,
        product_group: null,
        product_group_number: null,
        environment_labels: [],
        has_epd: true,
        epd: {
          epd_number: 'EPD-001',
          declared_unit: '1 stk',
          conversion_factor_kg: 10,
          price_unit_factor: 1,
          reference_service_life: null,
          gwp_stages: {
            a1_a3: { total: 10.5, fossil: 10.0, biogenic: 0.5 },
          },
        },
      },
    })
    expect(getGwpA1A3(item)).toBe(10.5)
  })

  it('falls back to A1-A3 key when a1_a3 is absent (simple format)', () => {
    // The simple EPD format uses "A1-A3" as the key instead of "a1_a3"
    const item = makeLineItem({
      nobb_data: {
        nobb_number: '12345678',
        name: 'Test',
        secondary_text: null,
        description: null,
        product_group: null,
        product_group_number: null,
        environment_labels: [],
        has_epd: true,
        epd: {
          epd_number: 'EPD-001',
          declared_unit: '1 stk',
          conversion_factor_kg: 10,
          price_unit_factor: 1,
          reference_service_life: null,
          gwp_stages: {
            'A1-A3': { total: 5.2, fossil: null, biogenic: null },
          },
        },
      },
    })
    expect(getGwpA1A3(item)).toBe(5.2)
  })

  it('returns null when a1_a3 stage exists but total is null', () => {
    const item = makeLineItem({
      nobb_data: {
        nobb_number: '12345678',
        name: 'Test',
        secondary_text: null,
        description: null,
        product_group: null,
        product_group_number: null,
        environment_labels: [],
        has_epd: true,
        epd: {
          epd_number: 'EPD-001',
          declared_unit: '1 stk',
          conversion_factor_kg: 10,
          price_unit_factor: 1,
          reference_service_life: null,
          gwp_stages: {
            a1_a3: { total: null, fossil: null, biogenic: null },
          },
        },
      },
    })
    expect(getGwpA1A3(item)).toBeNull()
  })
})
