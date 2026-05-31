/** Argentina mobile for WhatsApp: 549 + 10-digit national number. */

export function stripPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

/** Normalize any local/international AR mobile input to wa.me digits (549XXXXXXXXXX). */
export function normalizeArgentinaWhatsApp(phone: string): string {
  let d = stripPhoneDigits(phone)
  if (!d) return ''

  if (d.startsWith('00')) d = d.slice(2)

  if (d.startsWith('549')) {
    return d.slice(0, 13)
  }

  if (d.startsWith('54')) {
    const rest = d.slice(2).replace(/^0+/, '')
    const without15 = rest.replace(/^(\d{2,4})15(\d{6,8})$/, '$1$2')
    if (without15.startsWith('9')) {
      return `54${without15}`.slice(0, 13)
    }
    return `549${without15}`.slice(0, 13)
  }

  d = d.replace(/^0+/, '')
  d = d.replace(/^(\d{2,4})15(\d{6,8})$/, '$1$2')

  // 9 + código de área + número (ej. 91122542737)
  if (d.startsWith('9') && d.length === 11) {
    d = d.slice(1)
  }

  return `549${d}`.slice(0, 13)
}

export function validateArgentinaMobilePhone(phone: string): string | null {
  const normalized = normalizeArgentinaWhatsApp(phone)
  if (!normalized) return 'El teléfono es obligatorio'
  if (!/^549\d{10}$/.test(normalized)) {
    return 'Ingresá un celular argentino válido (código de área + número, 10 dígitos)'
  }
  return null
}

export function extractArgentinaNationalNumber(phone: string): string {
  const normalized = normalizeArgentinaWhatsApp(phone)
  if (normalized.startsWith('549') && normalized.length >= 12) {
    return normalized.slice(3, 13)
  }
  return stripPhoneDigits(phone).replace(/^0+/, '').replace(/^(\d{2,4})15(\d{6,8})$/, '$1$2').slice(0, 10)
}

/** Format national digits while typing (e.g. 11 2254-2737). */
export function formatArgentinaNationalInput(digits: string): string {
  const d = stripPhoneDigits(digits).slice(0, 10)
  if (!d) return ''

  if (d.startsWith('11')) {
    if (d.length <= 2) return d
    if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2)}`
    return `${d.slice(0, 2)} ${d.slice(2, 6)}-${d.slice(6)}`
  }

  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
  return `${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6)}`
}

/** Display stored phone as +54 9 11 2254-2737 */
export function formatArgentinaPhoneDisplay(phone: string): string {
  const national = extractArgentinaNationalNumber(phone)
  if (!national) return phone
  const formatted = formatArgentinaNationalInput(national)
  return formatted ? `+54 9 ${formatted}` : phone
}

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const clean = normalizeArgentinaWhatsApp(phone)
  if (!/^549\d{10}$/.test(clean)) return null
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}
