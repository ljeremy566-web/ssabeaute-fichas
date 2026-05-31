import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface WizardTab {
  id: string
  label: string
  icon: ReactNode
  completed?: boolean
}

const MOBILE_SHORT_LABELS: Record<string, string> = {
  consentimiento: 'Consent.',
  anamnesis: 'Anamnesis',
  evaluacion: 'Evaluación',
  mapa: 'Mapa',
  evidencia: 'Fotos',
  tratamientos: 'Tratam.',
}

interface WizardTabNavProps {
  tabs: WizardTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export const WizardTabNav = ({ tabs, activeTab, onTabChange }: WizardTabNavProps) => {
  const mobileNavRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  useEffect(() => {
    const el = tabRefs.current.get(activeTab)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeTab])

  return (
    <>
      {/* Desktop: Vertical navigation rail */}
      <nav className="hidden md:flex flex-col w-56 shrink-0 border-r border-outline bg-surface py-4 px-3 gap-1">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ease-[var(--ease-google-emphasized)] cursor-pointer w-full text-left group min-h-[48px] hover:translate-x-1 active:scale-[0.98]',
                isActive
                  ? 'bg-primary-light text-primary font-semibold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container'
              )}
            >
              <span className={cn(
                'flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-all duration-300 ease-[var(--ease-google-emphasized)] text-xs font-semibold group-hover:scale-110',
                isActive ? 'bg-primary text-on-primary scale-110' : 'bg-surface-container text-on-surface-variant group-hover:bg-outline-variant',
                tab.completed && !isActive && 'bg-success-light text-success'
              )}>
                {tab.completed && !isActive ? (
                  <svg className="w-4 h-4 animate-google-fade" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span className="truncate transition-transform duration-300 group-hover:translate-x-0.5">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Mobile: Horizontal scrollable tabs */}
      <nav
        ref={mobileNavRef}
        className="md:hidden flex overflow-x-auto border-b border-outline bg-surface px-1 gap-0 scrollbar-none scroll-snap-x shrink-0 overscroll-x-contain"
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          const mobileLabel = MOBILE_SHORT_LABELS[tab.id] ?? tab.label
          return (
            <button
              key={tab.id}
              ref={el => {
                if (el) tabRefs.current.set(tab.id, el)
                else tabRefs.current.delete(tab.id)
              }}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'scroll-snap-start flex flex-col items-center justify-center gap-1 px-3 py-2.5 min-w-[68px] min-h-[72px] shrink-0 text-[11px] font-medium transition-all duration-300 ease-[var(--ease-google-emphasized)] cursor-pointer relative active:scale-[0.95]',
                isActive ? 'text-primary' : 'text-on-surface-variant'
              )}
            >
              <span className={cn(
                'flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 ease-[var(--ease-google-emphasized)]',
                isActive ? 'bg-primary-light text-primary scale-110 font-bold' : 'text-on-surface-variant',
                tab.completed && !isActive && 'bg-success-light text-success'
              )}>
                {tab.completed && !isActive ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  tab.icon
                )}
              </span>
              <span className={cn(
                "whitespace-nowrap leading-tight text-center max-w-[72px] truncate transition-all duration-300",
                isActive ? "font-semibold scale-105" : ""
              )}>
                {mobileLabel}
              </span>
              <span className={cn(
                "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.75 bg-primary rounded-full transition-all duration-300 ease-[var(--ease-google-emphasized)]",
                isActive ? "w-10 opacity-100 scale-x-100" : "w-4 opacity-0 scale-x-50"
              )} />
            </button>
          )
        })}
      </nav>
    </>
  )
}
