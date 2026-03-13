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
const QR_CANVAS_SIZE = 720
const QR_QUIET_ZONE_MODULES = 4

function hashToThreeDigitHex(input: string) {
  let hash = 0

  for (const character of input) {
    hash = (hash * 31 + character.charCodeAt(0)) & 0xfff
  }

  return hash.toString(16).toUpperCase().padStart(3, '0')
}

function getQrCenterHex(value: string) {
  const code = extractGeneratorCodeFromQrValue(value, 'https://mbz.local')
  return hashToThreeDigitHex(code || value.trim() || '000')
}

export function getQrBadgeHex(code: string) {
  return hashToThreeDigitHex(formatCode(code) || code.trim() || '000')
}

function isFinderZone(row: number, col: number, size: number) {
  const finderSize = 7
  const topLeft = row < finderSize && col < finderSize
  const topRight = row < finderSize && col >= size - finderSize
  const bottomLeft = row >= size - finderSize && col < finderSize
  return topLeft || topRight || bottomLeft
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
}

function renderFancyQrToCanvas(value: string) {
  const qr = QRCode.create(value, {
    errorCorrectionLevel: 'H',
  })
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('QR-Code konnte nicht gezeichnet werden.')
  }

  const badgeHex = getQrCenterHex(value)
  const totalModules = qr.modules.size + QR_QUIET_ZONE_MODULES * 2
  const moduleSize = QR_CANVAS_SIZE / totalModules
  const qrOffset = QR_QUIET_ZONE_MODULES * moduleSize

  canvas.width = QR_CANVAS_SIZE
  canvas.height = QR_CANVAS_SIZE

  context.fillStyle = '#F8F2E7'
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.fillStyle = '#EFE6D4'
  drawRoundedRect(context, 18, 18, canvas.width - 36, canvas.height - 36, 40)
  context.fill()

  for (let row = 0; row < qr.modules.size; row += 1) {
    for (let col = 0; col < qr.modules.size; col += 1) {
      if (!qr.modules.get(row, col)) {
        continue
      }

      const x = qrOffset + col * moduleSize
      const y = qrOffset + row * moduleSize
      const isFinder = isFinderZone(row, col, qr.modules.size)

      context.fillStyle = isFinder ? '#7CB342' : '#241C13'
      drawRoundedRect(
        context,
        x + moduleSize * 0.12,
        y + moduleSize * 0.12,
        moduleSize * 0.76,
        moduleSize * 0.76,
        Math.max(2, moduleSize * 0.22),
      )
      context.fill()
    }
  }

  const badgeSize = canvas.width * 0.2
  const badgeX = (canvas.width - badgeSize) / 2
  const badgeY = (canvas.height - badgeSize) / 2

  context.fillStyle = '#FFF9EF'
  context.strokeStyle = '#1F7A8C'
  context.lineWidth = 10
  drawRoundedRect(context, badgeX, badgeY, badgeSize, badgeSize, 26)
  context.fill()
  context.stroke()

  context.fillStyle = '#241C13'
  context.font = 'bold 54px "Trebuchet MS", sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(badgeHex, canvas.width / 2, canvas.height / 2 + 2)

  return canvas
}

export function buildGeneratorQrValue(code: string) {
  const normalizedCode = formatCode(code)
  return normalizedCode ? `${QR_PREFIX}${normalizedCode}` : ''
}

export async function generateQrDataUrl(value: string) {
  return renderFancyQrToCanvas(value).toDataURL('image/png')
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
