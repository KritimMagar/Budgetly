import { describe, it, expect } from 'vitest'
import {
  addMonths,
  currentMonth,
  formatMonthLabel,
  isInMonth,
  isValidDate,
  isValidMonth,
  isWithinRange,
  monthOf,
  monthRange,
  todayISO,
} from './dates.js'

describe('isValidDate', () => {
  it('accepts real calendar dates', () => {
    expect(isValidDate('2026-09-10')).toBe(true)
    expect(isValidDate('2024-02-29')).toBe(true)
  })

  it('rejects malformed or impossible dates', () => {
    for (const input of ['', '2026-9-10', '2026-13-01', '2026-00-10', '2026-02-30', '2023-02-29', 'today', null]) {
      expect(isValidDate(input), String(input)).toBe(false)
    }
  })
})

describe('isValidMonth', () => {
  it('accepts YYYY-MM only', () => {
    expect(isValidMonth('2026-09')).toBe(true)
    expect(isValidMonth('2026-13')).toBe(false)
    expect(isValidMonth('2026-09-10')).toBe(false)
  })
})

describe('todayISO', () => {
  it('uses the local calendar day, not UTC', () => {
    // 00:30 local on the 10th is still the 9th in UTC.
    const localMidnightish = new Date(2026, 8, 10, 0, 30)
    expect(todayISO(localMidnightish)).toBe('2026-09-10')
    expect(currentMonth(localMidnightish)).toBe('2026-09')
  })
})

describe('addMonths', () => {
  it('rolls over year boundaries in both directions', () => {
    expect(addMonths('2026-09', 1)).toBe('2026-10')
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-09', 0)).toBe('2026-09')
    expect(addMonths('2026-09', 16)).toBe('2028-01')
    expect(addMonths('2026-09', -21)).toBe('2024-12')
  })
})

describe('monthRange', () => {
  it('covers the whole month including leap days', () => {
    expect(monthRange('2026-09')).toEqual({ start: '2026-09-01', end: '2026-09-30' })
    expect(monthRange('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' })
    expect(monthRange('2024-02')).toEqual({ start: '2024-02-01', end: '2024-02-29' })
    expect(monthRange('2026-12')).toEqual({ start: '2026-12-01', end: '2026-12-31' })
  })
})

describe('month membership and ranges', () => {
  it('buckets dates by month', () => {
    expect(monthOf('2026-09-10')).toBe('2026-09')
    expect(isInMonth('2026-09-30', '2026-09')).toBe(true)
    expect(isInMonth('2026-10-01', '2026-09')).toBe(false)
  })

  it('treats range bounds as inclusive and optional', () => {
    expect(isWithinRange('2026-09-10', '2026-09-01', '2026-09-30')).toBe(true)
    expect(isWithinRange('2026-09-01', '2026-09-01', '2026-09-30')).toBe(true)
    expect(isWithinRange('2026-09-30', '2026-09-01', '2026-09-30')).toBe(true)
    expect(isWithinRange('2026-08-31', '2026-09-01', null)).toBe(false)
    expect(isWithinRange('2026-10-01', null, '2026-09-30')).toBe(false)
    expect(isWithinRange('2026-10-01', '', '')).toBe(true)
  })
})

describe('labels', () => {
  it('renders a month without shifting into the previous one', () => {
    expect(formatMonthLabel('2026-01')).toMatch(/2026/)
    expect(formatMonthLabel('2026-01')).not.toMatch(/2025/)
  })
})
