/** Profundidad de ruta para animar avance (→) o retroceso (←). */
export function getRouteDepth(pathname: string): number {
  if (pathname === '/login' || pathname.startsWith('/firma')) return 0
  if (pathname === '/admin' || pathname === '/admin/perfil') return 1
  if (/^\/admin\/paciente\/[^/]+$/.test(pathname)) return 2
  if (pathname.includes('/consulta') || pathname.includes('/rutina')) return 3
  if (pathname.includes('/ficha')) return 4
  return 1
}

export type PageTransitionVariant = 'forward' | 'back' | 'fade'

export function getPageTransitionVariant(
  fromPath: string,
  toPath: string,
): PageTransitionVariant {
  const fromDepth = getRouteDepth(fromPath)
  const toDepth = getRouteDepth(toPath)

  if (toDepth > fromDepth) return 'forward'
  if (toDepth < fromDepth) return 'back'
  return 'fade'
}

export const PAGE_TRANSITION_MS = 280
