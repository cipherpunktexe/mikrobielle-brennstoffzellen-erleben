import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import type { MouseEvent } from 'react'
import type { Generator, UserProfile } from '../../data/domain'
import type { ModerationListEntry } from '../types'
import { ModerationList } from './ModerationList'

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
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogTitle>Papierkorb</DialogTitle>
      <DialogContent>
        <ModerationList
          entries={entries}
          ariaLabel="Papierkorb"
          emptyPrimary="Papierkorb leer"
          emptySecondary="Gelöschte Nutzer erscheinen hier und können wiederhergestellt werden."
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

