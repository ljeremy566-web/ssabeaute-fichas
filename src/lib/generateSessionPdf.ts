import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface SessionPdfPatient {
  nombre_completo: string
  telefono?: string
  edad?: number
  biotipo_cutaneo?: string
}

interface SessionPdfSession {
  fecha_sesion: string
  procedimiento_realizado: string
  recomendaciones_hogar?: string
}

const COLORS = {
  brand: [124, 58, 237] as [number, number, number],
  brandLight: [243, 232, 255] as [number, number, number],
  ink: [10, 10, 10] as [number, number, number],
  muted: [115, 115, 115] as [number, number, number],
  border: [229, 229, 229] as [number, number, number],
  surface: [250, 250, 250] as [number, number, number],
}

const MARGIN = 18
const LINE_HEIGHT = 5.5
const FOOTER_RESERVE = 28

function addPageFooter(pdf: jsPDF, pageNum: number, totalPages: number) {
  const w = pdf.internal.pageSize.getWidth()
  const h = pdf.internal.pageSize.getHeight()
  const footerY = h - 14

  pdf.setDrawColor(...COLORS.border)
  pdf.setLineWidth(0.3)
  pdf.line(MARGIN, footerY - 5, w - MARGIN, footerY - 5)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(...COLORS.ink)
  pdf.text('SSABEAUTE · Dermatocosmetología', MARGIN, footerY)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.setTextColor(...COLORS.muted)
  pdf.text('Documento confidencial — uso exclusivo del paciente y profesional', MARGIN, footerY + 4)

  pdf.text(`Página ${pageNum} de ${totalPages}`, w - MARGIN, footerY, { align: 'right' })
}

function addSectionTitle(pdf: jsPDF, title: string, y: number): number {
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(...COLORS.ink)
  pdf.text(title.toUpperCase(), MARGIN, y)

  pdf.setDrawColor(...COLORS.brand)
  pdf.setLineWidth(0.8)
  pdf.line(MARGIN, y + 2, MARGIN + 32, y + 2)

  return y + 10
}

type PageContext = {
  pdf: jsPDF
  pageHeight: number
  contentWidth: number
  onNewPage: () => number
}

function drawTextBlock(
  ctx: PageContext,
  text: string,
  startY: number,
  style: { fill: [number, number, number]; border: [number, number, number]; text: [number, number, number] }
): number {
  const { pdf, pageHeight, contentWidth, onNewPage } = ctx
  const innerWidth = contentWidth - 10
  const lines = pdf.splitTextToSize(text, innerWidth)
  const blockHeight = Math.max(18, lines.length * LINE_HEIGHT + 10)

  let y = startY
  if (y + blockHeight > pageHeight - FOOTER_RESERVE) {
    y = onNewPage()
  }

  pdf.setFillColor(...style.fill)
  pdf.setDrawColor(...style.border)
  pdf.setLineWidth(0.25)
  pdf.roundedRect(MARGIN, y, contentWidth, blockHeight, 2, 2, 'FD')

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(...style.text)

  let textY = y + 8
  for (const line of lines) {
    pdf.text(line, MARGIN + 5, textY)
    textY += LINE_HEIGHT
  }

  return y + blockHeight + 8
}

export function generateSessionPdf(patient: SessionPdfPatient, session: SessionPdfSession): jsPDF {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - MARGIN * 2

  let pageNum = 1

  const onNewPage = () => {
    pdf.addPage()
    pageNum += 1
    return drawMinimalHeader(pdf, pageWidth) + 6
  }

  const ctx: PageContext = { pdf, pageHeight, contentWidth, onNewPage }

  let y = drawFullHeader(pdf, pageWidth, session)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.setTextColor(...COLORS.muted)
  pdf.text(
    `Generado: ${format(new Date(), "d MMM yyyy, HH:mm", { locale: es })}`,
    pageWidth - MARGIN,
    y - 2,
    { align: 'right' }
  )
  y += 4

  y = addSectionTitle(pdf, 'Información del paciente', y)
  y = drawPatientCard(pdf, patient, session, y, contentWidth)
  y += 4

  y = addSectionTitle(pdf, 'Procedimiento realizado', y)
  y = drawTextBlock(ctx, session.procedimiento_realizado, y, {
    fill: [255, 255, 255],
    border: COLORS.border,
    text: [40, 40, 40],
  })

  if (session.recomendaciones_hogar?.trim()) {
    if (y > pageHeight - 50) y = onNewPage()
    y = addSectionTitle(pdf, 'Recomendaciones para el hogar', y)
    y = drawTextBlock(ctx, session.recomendaciones_hogar, y, {
      fill: COLORS.brandLight,
      border: [216, 180, 254],
      text: [40, 40, 40],
    })
  }

  if (y > pageHeight - 40) y = onNewPage()

  pdf.setFillColor(...COLORS.surface)
  pdf.setDrawColor(...COLORS.border)
  pdf.roundedRect(MARGIN, y, contentWidth, 16, 2, 2, 'FD')
  pdf.setFont('helvetica', 'italic')
  pdf.setFontSize(8.5)
  pdf.setTextColor(...COLORS.muted)
  const note = 'Sigue las indicaciones de tu cosmetóloga. Ante cualquier reacción inusual, suspende el tratamiento y contáctanos de inmediato.'
  pdf.text(pdf.splitTextToSize(note, contentWidth - 10), MARGIN + 5, y + 7)

  const totalPages = pdf.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    addPageFooter(pdf, i, totalPages)
  }

  return pdf
}

