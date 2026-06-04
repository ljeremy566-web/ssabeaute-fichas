import { type ReactNode } from 'react'
import { Card } from '../ui/Card'
import { cn } from '../../lib/cn'

export type ClinicalTabId = 'datos' | 'antecedentes' | 'diagnostico'

interface TabDef {
  id: ClinicalTabId
  label: string
  shortLabel: string
  icon: ReactNode
}

interface PatientClinicalTabsCardProps {
  tabs: TabDef[]
  activeTab: ClinicalTabId
  onTabChange: (id: ClinicalTabId) => void
  children: ReactNode
  contextChips?: string[]
}

export function PatientClinicalTabsCard({
  tabs,
  activeTab,
  onTabChange,
  children,
  contextChips = [],
}: PatientClinicalTabsCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-3 min-h-[48px] text-xs font-semibold font-outfit transition-colors cursor-pointer',
              activeTab === tab.id
                ? 'text-brand border-b-2 border-brand bg-brand-light/30'
                : 'text-muted hover:text-ink hover:bg-neutral-50',
            )}
          >
            {tab.icon}
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="p-5">{children}</div>
      {contextChips.length > 0 && (
        <div className="px-5 pb-5 flex flex-wrap gap-2">
          {contextChips.map(chip => (
            <span
              key={chip}
              className="px-3 py-1 rounded-full text-xs font-medium bg-brand-light/60 text-brand border border-brand-light"
            >
              {chip}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}
