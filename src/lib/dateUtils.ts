import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/** Parse YYYY-MM-DD as local calendar date (avoids UTC midnight shift). */
export function parseLocalDate(isoDate: string): Date {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return new Date(isoDate)
  const [, y, m, d] = match
  return new Date(Number(y), Number(m) - 1, Number(d))
}

/** Format a YYYY-MM-DD string for display in Spanish locale. */
export function formatLocalDate(
  isoDate: string,
  pattern = 'dd/MM/yyyy',
): string {
  return format(parseLocalDate(isoDate), pattern, { locale: es })
}

/** YYYY-MM-DD from a local Date (no UTC shift). */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Display dd/MM/yyyy from ISO or empty string. */
export function formatDisplayDate(isoDate: string | null | undefined): string {
  if (!isoDate) return ''
  try {
    return formatLocalDate(isoDate, 'dd/MM/yyyy')
  } catch {
    return ''
  }
}

/** Parse dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy or YYYY-MM-DD into a local Date. */
export function parseFlexibleDate(input: string): Date | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = parseLocalDate(trimmed)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const match = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const d = new Date(year, month - 1, day)
  if (
    d.getFullYear() !== year
    || d.getMonth() !== month - 1
    || d.getDate() !== day
  ) return null

  return d
}

/** Age in full years from a YYYY-MM-DD birth date. */
export function calcAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null
  const birth = parseLocalDate(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}
