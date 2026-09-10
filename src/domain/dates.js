/**
 * Dates are "YYYY-MM-DD" strings and months are "YYYY-MM" strings. Both sort
 * and compare lexicographically, which keeps ranges and month bucketing free
 * of Date-object timezone drift.
 */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTH_RE = /^(\d{4})-(\d{2})$/

export function isValidDate(value) {
  const match = DATE_RE.exec(String(value ?? ''))
  if (!match) return false
  const [, y, m, d] = match.map(Number)
  if (m < 1 || m > 12 || d < 1) return false
  return d <= new Date(Date.UTC(y, m, 0)).getUTCDate()
}

export function isValidMonth(value) {
  const match = MONTH_RE.exec(String(value ?? ''))
  if (!match) return false
  const month = Number(match[2])
  return month >= 1 && month <= 12
}

/** Today in the user's own calendar, not UTC. */
export function todayISO(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function monthOf(dateISO) {
  return String(dateISO).slice(0, 7)
}

export function currentMonth(now = new Date()) {
  return monthOf(todayISO(now))
}

/** Shifts a month key by whole months, rolling the year over as needed. */
export function addMonths(monthKey, delta) {
  const [year, month] = monthKey.split('-').map(Number)
  const zeroBased = (year * 12 + (month - 1)) + delta
  const nextYear = Math.floor(zeroBased / 12)
  const nextMonth = zeroBased - nextYear * 12 + 1
  return `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}`
}

/** Inclusive first and last day of a month, as ISO date strings. */
export function monthRange(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return { start: `${monthKey}-01`, end: `${monthKey}-${String(lastDay).padStart(2, '0')}` }
}

export function isInMonth(dateISO, monthKey) {
  return monthOf(dateISO) === monthKey
}

/** Inclusive range check; `from` and `to` are optional. */
export function isWithinRange(dateISO, from, to) {
  if (from && dateISO < from) return false
  if (to && dateISO > to) return false
  return true
}

export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  )
}

export function formatDateLabel(dateISO) {
  const [year, month, day] = dateISO.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(
    new Date(Date.UTC(year, month - 1, day)),
  )
}
