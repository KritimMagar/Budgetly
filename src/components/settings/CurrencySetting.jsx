import { useState } from 'react'
import Button from '../ui/Button.jsx'
import Field, { controlClass, controlErrorClass } from '../ui/Field.jsx'
import { formatMoney } from '../../domain/money.js'

const COMMON = ['EUR', 'USD', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'JPY', 'AUD', 'CAD', 'INR', 'NPR', 'BRL', 'ZAR']

/**
 * The browser's own list of currency codes. Intl happily formats any
 * well-formed three letters — "XYZ 1.00" — so without this a typo would be
 * accepted and quietly relabel every amount in the app.
 */
const KNOWN_CODES = (() => {
  try {
    return Intl.supportedValuesOf?.('currency') ?? null
  } catch {
    return null
  }
})()

function isSupported(code) {
  if (KNOWN_CODES) return KNOWN_CODES.includes(code)
  try {
    new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(1)
    return true
  } catch {
    return false
  }
}

export default function CurrencySetting({ currency, onChange }) {
  const [value, setValue] = useState(currency)
  const [error, setError] = useState(null)

  const code = value.trim().toUpperCase()
  const changed = code !== currency

  function handleSubmit(event) {
    event.preventDefault()
    if (!/^[A-Za-z]{3}$/.test(code)) {
      setError('Use a three-letter code, like EUR')
      return
    }
    if (!isSupported(code)) {
      setError(`${code} is not a currency code`)
      return
    }
    onChange(code)
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="font-semibold">Currency</h2>
      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
        Amounts are stored as numbers, so changing this restyles them without converting.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-3 space-y-3">
        <Field label="Currency code" error={error} hint={`Shows as ${formatMoney(123456, currency)}`}>
          {(props) => (
            <div className="flex gap-2">
              <input
                {...props}
                value={value}
                onChange={(event) => {
                  setValue(event.target.value)
                  setError(null)
                }}
                list="currency-codes"
                type="text"
                maxLength={3}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className={`${controlClass} w-32 uppercase ${error ? controlErrorClass : ''}`}
              />
              <Button type="submit" disabled={!changed}>
                Save
              </Button>
            </div>
          )}
        </Field>
        <datalist id="currency-codes">
          {(KNOWN_CODES ?? COMMON).map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </form>
    </section>
  )
}
