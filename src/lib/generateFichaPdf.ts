import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CLINIC_OWNER } from './clinicConfig'
import { normalizeImageForPdf } from './imageUtils'
import { parseLocalDate } from './dateUtils'
import { buildWhatsAppUrl, formatArgentinaPhoneDisplay } from './phoneUtils'

/* ─── Types ─── */

interface FichaPdfPatient {
  nombre_completo: string
  telefono?: string
  correo?: string
  edad?: number
  fecha_nacimiento?: string
}

interface FichaPdfData {
  fecha_servicio: string
  motivo_consulta?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  datos_medicos?: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cuidados_faciales?: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evaluacion_profesional?: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tratamientos_realizados?: Record<string, any>
  ruta_mapa_facial?: string | null
  ruta_foto_antes?: string | null
  ruta_foto_despues?: string | null
  ruta_firma?: string | null
}

/* ─── Constants ─── */

const COLORS = {
  primary: [147, 115, 158] as [number, number, number],
  primaryLight: [240, 235, 241] as [number, number, number],
  surface: [255, 255, 255] as [number, number, number],
  surfaceDim: [249, 248, 250] as [number, number, number],
  onSurface: [45, 35, 49] as [number, number, number],
  onSurfaceVariant: [74, 59, 80] as [number, number, number],
  outline: [229, 223, 232] as [number, number, number],
  success: [74, 123, 98] as [number, number, number],
}

const MARGIN = 18
const LINE_HEIGHT = 6
const SECTION_GAP = 8
const FIELD_GAP = 5
const BODY_SIZE = 9
const LABEL_SIZE = 7
const FOOTER_RESERVE = 22
const SIG_COL_GAP = 8
const SIG_FRAME_H = 38
const SIG_IMG_H = 24

let professionalSignatureDataUrl: string | null = null

async function getProfessionalSignatureDataUrl(): Promise<string | null> {
  if (professionalSignatureDataUrl) return professionalSignatureDataUrl
  try {
    professionalSignatureDataUrl = await normalizeImageForPdf(CLINIC_OWNER.signatureSrc, {
      whiteBackground: true,
      maxWidth: 800,
    })
  } catch {
    professionalSignatureDataUrl = null
  }
  return professionalSignatureDataUrl
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function resolveImageSrc(src: string): Promise<string | null> {
  if (src.startsWith('data:')) return src
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const resp = await fetch(src, { mode: 'cors', signal: controller.signal })
    clearTimeout(timeout)
    if (!resp.ok) return null
    return blobToDataUrl(await resp.blob())
  } catch {
    return null
  }
}

async function resolveFichaImages(ficha: FichaPdfData): Promise<FichaPdfData> {
  const [mapaRaw, antesRaw, despuesRaw, firmaRaw] = await Promise.all([
    ficha.ruta_mapa_facial ? resolveImageSrc(ficha.ruta_mapa_facial) : Promise.resolve(null),
    ficha.ruta_foto_antes ? resolveImageSrc(ficha.ruta_foto_antes) : Promise.resolve(null),
    ficha.ruta_foto_despues ? resolveImageSrc(ficha.ruta_foto_despues) : Promise.resolve(null),
    ficha.ruta_firma ? resolveImageSrc(ficha.ruta_firma) : Promise.resolve(null),
  ])

  const normalizeForPdf = async (
    src: string | null,
    options: { whiteBackground?: boolean; preserveAlpha?: boolean },
  ): Promise<string | null> => {
    if (!src) return null
    try {
      return await normalizeImageForPdf(src, { maxWidth: 1200, ...options })
    } catch {
      return src
    }
  }

  const [mapa, antes, despues, firma] = await Promise.all([
    normalizeForPdf(mapaRaw, { preserveAlpha: true }),
    normalizeForPdf(antesRaw, { whiteBackground: true }),
    normalizeForPdf(despuesRaw, { whiteBackground: true }),
    normalizeForPdf(firmaRaw, { whiteBackground: true }),
  ])

  return {
    ...ficha,
    ruta_mapa_facial: mapa,
    ruta_foto_antes: antes,
    ruta_foto_despues: despues,
    ruta_firma: firma,
  }
}

