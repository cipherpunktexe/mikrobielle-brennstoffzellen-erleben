import QRCode from 'qrcode'
import { formatCode } from './format'

export interface QrCardDefinition {
  code: string
  scanValue: string
}

const QR_PREFIX = 'mbz:generator:'

export function buildGeneratorQrValue(code: string) {
  const normalizedCode = formatCode(code)
  return normalizedCode ? `${QR_PREFIX}${normalizedCode}` : ''
}

export async function generateQrDataUrl(value: string) {
  return QRCode.toDataURL(value, {
    margin: 1,
    width: 256,
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

    if (
      pathSegments[0] === 'admin' &&
      pathSegments[1] === 'generator' &&
      pathSegments[2]
    ) {
      return formatCode(decodeURIComponent(pathSegments[2]))
    }
  } catch {
    return formatCode(trimmedValue)
  }

  return formatCode(trimmedValue)
}

export async function printQrCards(cards: QrCardDefinition[]) {
  const renderedCards = await Promise.all(
    cards.map(async (card) => {
      const qrDataUrl = await generateQrDataUrl(card.scanValue)

      return `
        <article class="card">
          <header>
            <h2>${card.code}</h2>
            <p>Mikrobielle Brennstoffzellen</p>
          </header>
          <section>
            <div>
              <img src="${qrDataUrl}" alt="QR-Code ${card.code}" />
              <strong>App-QR-Code</strong>
              <span>Im Nutzerbereich verknüpfen oder im Admin-Bereich scannen.</span>
            </div>
          </section>
        </article>
      `
    }),
  )

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1280,height=900')

  if (!printWindow) {
    throw new Error('Das Druckfenster konnte nicht geöffnet werden.')
  }

  printWindow.document.write(`
    <html lang="de">
      <head>
        <title>QR-Export</title>
        <style>
          body { margin: 0; padding: 24px; font-family: "Trebuchet MS", sans-serif; background: #f7f1e7; color: #241c13; }
          main { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
          .card { break-inside: avoid; border: 2px solid #796542; border-radius: 18px; padding: 18px; background: #fffaf1; }
          header { margin-bottom: 16px; }
          h2 { margin: 0 0 4px; font-family: "Palatino Linotype", serif; }
          p { margin: 0; color: #4d4331; }
          section { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
          section div { border: 1px solid #c4c0b9; border-radius: 14px; padding: 12px; text-align: center; background: #efe9dc; }
          img { width: 100%; max-width: 220px; display: block; margin: 0 auto 8px; }
          strong { display: block; margin-bottom: 6px; }
          span { font-size: 11px; }
          @media print { body { padding: 12px; } }
        </style>
      </head>
      <body>
        <main>${renderedCards.join('')}</main>
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
