/**
 * Unit tests for useInvoiceParse hook.
 *
 * Tests async state management: loading, data, error, and reset.
 * Mocks:
 * - @clerk/react (useAuth/getToken) — never call real Clerk in tests
 * - shared/api/client (postFile) — never make real HTTP calls in tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

import { useInvoiceParse } from '@/features/invoice/hooks/useInvoiceParse'
import { postFile } from '@/shared/api/client'
import type { InvoiceResponse } from '@/features/invoice/types/invoice'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue('mock-token'),
  }),
}))

vi.mock('@/shared/api/client', () => ({
  postFile: vi.fn(),
}))

const mockPostFile = vi.mocked(postFile)

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
  it('calls postFile with the correct endpoint and file', async () => {
    mockPostFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useInvoiceParse())
    const file = makeFile()

    await act(async () => {
      await result.current.parse(file)
    })

    expect(mockPostFile).toHaveBeenCalledWith(
      '/invoice/parse',
      file,
      'mock-token',
    )
  })

  it('sets data on success', async () => {
    mockPostFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.data).toEqual(MOCK_RESPONSE)
  })

  it('clears error before a new parse call', async () => {
    // First call fails
    mockPostFile.mockRejectedValueOnce(new Error('first error'))
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })
    expect(result.current.error).toBe('first error')

    // Second call succeeds — error should be cleared
    mockPostFile.mockResolvedValueOnce(MOCK_RESPONSE)
    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.error).toBeNull()
  })

  it('clears previous data before a new parse call', async () => {
    mockPostFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })
    expect(result.current.data).not.toBeNull()

    // Second call — data should be null while pending
    let resolveSecond!: (v: InvoiceResponse) => void
    mockPostFile.mockReturnValueOnce(
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
    mockPostFile.mockResolvedValueOnce(MOCK_RESPONSE)
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
    mockPostFile.mockReturnValueOnce(
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
  it('sets error message when postFile throws an Error', async () => {
    mockPostFile.mockRejectedValueOnce(new Error('File must be an XML file.'))
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.error).toBe('File must be an XML file.')
  })

  it('sets fallback error message for non-Error throws', async () => {
    mockPostFile.mockRejectedValueOnce('raw string error')
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.error).toBe('Unknown error')
  })

  it('data remains null when parse fails', async () => {
    mockPostFile.mockRejectedValueOnce(new Error('fail'))
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.data).toBeNull()
  })

  it('loading is false after error', async () => {
    mockPostFile.mockRejectedValueOnce(new Error('fail'))
    const { result } = renderHook(() => useInvoiceParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.loading).toBe(false)
  })
})

describe('useInvoiceParse — reset()', () => {
  it('clears data', async () => {
    mockPostFile.mockResolvedValueOnce(MOCK_RESPONSE)
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
    mockPostFile.mockRejectedValueOnce(new Error('oops'))
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
    mockPostFile.mockResolvedValueOnce(MOCK_RESPONSE)
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
