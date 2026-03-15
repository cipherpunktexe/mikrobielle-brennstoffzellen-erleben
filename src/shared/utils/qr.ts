import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { formatCode } from './format'

export interface QrCardDefinition {
  code: string
  scanValue: string
}

export type QrPdfLayoutMode = 'cardsPerPage' | 'qrSize'
export type QrPdfPageSize = 'auto' | 'a4' | 'a5' | 'a6' | 'qr'
type PageOrientation = 'portrait' | 'landscape'
type StaticQrPdfPageSize = Exclude<QrPdfPageSize, 'auto' | 'qr'>

interface PageFormat {
  size: Exclude<QrPdfPageSize, 'auto'>
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
  pageSize?: QrPdfPageSize
  fileName?: string
}

export interface QrPdfLayoutPreview {
  pageSize: Exclude<QrPdfPageSize, 'auto'>
  orientation: PageOrientation
  columns: number
  rows: number
  cardsPerPage: number
  qrSizeMm: number
  pageCount: number
  pageWidthMm: number
  pageHeightMm: number
  cardWidthMm: number
  cardHeightMm: number
  startXmm: number
  startYmm: number
  gapXmm: number
  gapYmm: number
}

const QR_PREFIX = 'mbz:generator:'
const PAGE_FORMATS: Record<StaticQrPdfPageSize, PageFormat[]> = {
  a4: [
    { size: 'a4', widthMm: 210, heightMm: 297, orientation: 'portrait' },
    { size: 'a4', widthMm: 297, heightMm: 210, orientation: 'landscape' },
  ],
  a5: [
    { size: 'a5', widthMm: 148, heightMm: 210, orientation: 'portrait' },
    { size: 'a5', widthMm: 210, heightMm: 148, orientation: 'landscape' },
  ],
  a6: [
    { size: 'a6', widthMm: 105, heightMm: 148, orientation: 'portrait' },
    { size: 'a6', widthMm: 148, heightMm: 105, orientation: 'landscape' },
  ],
}
const OUTER_MARGIN_MM = 10
const BASE_GAP_MM = 4
const CARD_PADDING_MM = 0
const CARD_HEADER_MM = 0
const CARD_FOOTER_MM = 0
const MIN_QR_SIZE_MM = 18
const MAX_QR_SIZE_MM = 120
const QR_CANVAS_SIZE = 720
const QR_QUIET_ZONE_MODULES = 4

function hashToThreeDigitHex(input: string) {
  let hash = 0

  for (const character of input) {
    hash = (hash * 31 + character.charCodeAt(0)) & 0xfff
  }

  return hash.toString(16).toUpperCase().padStart(3, '0')
}

export function getQrBadgeHex(code: string) {
  return hashToThreeDigitHex(formatCode(code) || code.trim() || '000')
}

export function buildGeneratorQrValue(code: string) {
  const normalizedCode = formatCode(code)

  if (!normalizedCode) {
    return ''
  }

  return new URL(`/register/${encodeURIComponent(normalizedCode)}`, window.location.origin).toString()
}

