import CloseIcon from '@mui/icons-material/Close'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { MeasurementChart } from '../common/MeasurementChart'
import type { LeaderboardEntry, Measurement } from '../data/domain'

interface LeaderboardTrendDialogProps {
  open: boolean
  selectedEntry: LeaderboardEntry | null
  selectedMeasurements: Measurement[] | null
  isMobileViewport: boolean
  onClose: () => void
}

export function LeaderboardTrendDialog({
  open,
  selectedEntry,
  selectedMeasurements,
  isMobileViewport,
  onClose,
}: LeaderboardTrendDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={isMobileViewport}
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: isMobileViewport ? 0 : '26px',
        },
      }}
    >
      <DialogTitle
        sx={{
          pr: 6,
          py: { xs: 1.75, sm: 2 },
          fontSize: { xs: '1.95rem', sm: undefined },
        }}
      >
        {selectedEntry ? `Messverlauf: ${selectedEntry.displayName}` : 'Messverlauf'}
        <IconButton aria-label="Dialog schliessen" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          px: { xs: 1.25, sm: 2.5 },
          py: { xs: 1.5, sm: 2 },
        }}
      >
        {!selectedMeasurements ? (
          <Stack sx={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
            <CircularProgress color="inherit" />
          </Stack>
        ) : selectedMeasurements.length === 0 ? (
          <Typography color="text.secondary">
            Fuer diese Brennstoffzelle liegen noch keine Messwerte vor.
          </Typography>
        ) : (
          <MeasurementChart measurements={selectedMeasurements} />
        )}
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.25, sm: 1.5 } }}>
        <Button onClick={onClose}>Schliessen</Button>
      </DialogActions>
    </Dialog>
  )
}
