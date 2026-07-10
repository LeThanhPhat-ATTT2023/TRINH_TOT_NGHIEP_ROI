// src/hooks/useGuestSearch.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createQueryBuilderMock } from '../test/supabaseMock'

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabaseClient'
import { useGuestSearch } from './useGuestSearch'

const guests = [
  { id: '1', full_name: 'Nguyễn Văn A', salutation: 'Anh' },
  { id: '2', full_name: 'Trần Thị B', salutation: 'Chị' },
]

describe('useGuestSearch', () => {
  it('loads guests and returns diacritic-insensitive fuzzy matches for a query', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockReturnValue(createQueryBuilderMock({ data: guests, error: null }))

    const { result } = renderHook(() => useGuestSearch())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.search('Nguyen')).toEqual([guests[0]])
  })

  it('returns an empty array for a blank query', async () => {
    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>
    fromMock.mockReturnValue(createQueryBuilderMock({ data: guests, error: null }))

    const { result } = renderHook(() => useGuestSearch())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.search('   ')).toEqual([])
  })
})
