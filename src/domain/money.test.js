import { describe, it, expect } from 'vitest'
import {
  MAX_CENTS,
  centsToDecimalString,
  formatMoney,
  isValidCents,
  parseAmount,
  signedCents,
  sumCents,
} from './money.js'

describe('parseAmount', () => {
  it('parses whole numbers and both decimal separators', () => {
    expect(parseAmount('12')).toEqual({ ok: true, cents: 1200 })
    expect(parseAmount('12.5')).toEqual({ ok: true, cents: 1250 })
    expect(parseAmount('12.50')).toEqual({ ok: true, cents: 1250 })
    expect(parseAmount('12,50')).toEqual({ ok: true, cents: 1250 })
    expect(parseAmount('  0.05 ')).toEqual({ ok: true, cents: 5 })
  })

  it('avoids the float rounding that 0.1 + 0.2 style maths would introduce', () => {
    expect(parseAmount('0.10').cents + parseAmount('0.20').cents).toBe(30)
    expect(parseAmount('1.15').cents).toBe(115)
    expect(parseAmount('8.29').cents).toBe(829)
  })

  it('rejects empty, zero and negative amounts', () => {
    expect(parseAmount('').ok).toBe(false)
    expect(parseAmount('   ').ok).toBe(false)
    expect(parseAmount(null).ok).toBe(false)
    expect(parseAmount(undefined).ok).toBe(false)
    expect(parseAmount('0').ok).toBe(false)
    expect(parseAmount('0.00').ok).toBe(false)
    expect(parseAmount('-5').ok).toBe(false)
    expect(parseAmount('-0.01').ok).toBe(false)
  })

  it('rejects junk, thousands separators and extra precision', () => {
    for (const input of ['abc', '1.2.3', '1 000', '1,234.56', '12.345', '1e3', '+5', '.5']) {
      expect(parseAmount(input).ok, input).toBe(false)
    }
  })

  it('rejects amounts beyond the supported maximum', () => {
    expect(parseAmount(centsToDecimalString(MAX_CENTS)).cents).toBe(MAX_CENTS)
    expect(parseAmount('1000000000').ok).toBe(false)
  })

  it('explains why input was rejected', () => {
    expect(parseAmount('').error).toMatch(/enter an amount/i)
    expect(parseAmount('-1').error).toMatch(/positive/i)
    expect(parseAmount('0').error).toMatch(/more than zero/i)
  })
})

describe('isValidCents', () => {
  it('accepts only positive integers within range', () => {
    expect(isValidCents(1)).toBe(true)
    expect(isValidCents(MAX_CENTS)).toBe(true)
    expect(isValidCents(0)).toBe(false)
    expect(isValidCents(-1)).toBe(false)
    expect(isValidCents(1.5)).toBe(false)
    expect(isValidCents(MAX_CENTS + 1)).toBe(false)
    expect(isValidCents('100')).toBe(false)
    expect(isValidCents(NaN)).toBe(false)
  })
})

describe('centsToDecimalString', () => {
  it('always keeps two decimals', () => {
    expect(centsToDecimalString(0)).toBe('0.00')
    expect(centsToDecimalString(5)).toBe('0.05')
    expect(centsToDecimalString(1250)).toBe('12.50')
    expect(centsToDecimalString(-1250)).toBe('-12.50')
    expect(centsToDecimalString(MAX_CENTS)).toBe('999999999.99')
  })
})

describe('sumCents and signedCents', () => {
  it('sums exactly', () => {
    expect(sumCents([])).toBe(0)
    expect(sumCents([115, 829, 5])).toBe(949)
  })

  it('makes expenses negative and income positive', () => {
    expect(signedCents({ type: 'expense', amountCents: 500 })).toBe(-500)
    expect(signedCents({ type: 'income', amountCents: 500 })).toBe(500)
  })
})

describe('formatMoney', () => {
  it('formats cents as currency', () => {
    expect(formatMoney(1250, 'EUR')).toMatch(/12[.,]50/)
    expect(formatMoney(MAX_CENTS, 'EUR')).toMatch(/999\D?999\D?999[.,]99/)
  })

  it('falls back instead of throwing on an unusable currency code', () => {
    expect(formatMoney(1250, 'NOT-A-CURRENCY')).toBe('NOT-A-CURRENCY 12.50')
  })
})
