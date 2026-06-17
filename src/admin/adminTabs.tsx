import EditNoteIcon from '@mui/icons-material/EditNote'
import InsightsIcon from '@mui/icons-material/Insights'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import type { ReactElement } from 'react'
import type { AdminTabValue } from './types'

export const adminTabItems: { value: AdminTabValue; label: string; icon: ReactElement }[] = [
  { value: 'scan', label: 'Scannen', icon: <QrCodeScannerIcon fontSize="small" /> },
  { value: 'qr', label: 'QR erstellen', icon: <QrCode2Icon fontSize="small" /> },
  { value: 'moderation', label: 'Moderieren', icon: <EditNoteIcon fontSize="small" /> },
  { value: 'experiment', label: 'Live-Versuch', icon: <InsightsIcon fontSize="small" /> },
]
