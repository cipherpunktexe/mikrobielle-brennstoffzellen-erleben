import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import type { MouseEvent } from 'react'
import type { Generator, UserProfile } from '../../data/domain'
import type { ModerationListEntry } from '../types'
import { ModerationList } from './ModerationList'

interface BlockedDialogProps {
  open: boolean
  entries: ModerationListEntry[]
  onClose: () => void
  onOpenActions: (
    event: MouseEvent<HTMLElement>,
    user: UserProfile,
    generator: Generator | null,
  ) => void
  onOpenMeasurements: (generator: Generator) => void
}

export function BlockedDialog({
  open,
  entries,
  onClose,
  onOpenActions,
  onOpenMeasurements,
}: BlockedDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogTitle>Gesperrt</DialogTitle>
      <DialogContent>
        <ModerationList
          entries={entries}
          ariaLabel="Gesperrte Nutzer"
          emptyPrimary="Keine gesperrten Nutzer"
          emptySecondary="Gesperrte Konten erscheinen hier und können entsperrt werden."
          showStatus
          onOpenActions={onOpenActions}
          onOpenMeasurements={onOpenMeasurements}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  )
}
