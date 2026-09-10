/**
 * Money is an integer number of cents everywhere in the app. Floats appear in
 * exactly one place: the final division inside `formatMoney`, where the value
 * is handed to Intl for display and never read back.
 */

/** 999,999,999.99 — high enough for real budgets, low enough to keep sums exact. */
export const MAX_CENTS = 99_999_999_999

const fail = (error) => ({ ok: false, error })

/**
 * Parses user input into cents without float arithmetic.
 * Accepts "12", "12.5", "12,50". Rejects empty, zero, negative, thousands
 * separators and more than two decimals.
 *
 * @returns {{ok: true, cents: number} | {ok: false, error: string}}
 */
export function parseAmount(raw) {
  const text = String(raw ?? '').trim()
  if (text === '') return fail('Enter an amount')
  if (text.startsWith('-')) return fail('Amount must be positive')

  const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(text)
  if (!match) return fail('Enter a number like 12.50')

  const [, whole, frac = ''] = match
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0'))

  if (cents === 0) return fail('Amount must be more than zero')
  if (cents > MAX_CENTS) return fail('Amount is too large')
  return { ok: true, cents }
}

/** True for a value safe to store as an amount: a positive, in-range integer. */
export function isValidCents(value) {
  return Number.isInteger(value) && value > 0 && value <= MAX_CENTS
}

/**
 * Cents to a plain decimal string ("1250" -> "12.50") using integer math only.
 * Used for CSV export and for pre-filling the amount field when editing.
 */
export function centsToDecimalString(cents) {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}

export function sumCents(values) {
  return values.reduce((total, value) => total + value, 0)
}

/** Signed cents for a transaction, so income and expense can be summed together. */
export function signedCents({ type, amountCents }) {
  return type === 'expense' ? -amountCents : amountCents
}

const formatters = new Map()

function formatterFor(currency, options) {
  const key = `${currency}|${options.signDisplay ?? ''}|${options.compact ?? ''}`
  let formatter = formatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      signDisplay: options.signDisplay ?? 'auto',
      ...(options.compact ? { notation: 'compact', maximumFractionDigits: 1 } : null),
    })
    formatters.set(key, formatter)
  }
  return formatter
}

/**
 * Formats cents for display. Falls back to a plain string if the browser
 * rejects the currency code, so a bad setting can never blank the UI.
 */
export function formatMoney(cents, currency = 'EUR', options = {}) {
  try {
    return formatterFor(currency, options).format(cents / 100)
  } catch {
    return `${currency} ${centsToDecimalString(cents)}`
  }
}
