/**
 * Unit tests for lib/utils.ts
 *
 * cn() is a Tailwind class merging helper built on clsx + tailwind-merge.
 * Tests verify that conflicting utilities are resolved correctly.
 */

import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn', () => {
  it('returns a single class unchanged', () => {
    expect(cn('p-4')).toBe('p-4')
  })

  it('joins multiple classes', () => {
    expect(cn('flex', 'items-center', 'gap-2')).toBe('flex items-center gap-2')
  })

  it('resolves Tailwind conflicts — last value wins', () => {
    // tailwind-merge resolves p-4 vs p-2: the later one should win
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('resolves conflicting text sizes', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('includes conditional classes when truthy', () => {
    const isActive = true
    expect(cn('base', isActive && 'active')).toBe('base active')
  })

  it('excludes conditional classes when falsy', () => {
    const isActive = false
    expect(cn('base', isActive && 'active')).toBe('base')
  })

  it('handles undefined and null gracefully', () => {
    expect(cn('base', undefined, null)).toBe('base')
  })

  it('handles object syntax from clsx', () => {
    expect(cn({ 'font-bold': true, 'font-normal': false })).toBe('font-bold')
  })
})
