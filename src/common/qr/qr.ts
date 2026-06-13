import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

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

function formatCode(code: string) {
  return code.trim().toLowerCase()
}

const DEFAULT_PUBLIC_APP_ORIGIN = resolvePublicAppOrigin()
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
const QR_LABEL_AREA_RATIO = 0.16
const QR_LABEL_GAP_RATIO = 0.02
export const QR_FOREGROUND_COLOR = '#000000'
export const QR_BACKGROUND_COLOR = '#FFFFFF'

export function getQrBadgeLabel(code: string) {
  const normalizedCode = formatCode(code) || code.trim() || '000'
  return normalizedCode.toUpperCase()
}

function resolvePublicAppOrigin() {
  const configuredOrigin = import.meta.env.VITE_PUBLIC_APP_URL?.trim()

  if (!configuredOrigin) {
    return 'https://mikrobielle-brennstoffzellen-erleben.web.app'
  }

  try {
    return new URL(configuredOrigin).origin
  } catch {
    return 'https://mikrobielle-brennstoffzellen-erleben.web.app'
  }
}

function getQrLabel(value: string) {
  const code = extractGeneratorCodeFromQrValue(value, 'https://mbz.local')
  return getQrBadgeLabel(code || value.trim() || '000')
}

function getQrLabelFontSize(label: string, preferredFontSize: number) {
  const estimatedTextWidthRatio = Math.max(label.length * 0.66, 1)
  return Math.min(preferredFontSize, (QR_CANVAS_SIZE * 0.82) / estimatedTextWidthRatio)
}

interface RenderQrModulesParams {
  context: CanvasRenderingContext2D
  qr: ReturnType<typeof QRCode.create>
  moduleSize: number
  offsetX: number
  offsetY: number
}

function renderQrModules({
  context,
  qr,
  moduleSize,
  offsetX,
  offsetY,
}: RenderQrModulesParams) {
  context.fillStyle = QR_FOREGROUND_COLOR

  for (let row = 0; row < qr.modules.size; row += 1) {
    for (let col = 0; col < qr.modules.size; col += 1) {
      if (!qr.modules.get(row, col)) {
        continue
      }

      const x = offsetX + col * moduleSize
      const y = offsetY + row * moduleSize

      context.fillRect(
        Math.floor(x),
        Math.floor(y),
        Math.ceil(moduleSize),
        Math.ceil(moduleSize),
      )
    }
  }
}

function renderQrToCanvas(
  value: string,
  label = getQrLabel(value),
) {
  const qr = QRCode.create(value, {
    errorCorrectionLevel: 'H',
  })
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('QR-Code konnte nicht gezeichnet werden.')
  }

  const totalModules = qr.modules.size + QR_QUIET_ZONE_MODULES * 2

  canvas.width = QR_CANVAS_SIZE
  canvas.height = QR_CANVAS_SIZE

  context.fillStyle = QR_BACKGROUND_COLOR
  context.fillRect(0, 0, canvas.width, canvas.height)

  const labelAreaHeight = QR_CANVAS_SIZE * QR_LABEL_AREA_RATIO
  const labelGap = QR_CANVAS_SIZE * QR_LABEL_GAP_RATIO
  const qrAreaSize = QR_CANVAS_SIZE - labelAreaHeight - labelGap
  const moduleSize = qrAreaSize / totalModules
  const qrPixelSize = moduleSize * totalModules
  const qrOffsetX = (QR_CANVAS_SIZE - qrPixelSize) / 2

  renderQrModules({
    context,
    qr,
    moduleSize,
    offsetX: qrOffsetX + QR_QUIET_ZONE_MODULES * moduleSize,
    offsetY: QR_QUIET_ZONE_MODULES * moduleSize,
  })

  context.fillStyle = QR_FOREGROUND_COLOR
  context.font = `bold ${getQrLabelFontSize(label, labelAreaHeight * 0.48)}px "Consolas", "Courier New", monospace`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(label, canvas.width / 2, qrAreaSize + labelGap + labelAreaHeight / 2)

  return canvas
}

export function buildGeneratorQrValue(code: string) {
  const normalizedCode = formatCode(code)

  if (!normalizedCode) {
    return ''
  }

  const registrationUrl = new URL('/user', DEFAULT_PUBLIC_APP_ORIGIN)
  registrationUrl.searchParams.set('register', normalizedCode)

  return registrationUrl.toString()
}

export async function generateQrDataUrl(
  value: string,
  label?: string,
) {
  return renderQrToCanvas(value, label).toDataURL('image/png')
}

function extractCodeFromPathSegments(pathSegments: string[]) {
  const normalizedSegments = pathSegments.map((segment) => segment.toLowerCase())
  const registerIndex = normalizedSegments.findIndex((segment) => segment === 'register')

  if (registerIndex >= 0 && pathSegments[registerIndex + 1]) {
    return formatCode(decodeURIComponent(pathSegments[registerIndex + 1]))
  }

  const adminScanGeneratorIndex = normalizedSegments.findIndex(
    (segment, index) =>
      segment === 'admin' &&
      normalizedSegments[index + 1] === 'scan' &&
      normalizedSegments[index + 2] === 'generator',
  )

  if (adminScanGeneratorIndex >= 0 && pathSegments[adminScanGeneratorIndex + 3]) {
    return formatCode(decodeURIComponent(pathSegments[adminScanGeneratorIndex + 3]))
  }

  return ''
}

export function extractGeneratorCodeFromQrValue(value: string, origin = window.location.origin) {
  const trimmedValue = value.trim()
  const looksLikePlainCode = !/[/?#:\s]/.test(trimmedValue)

  if (!trimmedValue) {
    return ''
  }

  const pathMatch = trimmedValue.match(/(?:^|\/)(?:register|admin\/scan\/generator)\/([^/?#\s]+)/i)

  if (pathMatch?.[1]) {
    return formatCode(decodeURIComponent(pathMatch[1]))
  }

  try {
    const url = new URL(trimmedValue, origin)
    const codeFromPath = extractCodeFromPathSegments(url.pathname.split('/').filter(Boolean))

    if (codeFromPath) {
      return codeFromPath
    }

    const codeParamCandidates = ['register', 'code', 'generator', 'generatorCode']

    for (const paramKey of codeParamCandidates) {
      const paramValue = url.searchParams.get(paramKey)?.trim()

      if (paramValue) {
        return formatCode(decodeURIComponent(paramValue))
      }
    }
  } catch {
    return looksLikePlainCode ? formatCode(trimmedValue) : ''
  }

  return looksLikePlainCode ? formatCode(trimmedValue) : ''
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

  const qrDataUrls = await Promise.all(
    cards.map((card) => generateQrDataUrl(card.scanValue, getQrBadgeLabel(card.code))),
  )

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
