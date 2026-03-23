/**
 * Unit tests for useTransportParse hook.
 *
 * No Clerk dependency here — the token is passed in directly by the caller.
 * Mocks: ../api/transport (parseTransportFile)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

import { useTransportParse } from '@/features/transport/hooks/useTransportParse'
import { parseTransportFile } from '@/features/transport/api/transport'
import type { TransportParseResponse } from '@/features/transport/types/transport'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/features/transport/api/transport', () => ({
  parseTransportFile: vi.fn(),
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
  it('calls parseTransportFile with the file, projectId, and token', async () => {
    mockParseTransportFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useTransportParse())
    const file = makeFile()

    await act(async () => {
      await result.current.parse(file, 42, 'my-token')
    })

    expect(mockParseTransportFile).toHaveBeenCalledWith(file, 42, 'my-token')
  })

  it('sets data on success', async () => {
    mockParseTransportFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useTransportParse())

    await act(async () => {
      await result.current.parse(makeFile(), 1)
    })

    expect(result.current.data).toEqual(MOCK_RESPONSE)
  })

  it('loading is false after success', async () => {
    mockParseTransportFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useTransportParse())

    await act(async () => {
      await result.current.parse(makeFile(), 1)
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
      result.current.parse(makeFile(), 1)
    })

    await waitFor(() => expect(result.current.loading).toBe(true))

    await act(async () => {
      resolve(MOCK_RESPONSE)
    })
    expect(result.current.loading).toBe(false)
  })
})

describe('useTransportParse — error handling', () => {
  it('sets error message on failure', async () => {
    mockParseTransportFile.mockRejectedValueOnce(
      new Error('Invalid transport file'),
    )
    const { result } = renderHook(() => useTransportParse())

    await act(async () => {
      await result.current.parse(makeFile(), 1)
    })

    expect(result.current.error).toBe('Invalid transport file')
  })

  it('sets fallback message for non-Error throws', async () => {
    mockParseTransportFile.mockRejectedValueOnce('unexpected')
    const { result } = renderHook(() => useTransportParse())

    await act(async () => {
      await result.current.parse(makeFile(), 1)
    })

    expect(result.current.error).toBe('Kunne ikke analysere transportfil')
  })
})

describe('useTransportParse — reset()', () => {
  it('clears data, error, and loading', async () => {
    mockParseTransportFile.mockResolvedValueOnce(MOCK_RESPONSE)
    const { result } = renderHook(() => useTransportParse())

    await act(async () => {
      await result.current.parse(makeFile(), 1)
    })
    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })
})
