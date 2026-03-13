import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { formatCode } from './format'

export interface QrCardDefinition {
  code: string
  scanValue: string
}

export type QrPdfLayoutMode = 'cardsPerPage' | 'qrSize'
type PageOrientation = 'portrait' | 'landscape'

interface PageFormat {
  widthMm: number
  heightMm: number
  orientation: PageOrientation
}

interface ResolvedQrPdfLayout {
  pageFormat: PageFormat
  columns: number
  rows: number
  cardsPerPage: number
  cardWidthMm: number
  cardHeightMm: number
  qrSizeMm: number
  startXmm: number
  startYmm: number
  gapXmm: number
  gapYmm: number
}

export interface QrPdfExportOptions {
  mode: QrPdfLayoutMode
  cardsPerPage?: number
  qrSizeMm?: number
  fileName?: string
}

export interface QrPdfLayoutPreview {
  orientation: PageOrientation
  columns: number
  rows: number
  cardsPerPage: number
  qrSizeMm: number
  pageCount: number
}

const QR_PREFIX = 'mbz:generator:'
const A4_FORMATS: PageFormat[] = [
  { widthMm: 210, heightMm: 297, orientation: 'portrait' },
  { widthMm: 297, heightMm: 210, orientation: 'landscape' },
]
const OUTER_MARGIN_MM = 10
const BASE_GAP_MM = 4
const CARD_PADDING_MM = 4
const CARD_HEADER_MM = 12
const CARD_FOOTER_MM = 10
const MIN_QR_SIZE_MM = 18
const MAX_QR_SIZE_MM = 120

export function buildGeneratorQrValue(code: string) {
  const normalizedCode = formatCode(code)
  return normalizedCode ? `${QR_PREFIX}${normalizedCode}` : ''
}

export async function generateQrDataUrl(value: string) {
  return QRCode.toDataURL(value, {
    margin: 1,
    width: 512,
    color: {
      dark: '#241C13',
      light: '#F8F2E7',
    },
  })
}

export function extractGeneratorCodeFromQrValue(value: string, origin = window.location.origin) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return ''
  }

  if (trimmedValue.startsWith(QR_PREFIX)) {
    return formatCode(trimmedValue.slice(QR_PREFIX.length))
  }

  try {
    const url = new URL(trimmedValue, origin)
    const pathSegments = url.pathname.split('/').filter(Boolean)

    if (pathSegments[0] === 'register' && pathSegments[1]) {
      return formatCode(decodeURIComponent(pathSegments[1]))
    }

    if (pathSegments[0] === 'admin' && pathSegments[1] === 'generator' && pathSegments[2]) {
      return formatCode(decodeURIComponent(pathSegments[2]))
    }
  } catch {
    return formatCode(trimmedValue)
  }

  return formatCode(trimmedValue)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getInnerSize(pageFormat: PageFormat) {
  return {
    widthMm: pageFormat.widthMm - OUTER_MARGIN_MM * 2,
    heightMm: pageFormat.heightMm - OUTER_MARGIN_MM * 2,
  }
}

function resolveLayoutByCardsPerPage(pageFormat: PageFormat, requestedCardsPerPage: number) {
  const inner = getInnerSize(pageFormat)
  let best: (ResolvedQrPdfLayout & { score: number }) | null = null

  for (let columns = 1; columns <= requestedCardsPerPage; columns += 1) {
    for (let rows = 1; rows <= requestedCardsPerPage; rows += 1) {
      const cardsPerPage = columns * rows

      if (cardsPerPage > requestedCardsPerPage) {
        continue
      }

      const cardWidthMm = (inner.widthMm - BASE_GAP_MM * (columns - 1)) / columns
      const cardHeightMm = (inner.heightMm - BASE_GAP_MM * (rows - 1)) / rows
      const qrSizeMm = Math.min(
        cardWidthMm - CARD_PADDING_MM * 2,
        cardHeightMm - CARD_HEADER_MM - CARD_FOOTER_MM - CARD_PADDING_MM * 2,
      )

      if (qrSizeMm < MIN_QR_SIZE_MM) {
        continue
      }

      const fillRatio = cardsPerPage / requestedCardsPerPage
      const balancePenalty = Math.abs(columns - rows)
      const score = qrSizeMm * 10 + fillRatio * 40 - balancePenalty

      if (!best || score > best.score) {
        best = {
          pageFormat,
          columns,
          rows,
          cardsPerPage,
          cardWidthMm,
          cardHeightMm,
          qrSizeMm,
          startXmm: OUTER_MARGIN_MM,
          startYmm: OUTER_MARGIN_MM,
          gapXmm: BASE_GAP_MM,
          gapYmm: BASE_GAP_MM,
          score,
        }
      }
    }
  }

  return best
}

function resolveLayoutByQrSize(pageFormat: PageFormat, requestedQrSizeMm: number) {
  const inner = getInnerSize(pageFormat)
  const qrSizeMm = clamp(requestedQrSizeMm, MIN_QR_SIZE_MM, MAX_QR_SIZE_MM)
  const cardWidthMm = qrSizeMm + CARD_PADDING_MM * 2
  const cardHeightMm = qrSizeMm + CARD_HEADER_MM + CARD_FOOTER_MM + CARD_PADDING_MM * 2
  const columns = Math.floor((inner.widthMm + BASE_GAP_MM) / (cardWidthMm + BASE_GAP_MM))
  const rows = Math.floor((inner.heightMm + BASE_GAP_MM) / (cardHeightMm + BASE_GAP_MM))

  if (columns < 1 || rows < 1) {
    return null
  }

  const cardsPerPage = columns * rows
  const occupiedWidthMm = columns * cardWidthMm + BASE_GAP_MM * (columns - 1)
  const occupiedHeightMm = rows * cardHeightMm + BASE_GAP_MM * (rows - 1)

  return {
    pageFormat,
    columns,
    rows,
    cardsPerPage,
    cardWidthMm,
    cardHeightMm,
    qrSizeMm,
    startXmm: OUTER_MARGIN_MM + (inner.widthMm - occupiedWidthMm) / 2,
    startYmm: OUTER_MARGIN_MM + (inner.heightMm - occupiedHeightMm) / 2,
    gapXmm: BASE_GAP_MM,
    gapYmm: BASE_GAP_MM,
  } satisfies ResolvedQrPdfLayout
}