function drawPatientCard(
  pdf: jsPDF,
  patient: SessionPdfPatient,
  session: SessionPdfSession,
  y: number,
  contentWidth: number
): number {
  const hasBiotipo = !!patient.biotipo_cutaneo
  const boxHeight = hasBiotipo ? 34 : 28

  pdf.setFillColor(...COLORS.surface)
  pdf.setDrawColor(...COLORS.border)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(MARGIN, y, contentWidth, boxHeight, 2, 2, 'FD')

  const label = (x: number, ly: number, t: string) => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    pdf.setTextColor(...COLORS.muted)
    pdf.text(t, x, ly)
  }
  const value = (x: number, vy: number, t: string, color = COLORS.ink) => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(...color)
    pdf.text(t, x, vy)
  }

  const x1 = MARGIN + 6
  const x2 = MARGIN + contentWidth * 0.38
  const x3 = MARGIN + contentWidth * 0.68
  const r1 = y + 10
  const r2 = y + 22

  label(x1, r1, 'PACIENTE')
  value(x1, r1 + 5, patient.nombre_completo)

  label(x2, r1, 'TELÉFONO')
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(...COLORS.ink)
  pdf.text(patient.telefono || '—', x2, r1 + 5)

  label(x3, r1, 'FECHA DE SESIÓN')
  value(x3, r1 + 5, format(new Date(session.fecha_sesion), "d MMM yyyy", { locale: es }), COLORS.brand)

  if (patient.edad) {
    label(x2, r2, 'EDAD')
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(...COLORS.ink)
    pdf.text(`${patient.edad} años`, x2, r2 + 5)
  }

  if (hasBiotipo) {
    label(x1, r2, 'BIOTIPO CUTÁNEO')
    pdf.setFillColor(...COLORS.brandLight)
    pdf.setDrawColor(...COLORS.brand)
    pdf.roundedRect(x1, r2 + 1, 30, 9, 1.5, 1.5, 'FD')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.setTextColor(...COLORS.brand)
    pdf.text(patient.biotipo_cutaneo!, x1 + 4, r2 + 7)
  }

  return y + boxHeight
}

function drawFullHeader(pdf: jsPDF, pageWidth: number, session: SessionPdfSession): number {
  pdf.setFillColor(...COLORS.brand)
  pdf.rect(0, 0, pageWidth, 36, 'F')

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  pdf.setTextColor(255, 255, 255)
  pdf.text('SSA', MARGIN, 16)
  pdf.setTextColor(216, 180, 254)
  pdf.text('BEAUTE', MARGIN + 14.5, 16)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.setTextColor(255, 255, 255)
  pdf.text('DERMATOCOSMETOLOGÍA', MARGIN, 22)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.text('Informe de sesión', pageWidth - MARGIN, 14, { align: 'right' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(237, 233, 254)
  pdf.text(
    format(new Date(session.fecha_sesion), "EEEE d 'de' MMMM yyyy", { locale: es }),
    pageWidth - MARGIN,
    21,
    { align: 'right' }
  )

  return 44
}

function drawMinimalHeader(pdf: jsPDF, pageWidth: number): number {
  pdf.setFillColor(...COLORS.brand)
  pdf.rect(0, 0, pageWidth, 14, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('SSABEAUTE', MARGIN, 9)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text('Informe de sesión', pageWidth - MARGIN, 9, { align: 'right' })
  return 18
}

export function downloadSessionPdf(patient: SessionPdfPatient, session: SessionPdfSession) {
  const pdf = generateSessionPdf(patient, session)
  const dateStr = format(new Date(session.fecha_sesion), 'dd-MM-yyyy')
  const fileName = `SSABEAUTE_Sesion_${patient.nombre_completo.replace(/\s+/g, '_')}_${dateStr}.pdf`
  pdf.save(fileName)
}