function detectImageFormat(src: string): 'PNG' | 'JPEG' {
  if (src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')) return 'JPEG'
  return 'PNG'
}

/* ─── Helpers ─── */

function addPageFooter(pdf: jsPDF, pageNum: number, totalPages: number) {
  const w = pdf.internal.pageSize.getWidth()
  const h = pdf.internal.pageSize.getHeight()
  const fy = h - 12

  pdf.setDrawColor(...COLORS.outline)
  pdf.setLineWidth(0.3)
  pdf.line(MARGIN, fy - 4, w - MARGIN, fy - 4)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(...COLORS.onSurface)
  pdf.text('SSABEAUTE · Cosmetología', MARGIN, fy)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(...COLORS.onSurfaceVariant)
  pdf.text('Documento confidencial', MARGIN, fy + 3.5)
  pdf.text(`${pageNum} / ${totalPages}`, w - MARGIN, fy, { align: 'right' })
}

function drawHeader(pdf: jsPDF, w: number, ficha: FichaPdfData): number {
  pdf.setFillColor(...COLORS.primary)
  pdf.rect(0, 0, w, 32, 'F')

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.setTextColor(255, 255, 255)
  pdf.text('SSABEAUTE', MARGIN, 15)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(230, 220, 240)
  pdf.text('FICHA CLÍNICA DE COSMETOLOGÍA', MARGIN, 21)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(255, 255, 255)
  pdf.text(format(parseLocalDate(ficha.fecha_servicio), "d 'de' MMMM, yyyy", { locale: es }), w - MARGIN, 15, { align: 'right' })

  return 40
}

function drawMiniHeader(pdf: jsPDF, w: number): number {
  pdf.setFillColor(...COLORS.primary)
  pdf.rect(0, 0, w, 12, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(255, 255, 255)
  pdf.text('SSABEAUTE', MARGIN, 8)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.text('Ficha Clínica', w - MARGIN, 8, { align: 'right' })
  return 18
}

function sectionTitle(pdf: jsPDF, title: string, y: number): number {
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(...COLORS.onSurface)
  pdf.text(title.toUpperCase(), MARGIN, y)
  pdf.setDrawColor(...COLORS.primary)
  pdf.setLineWidth(0.8)
  pdf.line(MARGIN, y + 2, MARGIN + 30, y + 2)
  return y + 9
}

function writeWrappedText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize = BODY_SIZE,
  lineHeight = LINE_HEIGHT,
): number {
  pdf.setFontSize(fontSize)
  const lines = pdf.splitTextToSize(text, maxWidth)
  pdf.text(lines, x, y)
  return y + lines.length * lineHeight
}

function labelValue(
  pdf: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
): number {
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(LABEL_SIZE)
  pdf.setTextColor(...COLORS.onSurfaceVariant)
  pdf.text(label.toUpperCase(), x, y)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(...COLORS.onSurface)
  const lines = pdf.splitTextToSize(value || '—', maxWidth)
  pdf.text(lines, x, y + FIELD_GAP)
  return y + FIELD_GAP + lines.length * LINE_HEIGHT + 2
}

function chipsList(pdf: jsPDF, items: string[], x: number, y: number, contentWidth: number): number {
  if (!items.length) {
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(BODY_SIZE)
    pdf.setTextColor(...COLORS.onSurfaceVariant)
    pdf.text('Ninguno seleccionado', x, y)
    return y + LINE_HEIGHT + 2
  }

  return writeWrappedText(pdf, items.join(' · '), x, y, contentWidth, BODY_SIZE, LINE_HEIGHT) + 2
}

function writeItalicDetail(pdf: jsPDF, text: string, x: number, y: number, maxWidth: number): number {
  if (!text) return y
  pdf.setFont('helvetica', 'italic')
  pdf.setFontSize(8)
  pdf.setTextColor(...COLORS.onSurfaceVariant)
  return writeWrappedText(pdf, text, x, y, maxWidth, 8, 4.5) + FIELD_GAP
}

function drawSignatureBlock(
  pdf: jsPDF,
  imageSrc: string | null | undefined,
  x: number,
  y: number,
  colWidth: number,
  caption: string,
): number {
  pdf.setFillColor(...COLORS.surfaceDim)
  pdf.setDrawColor(...COLORS.outline)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(x, y, colWidth, SIG_FRAME_H, 2, 2, 'FD')

  if (imageSrc) {
    try {
      const imgPad = 3
      const imgW = colWidth - imgPad * 2
      pdf.addImage(imageSrc, 'PNG', x + imgPad, y + imgPad, imgW, SIG_IMG_H)
    } catch {
      // skip broken image
    }
  }

  const lineY = y + SIG_FRAME_H - 10
  pdf.setDrawColor(...COLORS.outline)
  pdf.line(x + 4, lineY, x + colWidth - 4, lineY)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(...COLORS.onSurfaceVariant)
  const captionLines = pdf.splitTextToSize(caption.replace(/\n/g, ' · '), colWidth - 8)
  pdf.text(captionLines, x + 4, lineY + 4)

  return y + SIG_FRAME_H + SECTION_GAP
}

type Ctx = {
  pdf: jsPDF
  w: number
  h: number
  cw: number
  newPage: () => number
}

function ensureSpace(ctx: Ctx, needed: number, currentY: number): number {
  if (currentY + needed > ctx.h - FOOTER_RESERVE) return ctx.newPage()
  return currentY
}

function drawPatientInfoCard(
  pdf: jsPDF,
  patient: FichaPdfPatient,
  y: number,
  cw: number,
): number {
  const colW = cw / 3 - 4
  const x1 = MARGIN + 6
  const x2 = MARGIN + cw / 3 + 2
  const x3 = MARGIN + (cw * 2) / 3 + 2

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  const nameLines = pdf.splitTextToSize(patient.nombre_completo || '—', colW)
  const cardH = Math.max(22, 8 + nameLines.length * LINE_HEIGHT + 6)

  pdf.setFillColor(...COLORS.surfaceDim)
  pdf.setDrawColor(...COLORS.outline)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(MARGIN, y, cw, cardH, 2, 2, 'FD')

  labelValue(pdf, 'Paciente', patient.nombre_completo, x1, y + 5, colW)
  labelValue(pdf, 'Teléfono', patient.telefono ? formatArgentinaPhoneDisplay(patient.telefono) : '—', x2, y + 5, colW)
  if (patient.edad) {
    labelValue(pdf, 'Edad', `${patient.edad} años`, x3, y + 5, colW)
  }

  return y + cardH + SECTION_GAP
}

/* ─── Main Export ─── */

export function generateFichaPdf(
  patient: FichaPdfPatient,
  ficha: FichaPdfData,
  professionalSignatureSrc?: string | null,
): jsPDF {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const w = pdf.internal.pageSize.getWidth()
  const h = pdf.internal.pageSize.getHeight()
  const cw = w - MARGIN * 2

  const newPage = () => { pdf.addPage(); return drawMiniHeader(pdf, w) + 4 }
  const ctx: Ctx = { pdf, w, h, cw, newPage }

  let y = drawHeader(pdf, w, ficha)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(...COLORS.onSurfaceVariant)
  pdf.text(`Generado: ${format(new Date(), "d MMM yyyy, HH:mm", { locale: es })}`, w - MARGIN, y - 3, { align: 'right' })

  y = sectionTitle(pdf, 'Información del paciente', y)
  y = drawPatientInfoCard(pdf, patient, y, cw)

  if (ficha.motivo_consulta) {
    y = ensureSpace(ctx, 20, y)
    y = sectionTitle(pdf, 'Motivo de consulta', y)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(...COLORS.onSurface)
    y = writeWrappedText(pdf, ficha.motivo_consulta, MARGIN, y, cw, 10, LINE_HEIGHT) + SECTION_GAP
  }

  const dm = ficha.datos_medicos || {}
  y = ensureSpace(ctx, 40, y)
  y = sectionTitle(pdf, 'Anamnesis', y)

  if (dm.alergias?.length) {
    y = labelValue(pdf, 'Alergias', '', MARGIN, y, cw) - FIELD_GAP - 2
    y += FIELD_GAP
    y = chipsList(pdf, dm.alergias, MARGIN, y, cw)
    y = writeItalicDetail(pdf, dm.alergias_detalle, MARGIN, y, cw)
  }

  if (dm.medicamentos?.length) {
    y = ensureSpace(ctx, 18, y)
    y = labelValue(pdf, 'Medicamentos', '', MARGIN, y, cw) - FIELD_GAP - 2
    y += FIELD_GAP
    y = chipsList(pdf, dm.medicamentos, MARGIN, y, cw)
    y = writeItalicDetail(pdf, dm.medicamentos_detalle, MARGIN, y, cw)
  }

  if (dm.enfermedades?.length) {
    y = ensureSpace(ctx, 18, y)
    y = labelValue(pdf, 'Enfermedades', '', MARGIN, y, cw) - FIELD_GAP - 2
    y += FIELD_GAP
    y = chipsList(pdf, dm.enfermedades, MARGIN, y, cw)
    y = writeItalicDetail(pdf, dm.enfermedades_detalle, MARGIN, y, cw)
  }

  if (dm.embarazo) {
    y = ensureSpace(ctx, 14, y)
    y = labelValue(pdf, 'Embarazo', dm.embarazo, MARGIN, y, cw / 2) + FIELD_GAP
  }

  if (dm.consumo_agua || dm.horas_sueno || dm.nivel_estres) {
    y = ensureSpace(ctx, 20, y)
    const habColW = cw / 3 - 4
    const habX1 = MARGIN
    const habX2 = MARGIN + cw / 3
    const habX3 = MARGIN + (cw * 2) / 3
    const startY = y
    let endY = startY

    if (dm.consumo_agua) endY = Math.max(endY, labelValue(pdf, 'Agua', dm.consumo_agua, habX1, startY, habColW))
    if (dm.horas_sueno) endY = Math.max(endY, labelValue(pdf, 'Sueño', dm.horas_sueno, habX2, startY, habColW))
    if (dm.nivel_estres) endY = Math.max(endY, labelValue(pdf, 'Estrés', dm.nivel_estres, habX3, startY, habColW))

    y = endY + SECTION_GAP
  }

  const cf = ficha.cuidados_faciales || {}
  if (cf.rutina_facial?.length) {
    y = ensureSpace(ctx, 22, y)
    y = sectionTitle(pdf, 'Rutina facial', y)
    y = chipsList(pdf, cf.rutina_facial, MARGIN, y, cw)
    y = writeItalicDetail(pdf, cf.rutina_detalle, MARGIN, y, cw)
  }

  const ep = ficha.evaluacion_profesional || {}
  if (ep.biotipo || ep.tipo_piel || ep.estado_piel?.length) {
    y = ensureSpace(ctx, 30, y)
    y = sectionTitle(pdf, 'Evaluación profesional', y)

    if (ep.biotipo) {
      y = labelValue(pdf, 'Fototipo', `Tipo ${ep.biotipo}`, MARGIN, y, cw / 2) + FIELD_GAP
    }
    if (ep.tipo_piel) {
      y = labelValue(pdf, 'Tipo de piel', ep.tipo_piel, MARGIN, y, cw / 2) + FIELD_GAP
    }
    if (ep.estado_piel?.length) {
      y = ensureSpace(ctx, 16, y)
      y = labelValue(pdf, 'Estado actual', '', MARGIN, y, cw) - FIELD_GAP - 2
      y += FIELD_GAP
      y = chipsList(pdf, ep.estado_piel, MARGIN, y, cw)
    }
    y = writeItalicDetail(pdf, ep.estado_piel_notas, MARGIN, y, cw)
  }

  const hasImages = ficha.ruta_mapa_facial || ficha.ruta_foto_antes || ficha.ruta_foto_despues
  if (hasImages) {
    y = newPage()
    y = sectionTitle(pdf, 'Evidencia visual', y)

    const addImage = (src: string, label: string, imgW: number, imgH: number) => {
      y = ensureSpace(ctx, imgH + 14, y)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.setTextColor(...COLORS.onSurfaceVariant)
      pdf.text(label.toUpperCase(), MARGIN, y)
      y += 4
      try {
        pdf.addImage(src, detectImageFormat(src), MARGIN, y, imgW, imgH)
        y += imgH + SECTION_GAP
      } catch {
        pdf.setFont('helvetica', 'italic')
        pdf.setFontSize(8)
        pdf.setTextColor(...COLORS.onSurfaceVariant)
        pdf.text('[Imagen no disponible]', MARGIN, y + 5)
        y += 14
      }
    }

    if (ficha.ruta_mapa_facial) addImage(ficha.ruta_mapa_facial, 'Mapa Facial', cw * 0.6, cw * 0.75)
    if (ficha.ruta_foto_antes) addImage(ficha.ruta_foto_antes, 'Foto Antes', cw * 0.45, cw * 0.45)
    if (ficha.ruta_foto_despues) addImage(ficha.ruta_foto_despues, 'Foto Después', cw * 0.45, cw * 0.45)
  }

  const tr = ficha.tratamientos_realizados || {}
  if (tr.acepta_consentimiento !== undefined || tr.permite_fotos_redes !== undefined) {
    y = ensureSpace(ctx, 22, y)
    y = sectionTitle(pdf, 'Consentimiento', y)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(BODY_SIZE)
    pdf.setTextColor(...COLORS.onSurface)

    if (tr.acepta_consentimiento !== undefined) {
      y = writeWrappedText(
        pdf,
        `Consentimiento informado: ${tr.acepta_consentimiento ? 'Aceptado' : 'No aceptado'}`,
        MARGIN,
        y,
        cw,
        BODY_SIZE,
        LINE_HEIGHT,
      ) + 2
    }
    if (tr.permite_fotos_redes !== undefined) {
      y = writeWrappedText(
        pdf,
        `Autorización redes sociales: ${tr.permite_fotos_redes ? 'Sí' : 'No'}`,
        MARGIN,
        y,
        cw,
        BODY_SIZE,
        LINE_HEIGHT,
      ) + SECTION_GAP
    }
  }

  if (tr.tratamientos?.length) {
    y = ensureSpace(ctx, 25, y)
    y = sectionTitle(pdf, 'Tratamientos realizados', y)
    y = chipsList(pdf, tr.tratamientos, MARGIN, y, cw)
    y = writeItalicDetail(pdf, tr.tratamientos_notas, MARGIN, y, cw)
  }

  if (ficha.ruta_firma || professionalSignatureSrc) {
    y = ensureSpace(ctx, SIG_FRAME_H + 20, y)
    y = sectionTitle(pdf, 'Firmas', y)

    const colWidth = (cw - SIG_COL_GAP) / 2
    const leftX = MARGIN
    const rightX = MARGIN + colWidth + SIG_COL_GAP
    const sigStartY = y

    let leftEnd = sigStartY
    let rightEnd = sigStartY

    if (ficha.ruta_firma) {
      leftEnd = drawSignatureBlock(pdf, ficha.ruta_firma, leftX, sigStartY, colWidth, 'Firma del paciente')
    }

    if (professionalSignatureSrc) {
      rightEnd = drawSignatureBlock(
        pdf,
        professionalSignatureSrc,
        rightX,
        sigStartY,
        colWidth,
        `${CLINIC_OWNER.role}\n${CLINIC_OWNER.name}`,
      )
    }

    y = Math.max(leftEnd, rightEnd)
  }

  y = ensureSpace(ctx, 22, y)
  const noteText = 'Siga las indicaciones de su cosmetóloga. Ante cualquier reacción inusual, suspenda el tratamiento y contáctenos.'
  pdf.setFont('helvetica', 'italic')
  pdf.setFontSize(8)
  const noteLines = pdf.splitTextToSize(noteText, cw - 10)
  const noteH = Math.max(14, noteLines.length * 4.5 + 8)

  pdf.setFillColor(...COLORS.primaryLight)
  pdf.setDrawColor(...COLORS.outline)
  pdf.roundedRect(MARGIN, y, cw, noteH, 2, 2, 'FD')
  pdf.setTextColor(...COLORS.onSurfaceVariant)
  pdf.text(noteLines, MARGIN + 5, y + 6)

  const total = pdf.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i)
    addPageFooter(pdf, i, total)
  }

  return pdf
}

