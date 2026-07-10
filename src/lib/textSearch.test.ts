import { describe, expect, it } from 'vitest'
import { normalizeVietnamese } from './textSearch'

describe('normalizeVietnamese', () => {
  it('strips diacritics and lowercases', () => {
    expect(normalizeVietnamese('Nguyễn Văn A')).toBe('nguyen van a')
  })

  it('handles đ/Đ specially since Unicode NFD does not decompose it', () => {
    expect(normalizeVietnamese('Đặng Thị Đào')).toBe('dang thi dao')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeVietnamese('  Trần Thị B  ')).toBe('tran thi b')
  })
})
