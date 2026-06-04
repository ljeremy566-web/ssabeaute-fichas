import { useEffect, useRef, useState, type ReactNode } from 'react'
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

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const pathnameRef = useRef(location.pathname)
  const pendingChildren = useRef<ReactNode | null>(null)
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [rendered, setRendered] = useState(children)
  const [phase, setPhase] = useState<Phase>('enter')
  const [variant, setVariant] = useState<PageTransitionVariant>('fade')
  const isFirstPaint = useRef(true)

  useEffect(() => {
    if (location.pathname === pathnameRef.current) {
      setRendered(children)
      return
    }

    const nextVariant = getPageTransitionVariant(pathnameRef.current, location.pathname)
    pathnameRef.current = location.pathname
    pendingChildren.current = children
    setVariant(nextVariant)
    setPhase('exit')

    if (exitTimer.current) clearTimeout(exitTimer.current)
    exitTimer.current = setTimeout(() => {
      if (pendingChildren.current !== null) {
        setRendered(pendingChildren.current)
        pendingChildren.current = null
      }
      setPhase('enter')
      exitTimer.current = null
    }, PAGE_TRANSITION_MS * 0.75)

    return () => {
      if (exitTimer.current) {
        clearTimeout(exitTimer.current)
        exitTimer.current = null
      }
    }
  }, [location.pathname, children])

  useEffect(() => {
    if (phase !== 'enter') return
    const t = setTimeout(() => setPhase('idle'), PAGE_TRANSITION_MS)
    return () => clearTimeout(t)
  }, [phase, rendered])

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
