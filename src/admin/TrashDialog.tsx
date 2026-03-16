import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { ModerationList } from './ModerationList'
import type { ModerationListEntry } from './types'
import type { Generator, UserProfile } from '../common/domain'
import type { MouseEvent } from 'react'

interface TrashDialogProps {
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

export function TrashDialog({
  open,
  entries,
  onClose,
  onOpenActions,
  onOpenMeasurements,
}: TrashDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Papierkorb</DialogTitle>
      <DialogContent>
        <ModerationList
          entries={entries}
          ariaLabel="Papierkorb"
          emptyPrimary="Papierkorb leer"
          emptySecondary="Gesperrte oder gelöschte Nutzer erscheinen hier."
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
