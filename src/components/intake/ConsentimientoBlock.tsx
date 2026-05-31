import { SignaturePad } from './SignaturePad'

interface ConsentimientoBlockProps {
  mode?: 'staff' | 'patient'
  readOnly?: boolean
  aceptaConsentimiento: boolean
  onAceptaConsentimientoChange: (value: boolean) => void
  permiteFotosRedes: boolean
  onPermiteFotosRedesChange: (value: boolean) => void
  firmaBase64: string | null
  onFirmaChange: (base64: string | null) => void
}

export function ConsentimientoBlock({
  mode = 'staff',
  readOnly = false,
  aceptaConsentimiento,
  onAceptaConsentimientoChange,
  permiteFotosRedes,
  onPermiteFotosRedesChange,
  firmaBase64,
  onFirmaChange,
}: ConsentimientoBlockProps) {
  const isPatient = mode === 'patient'

  const consentLabel = isPatient
    ? 'Acepto el consentimiento informado y autorizo el procedimiento.'
    : 'El paciente acepta el consentimiento informado y autoriza el procedimiento.'

  const redesLabel = isPatient
    ? 'Autorizo la publicación de mis fotografías en redes sociales (Instagram, etc.).'
    : 'El paciente autoriza la publicación de sus fotografías en redes sociales (Instagram, etc.).'

  return (
    <div className="space-y-6">
      <div className="p-5 bg-surface rounded-xl border border-outline">
        <h3 className="text-base font-semibold text-on-surface font-outfit mb-3">
          Consentimiento informado
        </h3>
        <div className="bg-surface-dim rounded-xl p-4 mb-4 max-h-48 overflow-y-auto border border-outline-variant text-xs text-on-surface-variant leading-relaxed">
          <p className="mb-2">
            <strong>CONSENTIMIENTO INFORMADO PARA PROCEDIMIENTOS DE COSMETOLOGÍA</strong>
          </p>
          <p className="mb-2">
            {isPatient ? (
              <>
                Yo, el/la paciente identificado(a), declaro que he sido informado(a) de manera clara y
                comprensible sobre el procedimiento de cosmetología que se realizará, incluyendo
                sus beneficios, riesgos y posibles efectos secundarios.
              </>
            ) : (
              <>
                Yo, el/la paciente identificado(a), declaro que he sido informado(a) de manera clara y
                comprensible sobre el procedimiento de cosmetología que se realizará, incluyendo
                sus beneficios, riesgos y posibles efectos secundarios.
              </>
            )}
          </p>
          <p className="mb-2">
            Entiendo que los resultados pueden variar según las características individuales de mi
            piel y que el tratamiento no garantiza resultados específicos. He proporcionado
            información veraz sobre mi historial médico, alergias y medicamentos actuales.
          </p>
          <p className="mb-2">
            Autorizo al profesional a realizar el procedimiento acordado y a tomar fotografías con
            fines de seguimiento clínico. Comprendo que puedo revocar este consentimiento en
            cualquier momento.
          </p>
          <p className="mb-2">
            <strong>Autorización para redes sociales:</strong> Por separado del seguimiento clínico,
            autorizo (o no) la publicación de mis fotografías en redes sociales como Instagram,
            Facebook u otras plataformas con fines promocionales de la clínica. Esta autorización
            es independiente y puede revocarse en cualquier momento.
          </p>
          <p>
            Acepto las recomendaciones post-tratamiento y me comprometo a seguirlas para obtener
            mejores resultados.
          </p>
        </div>

        <label className={`flex items-start gap-3 mb-4 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={aceptaConsentimiento}
            disabled={readOnly}
            onChange={e => onAceptaConsentimientoChange(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-outline text-primary focus:ring-primary/20 cursor-pointer accent-primary disabled:cursor-default disabled:opacity-60"
          />
          <span className="text-sm text-on-surface font-medium">{consentLabel}</span>
        </label>

        <label className={`flex items-start gap-3 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={permiteFotosRedes}
            disabled={readOnly}
            onChange={e => onPermiteFotosRedesChange(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-outline text-primary focus:ring-primary/20 cursor-pointer accent-primary disabled:cursor-default disabled:opacity-60"
          />
          <span className="text-sm text-on-surface font-medium">{redesLabel}</span>
        </label>
      </div>

      <div className="p-5 bg-surface rounded-xl border border-outline">
        <SignaturePad
          value={firmaBase64}
          onChange={onFirmaChange}
          disabled={readOnly}
        />
      </div>
    </div>
  )
}