function resolveQrPdfLayout(totalCards: number, options: QrPdfExportOptions) {
  const safeTotalCards = Math.max(totalCards, 1)

  if (options.mode === 'qrSize') {
    const requestedQrSizeMm = clamp(options.qrSizeMm ?? 42, MIN_QR_SIZE_MM, MAX_QR_SIZE_MM)
    const candidates = A4_FORMATS.map((pageFormat) => resolveLayoutByQrSize(pageFormat, requestedQrSizeMm))
      .filter((candidate): candidate is ResolvedQrPdfLayout => candidate !== null)
      .sort((left, right) => {
        if (right.cardsPerPage !== left.cardsPerPage) {
          return right.cardsPerPage - left.cardsPerPage
        }

        return right.qrSizeMm - left.qrSizeMm
      })

    const best = candidates[0]

    if (!best) {
      throw new Error('Die gewählte QR-Größe passt nicht auf eine A4-Seite.')
    }

    return best
  }

  const requestedCardsPerPage = clamp(
    Math.round(options.cardsPerPage ?? 12),
    1,
    Math.max(safeTotalCards, 1),
  )
  const candidates = A4_FORMATS.map((pageFormat) =>
    resolveLayoutByCardsPerPage(pageFormat, requestedCardsPerPage),
  )
    .filter((candidate): candidate is ResolvedQrPdfLayout & { score: number } => candidate !== null)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      if (right.cardsPerPage !== left.cardsPerPage) {
        return right.cardsPerPage - left.cardsPerPage
      }

      return right.qrSizeMm - left.qrSizeMm
    })

  const best = candidates[0]

  if (!best) {
    throw new Error('Für diese Seitenanzahl konnte kein passendes A4-Layout berechnet werden.')
  }

  return best
}

export function getQrPdfLayoutPreview(totalCards: number, options: QrPdfExportOptions): QrPdfLayoutPreview {
  const layout = resolveQrPdfLayout(totalCards, options)

  return {
    orientation: layout.pageFormat.orientation,
    columns: layout.columns,
    rows: layout.rows,
    cardsPerPage: layout.cardsPerPage,
    qrSizeMm: Number(layout.qrSizeMm.toFixed(1)),
    pageCount: Math.ceil(Math.max(totalCards, 1) / layout.cardsPerPage),
  }
}

function getExportFileName(prefix: string, explicitFileName?: string) {
  if (explicitFileName?.trim()) {
    return explicitFileName.trim()
  }

  const dateStamp = new Date().toISOString().slice(0, 10)
  const normalizedPrefix = formatCode(prefix) || 'qr-export'
  return `${normalizedPrefix}-${dateStamp}.pdf`
}

function drawCard(
  doc: jsPDF,
  card: QrCardDefinition,
  qrDataUrl: string,
  layout: ResolvedQrPdfLayout,
  column: number,
  row: number,
) {
  const x = layout.startXmm + column * (layout.cardWidthMm + layout.gapXmm)
  const y = layout.startYmm + row * (layout.cardHeightMm + layout.gapYmm)

  doc.setDrawColor('#796542')
  doc.setFillColor('#fffaf1')
  doc.roundedRect(x, y, layout.cardWidthMm, layout.cardHeightMm, 3, 3, 'FD')

  doc.setTextColor('#241c13')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(card.code, x + layout.cardWidthMm / 2, y + 7, { align: 'center' })

  const qrX = x + (layout.cardWidthMm - layout.qrSizeMm) / 2
  const qrY = y + CARD_HEADER_MM
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, layout.qrSizeMm, layout.qrSizeMm)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('App-QR-Code', x + layout.cardWidthMm / 2, qrY + layout.qrSizeMm + 5, {
    align: 'center',
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.text('Scannen in der App', x + layout.cardWidthMm / 2, y + layout.cardHeightMm - 4, {
    align: 'center',
  })
}

export async function downloadQrPdf(cards: QrCardDefinition[], options: QrPdfExportOptions) {
  if (!cards.length) {
    throw new Error('Es sind keine QR-Codes zum Export vorhanden.')
  }

  const layout = resolveQrPdfLayout(cards.length, options)
  const doc = new jsPDF({
    orientation: layout.pageFormat.orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const qrDataUrls = await Promise.all(cards.map((card) => generateQrDataUrl(card.scanValue)))

  cards.forEach((card, index) => {
    const pageIndex = Math.floor(index / layout.cardsPerPage)
    const indexOnPage = index % layout.cardsPerPage
    const row = Math.floor(indexOnPage / layout.columns)
    const column = indexOnPage % layout.columns

    if (pageIndex > 0 && indexOnPage === 0) {
      doc.addPage('a4', layout.pageFormat.orientation)
    }

    drawCard(doc, card, qrDataUrls[index], layout, column, row)
  })

  doc.save(getExportFileName(cards[0]?.code.split('-').slice(0, -1).join('-') || 'qr-export', options.fileName))
}
