/**
 * Unit tests for useInvoiceParse hook.
 *
 * Tests async state management: loading, data, error, and reset.
 * Mocks:
 * - ../api/invoice (parseInvoiceFile) — never make real HTTP calls in tests
 * - sonner (toast) — suppress toast side-effects
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

import { useInvoiceParse } from '@/features/invoice/hooks/useInvoiceParse'
import { parseInvoiceFile } from '@/features/invoice/api/invoice'
import type { InvoiceResponse } from '@/features/invoice/types/invoice'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/features/invoice/api/invoice', () => ({
  parseInvoiceFile: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockParseInvoiceFile = vi.mocked(parseInvoiceFile)

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_RESPONSE: InvoiceResponse = {
  invoice_number: 'INV-001',
  issue_date: '2024-01-15',
  currency: 'NOK',
  supplier: null,
  buyer: null,
  line_items: [],
}

function makeFile(name = 'invoice.xml') {
  return new File(['<Invoice/>'], name, { type: 'text/xml' })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useInvoiceParse — initial state', () => {
  it('starts with data null', () => {
    const { result } = renderHook(() => useInvoiceParse())
    expect(result.current.data).toBeNull()
  })

  it('starts with loading false', () => {
    const { result } = renderHook(() => useInvoiceParse())
    expect(result.current.loading).toBe(false)
  })

  it('starts with error null', () => {
    const { result } = renderHook(() => useInvoiceParse())
    expect(result.current.error).toBeNull()
  })
})

describe('useInvoiceParse — parse() success', () => {
  it('calls parseInvoiceFile with the file and token', async () => {
    mockParseInvoiceFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useInvoiceParse())
    const file = makeFile()

    await act(async () => {
      await result.current.parse(file, 'mock-token')
    })

    expect(mockParseInvoiceFile).toHaveBeenCalledWith(file, 'mock-token')
  })

  it('sets data on success', async () => {
    mockParseInvoiceFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.data).toEqual(MOCK_RESPONSE)
  })

  it('clears error before a new parse call', async () => {
    // First call fails
    mockParseInvoiceFile.mockRejectedValueOnce(new Error('first error'))
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('first error')

    // Second call succeeds — error should be cleared
    mockParseInvoiceFile.mockResolvedValueOnce(MOCK_RESPONSE)
    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.error).toBeNull()
  })

  it('clears previous data before a new parse call', async () => {
    mockParseInvoiceFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })
    expect(result.current.data).not.toBeNull()

    // Second call — data should be null while pending
    let resolveSecond!: (v: InvoiceResponse) => void
    mockParseInvoiceFile.mockReturnValueOnce(
      new Promise<InvoiceResponse>((res) => {
        resolveSecond = res
      }),
    )

    act(() => {
      result.current.parse(makeFile()) // don't await — we want the pending state
    })

    // Data cleared immediately when the second parse starts
    await waitFor(() => expect(result.current.data).toBeNull())

    // Clean up by resolving
    await act(async () => {
      resolveSecond(MOCK_RESPONSE)
    })
  })

  it('loading is false after success', async () => {
    mockParseInvoiceFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.loading).toBe(false)
  })
})

describe('useInvoiceParse — parse() loading state', () => {
  it('sets loading to true while the request is in flight', async () => {
    // Use a manually controlled promise so we can check state while pending
    let resolve!: (v: InvoiceResponse) => void
    mockParseInvoiceFile.mockReturnValueOnce(
      new Promise<InvoiceResponse>((res) => {
        resolve = res
      }),
    )

    const { result } = renderHook(() => useInvoiceParse())

    act(() => {
      result.current.parse(makeFile()) // intentionally not awaited
    })

    await waitFor(() => expect(result.current.loading).toBe(true))

    // Resolve and confirm loading clears
    await act(async () => {
      resolve(MOCK_RESPONSE)
    })
    expect(result.current.loading).toBe(false)
  })
})

describe('useInvoiceParse — parse() error handling', () => {
  it('sets error when parseInvoiceFile throws an Error', async () => {
    mockParseInvoiceFile.mockRejectedValueOnce(
      new Error('File must be an XML file.'),
    )
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('File must be an XML file.')
  })

  it('sets fallback error for non-Error throws', async () => {
    mockParseInvoiceFile.mockRejectedValueOnce('raw string error')
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Kunne ikke analysere faktura')
  })

  it('data remains null when parse fails', async () => {
    mockParseInvoiceFile.mockRejectedValueOnce(new Error('fail'))
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.data).toBeNull()
  })

  it('loading is false after error', async () => {
    mockParseInvoiceFile.mockRejectedValueOnce(new Error('fail'))
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.loading).toBe(false)
  })
})

describe('useInvoiceParse — reset()', () => {
  it('clears data', async () => {
    mockParseInvoiceFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })
    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBeNull()
  })

  it('clears error', async () => {
    mockParseInvoiceFile.mockRejectedValueOnce(new Error('oops'))
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })
    act(() => {
      result.current.reset()
    })

    expect(result.current.error).toBeNull()
  })

  it('clears loading', async () => {
    mockParseInvoiceFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })
    act(() => {
      result.current.reset()
    })

    expect(result.current.loading).toBe(false)
  })
})
