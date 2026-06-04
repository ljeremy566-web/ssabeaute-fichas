import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import {
  getPageTransitionVariant,
  PAGE_TRANSITION_MS,
  type PageTransitionVariant,
} from '../../lib/pageTransitionUtils'

type Phase = 'enter' | 'exit' | 'idle'

interface PageTransitionProps {
  children: ReactNode
}

const enterClass: Record<PageTransitionVariant, string> = {
  forward: 'animate-page-enter-forward',
  back: 'animate-page-enter-back',
  fade: 'animate-page-enter-fade',
}

const exitClass: Record<PageTransitionVariant, string> = {
  forward: 'animate-page-exit-forward',
  back: 'animate-page-exit-back',
  fade: 'animate-page-exit-fade',
}

/** Devuelve true si el valor es un children válido (no nulo/undefined). */
function hasContent(node: ReactNode): boolean {
  return node !== null && node !== undefined
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  // pathname que actualmente está en la pantalla (post-animación)
  const renderedPathnameRef = useRef(location.pathname)
  // pathname al que estamos navegando (durante la animación de salida)
  const pendingPathnameRef = useRef<string | null>(null)
  const pendingChildren = useRef<ReactNode>(null)
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Siempre mantener el último children válido para no renderizar null
  const lastValidChildren = useRef<ReactNode>(hasContent(children) ? children : null)

  const [rendered, setRendered] = useState<ReactNode>(() =>
    hasContent(children) ? children : null,
  )
  const [phase, setPhase] = useState<Phase>('enter')
  const [variant, setVariant] = useState<PageTransitionVariant>('fade')
  const isFirstPaint = useRef(true)

  // Mantener el ref actualizado con el último children válido después de cada render.
  // useLayoutEffect corre síncronamente antes del paint, garantizando que el ref
  // esté al día antes de que cualquier setTimeout lo consuma.
  useLayoutEffect(() => {
    if (hasContent(children)) {
      lastValidChildren.current = children
    }
  })

  // Efecto para manejar cambios de pathname (navegación entre páginas)
  useEffect(() => {
    const currentPathname = location.pathname
    const fromPathname = renderedPathnameRef.current

    if (currentPathname === fromPathname) return

    const nextVariant = getPageTransitionVariant(fromPathname, currentPathname)
    pendingPathnameRef.current = currentPathname

    // Guardar el children actual como pendiente para mostrar después de la animación de salida.
    // Si children es null (Suspense cargando), el segundo efecto lo actualizará cuando resuelva.
    pendingChildren.current = hasContent(children) ? children : null

    setVariant(nextVariant)
    setPhase('exit')

    if (exitTimer.current) clearTimeout(exitTimer.current)
    exitTimer.current = setTimeout(() => {
      // Usar el children más reciente disponible; si sigue siendo null, usar el lastValidChildren
      const toRender = pendingChildren.current ?? lastValidChildren.current
      if (toRender !== null) setRendered(toRender)
      pendingChildren.current = null
      pendingPathnameRef.current = null
      renderedPathnameRef.current = currentPathname
      setPhase('enter')
      exitTimer.current = null
    }, PAGE_TRANSITION_MS * 0.75)

    return () => {
      if (exitTimer.current) {
        clearTimeout(exitTimer.current)
        exitTimer.current = null
      }
    }
    // Solo re-ejecutar cuando cambie el pathname, no cuando cambien children
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Efecto para sincronizar children del pathname activo (e.g., Suspense resolvió)
  useEffect(() => {
    if (!hasContent(children)) return

    const isPendingRoute = pendingPathnameRef.current === location.pathname
    const isRenderedRoute = renderedPathnameRef.current === location.pathname

    if (isPendingRoute) {
      // Suspense resolvió el nuevo route mientras la animación de salida está corriendo
      pendingChildren.current = children
      return
    }

    if (isRenderedRoute && phase !== 'exit') {
      // Actualización de children en el mismo route sin navegación (poco común pero posible)
      setRendered(children)
    }
  }, [children, location.pathname, phase])

  // Efecto para hacer idle después de la animación de entrada
  useEffect(() => {
    if (phase !== 'enter') return
    const t = setTimeout(() => setPhase('idle'), PAGE_TRANSITION_MS)
    return () => clearTimeout(t)
  }, [phase, rendered])

  // Primera carga: hacer idle después de la animación inicial
  useEffect(() => {
    if (isFirstPaint.current) {
      isFirstPaint.current = false
      const t = setTimeout(() => setPhase('idle'), PAGE_TRANSITION_MS)
      return () => clearTimeout(t)
    }
  }, [])

  const animClass = phase === 'exit' ? exitClass[variant] : enterClass[variant]

  return (
    <div
      className={cn(
        'page-transition-root min-h-0 w-full',
        phase !== 'idle' && animClass,
      )}
    >
      {rendered}
    </div>
  )
}
