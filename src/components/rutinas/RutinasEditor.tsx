interface RutinasEditorProps {
  rutinaDia: string
  rutinaNoche: string
  onRutinaDiaChange: (value: string) => void
  onRutinaNocheChange: (value: string) => void
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-on-surface font-outfit">{children}</h3>
}

export function RutinasEditor({
  rutinaDia,
  rutinaNoche,
  onRutinaDiaChange,
  onRutinaNocheChange,
}: RutinasEditorProps) {
  return (
    <div className="space-y-6">
      <div className="p-5 bg-surface rounded-xl border border-outline">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <span className="text-amber-600 text-base" aria-hidden>☀️</span>
          </div>
          <SectionTitle>Rutina de Día</SectionTitle>
        </div>
        <textarea
          value={rutinaDia}
          onChange={e => onRutinaDiaChange(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 rounded-xl border border-outline text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          placeholder="Describe los pasos de la rutina de día: limpiador, tónico, sérum, hidratante, protector solar..."
        />
      </div>

      <div className="p-5 bg-surface rounded-xl border border-outline">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-indigo-600 text-base" aria-hidden>🌙</span>
          </div>
          <SectionTitle>Rutina de Noche</SectionTitle>
        </div>
        <textarea
          value={rutinaNoche}
          onChange={e => onRutinaNocheChange(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 rounded-xl border border-outline text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          placeholder="Describe los pasos de la rutina de noche: desmaquillante, limpiador, tónico, sérum, crema nocturna..."
        />
      </div>
    </div>
  )
}
