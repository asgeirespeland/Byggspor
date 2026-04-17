/**
 * Unit tests for useTransportParse hook.
 *
 * No Clerk dependency here — the token is passed in directly by the caller.
 * Mocks:
 * - ../api/transport (parseTransportFile) — never make real HTTP calls
 * - sonner (toast) — suppress toast side-effects
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

import { useTransportParse } from '@/entities/transport/hooks/useTransportParse'
import { parseTransportFile } from '@/entities/transport/api/transport'
import type { TransportParseResponse } from '@/entities/transport/types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/entities/transport/api/transport', () => ({
  parseTransportFile: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockParseTransportFile = vi.mocked(parseTransportFile)

// ── Fixtures ──────────────────────────────────────────────────────────────────

// Adjust this shape to match your actual TransportParseResponse type
const MOCK_RESPONSE = { trips: [] } as unknown as TransportParseResponse

function makeFile(name = 'transport.xml') {
  return new File(['<Transport/>'], name, { type: 'text/xml' })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useTransportParse — initial state', () => {
  it('starts with data null', () => {
    const { result } = renderHook(() => useTransportParse())
    expect(result.current.data).toBeNull()
  })

  it('starts with loading false', () => {
    const { result } = renderHook(() => useTransportParse())
    expect(result.current.loading).toBe(false)
  })

  it('starts with error null', () => {
    const { result } = renderHook(() => useTransportParse())
    expect(result.current.error).toBeNull()
  })
})

describe('useTransportParse — parse() success', () => {
  it('calls parseTransportFile with the file and token', async () => {
    mockParseTransportFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useTransportParse())
    const file = makeFile()

    await act(async () => {
      await result.current.parse(file, 'my-token')
    })

    expect(mockParseTransportFile).toHaveBeenCalledWith(file, 'my-token')
  })

  it('sets data on success', async () => {
    mockParseTransportFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useTransportParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.data).toEqual(MOCK_RESPONSE)
  })

  it('loading is false after success', async () => {
    mockParseTransportFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useTransportParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.loading).toBe(false)
  })
})

describe('useTransportParse — loading state', () => {
  it('sets loading true while request is in flight', async () => {
    let resolve!: (v: TransportParseResponse) => void
    mockParseTransportFile.mockReturnValueOnce(
      new Promise<TransportParseResponse>((res) => {
        resolve = res
      }),
    )

    const { result } = renderHook(() => useTransportParse())

    act(() => {
      result.current.parse(makeFile())
    })

    await waitFor(() => expect(result.current.loading).toBe(true))

    await act(async () => {
      resolve(MOCK_RESPONSE)
    })
    expect(result.current.loading).toBe(false)
  })
})

describe('useTransportParse — error handling', () => {
  it('sets error on failure', async () => {
    mockParseTransportFile.mockRejectedValueOnce(
      new Error('Invalid transport file'),
    )
    const { result } = renderHook(() => useTransportParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Invalid transport file')
  })

  it('sets fallback error for non-Error throws', async () => {
    mockParseTransportFile.mockRejectedValueOnce('unexpected')
    const { result } = renderHook(() => useTransportParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe(
      'Kunne ikke analysere transportfil',
    )
  })
})

describe('useTransportParse — reset()', () => {
  it('clears data, error, and loading', async () => {
    mockParseTransportFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useTransportParse())

    await act(async () => {
      await result.current.parse(makeFile())
    })
    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })
})