export async function downloadFichaPdf(patient: FichaPdfPatient, ficha: FichaPdfData) {
  const resolved = await resolveFichaImages(ficha)
  const professionalSignature = await getProfessionalSignatureDataUrl()
  const pdf = generateFichaPdf(patient, resolved, professionalSignature)
  const dateStr = format(parseLocalDate(ficha.fecha_servicio), 'dd-MM-yyyy')
  const name = patient.nombre_completo.replace(/\s+/g, '_')
  pdf.save(`SSABEAUTE_Ficha_${name}_${dateStr}.pdf`)
}

export function shareViaWhatsApp(phone: string, patientName: string, fechaServicio?: string) {
  const datePart = fechaServicio
    ? ` de tu consulta del ${format(parseLocalDate(fechaServicio), "d 'de' MMMM yyyy", { locale: es })}`
    : ''
  const msg =
    `¡Hola ${patientName}! Te compartimos el resumen${datePart} en SSABEAUTE. La cosmetóloga te enviará el PDF de tu ficha por este medio. Si tienes alguna duda sobre las recomendaciones, escríbenos. ¡Gracias por tu confianza!`
  const url = buildWhatsAppUrl(phone, msg)
  if (!url) throw new Error('Teléfono argentino inválido para WhatsApp')
  window.open(url, '_blank', 'noopener,noreferrer')
}