export async function generateQrDataUrl(value: string) {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: 'H',
    margin: QR_QUIET_ZONE_MODULES,
    width: QR_CANVAS_SIZE,
    color: {
      dark: '#000000',
      light: '#0000',
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

function getCandidatePageFormats(pageSize: QrPdfPageSize) {
  if (pageSize === 'auto') {
    return Object.values(PAGE_FORMATS).flat()
  }

  if (pageSize === 'qr') {
    return []
  }

  return PAGE_FORMATS[pageSize]
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

function resolveQrOnlyPageLayout(requestedQrSizeMm: number) {
  const qrSizeMm = clamp(requestedQrSizeMm, MIN_QR_SIZE_MM, MAX_QR_SIZE_MM)

  return {
    pageFormat: {
      size: 'qr',
      widthMm: qrSizeMm,
      heightMm: qrSizeMm,
      orientation: 'portrait',
    },
    columns: 1,
    rows: 1,
    cardsPerPage: 1,
    cardWidthMm: qrSizeMm,
    cardHeightMm: qrSizeMm,
    qrSizeMm,
    startXmm: 0,
    startYmm: 0,
    gapXmm: 0,
    gapYmm: 0,
  } satisfies ResolvedQrPdfLayout
}

function resolveQrPdfLayout(totalCards: number, options: QrPdfExportOptions) {
  const safeTotalCards = Math.max(totalCards, 1)
  const pageSize = options.pageSize ?? 'a4'
  const pageFormats = getCandidatePageFormats(pageSize)

  if (options.mode === 'qrSize') {
    const requestedQrSizeMm = clamp(options.qrSizeMm ?? 42, MIN_QR_SIZE_MM, MAX_QR_SIZE_MM)

    if (pageSize === 'qr') {
      return resolveQrOnlyPageLayout(requestedQrSizeMm)
    }

    const candidates = pageFormats.map((pageFormat) => resolveLayoutByQrSize(pageFormat, requestedQrSizeMm))
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
  const candidates = pageFormats.map((pageFormat) =>
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
    pageSize: layout.pageFormat.size,
    orientation: layout.pageFormat.orientation,
    columns: layout.columns,
    rows: layout.rows,
    cardsPerPage: layout.cardsPerPage,
    qrSizeMm: Number(layout.qrSizeMm.toFixed(1)),
    pageCount: Math.ceil(Math.max(totalCards, 1) / layout.cardsPerPage),
    pageWidthMm: layout.pageFormat.widthMm,
    pageHeightMm: layout.pageFormat.heightMm,
    cardWidthMm: Number(layout.cardWidthMm.toFixed(1)),
    cardHeightMm: Number(layout.cardHeightMm.toFixed(1)),
    startXmm: Number(layout.startXmm.toFixed(1)),
    startYmm: Number(layout.startYmm.toFixed(1)),
    gapXmm: Number(layout.gapXmm.toFixed(1)),
    gapYmm: Number(layout.gapYmm.toFixed(1)),
  }
}

function getExportFileName(explicitFileName?: string) {
  if (explicitFileName?.trim()) {
    return explicitFileName.trim()
  }

  const dateStamp = new Date().toISOString().slice(0, 10)
  return `qr-codes-${dateStamp}.pdf`
}

function drawCard(
  doc: jsPDF,
  qrDataUrl: string,
  layout: ResolvedQrPdfLayout,
  column: number,
  row: number,
) {
  const x = layout.startXmm + column * (layout.cardWidthMm + layout.gapXmm)
  const y = layout.startYmm + row * (layout.cardHeightMm + layout.gapYmm)

  doc.addImage(qrDataUrl, 'PNG', x, y, layout.qrSizeMm, layout.qrSizeMm)
}

export async function downloadQrPdf(cards: QrCardDefinition[], options: QrPdfExportOptions) {
  if (!cards.length) {
    throw new Error('Es sind keine QR-Codes zum Export vorhanden.')
  }

  const layout = resolveQrPdfLayout(cards.length, options)
  const doc = new jsPDF({
    orientation: layout.pageFormat.orientation,
    unit: 'mm',
    format: [layout.pageFormat.widthMm, layout.pageFormat.heightMm],
    compress: true,
  })

  const qrDataUrls = await Promise.all(cards.map((card) => generateQrDataUrl(card.scanValue)))

  cards.forEach((_card, index) => {
    const pageIndex = Math.floor(index / layout.cardsPerPage)
    const indexOnPage = index % layout.cardsPerPage
    const row = Math.floor(indexOnPage / layout.columns)
    const column = indexOnPage % layout.columns

    if (pageIndex > 0 && indexOnPage === 0) {
      doc.addPage([layout.pageFormat.widthMm, layout.pageFormat.heightMm], layout.pageFormat.orientation)
    }

    drawCard(doc, qrDataUrls[index], layout, column, row)
  })

  doc.save(getExportFileName(options.fileName))
}
