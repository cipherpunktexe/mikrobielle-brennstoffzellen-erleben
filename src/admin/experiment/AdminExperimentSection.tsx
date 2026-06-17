import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import RefreshIcon from '@mui/icons-material/Refresh'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import type { ExperimentMeasurementDeleteRange } from '../../data/firebaseData'

const deleteRangeOptions: { value: ExperimentMeasurementDeleteRange; label: string }[] = [
  { value: '1h', label: 'Letzte 1 h' },
  { value: '6h', label: 'Letzte 6 h' },
  { value: '24h', label: 'Letzte 24 h' },
  { value: '7d', label: 'Letzte 7 Tage' },
  { value: 'all', label: 'Alle Messwerte' },
]

interface AdminExperimentSectionProps {
  selectedDeleteRange: ExperimentMeasurementDeleteRange
  affectedCount: number | null
  loadingCount: boolean
  deleting: boolean
  confirmOpen: boolean
  error: string
  onSetSelectedDeleteRange: (range: ExperimentMeasurementDeleteRange) => void
  onRefreshCount: () => void
  onOpenConfirm: () => void
  onCloseConfirm: () => void
  onConfirmDelete: () => void
}

export function AdminExperimentSection({
  selectedDeleteRange,
  affectedCount,
  loadingCount,
  deleting,
  confirmOpen,
  error,
  onSetSelectedDeleteRange,
  onRefreshCount,
  onOpenConfirm,
  onCloseConfirm,
  onConfirmDelete,
}: AdminExperimentSectionProps) {
  const selectedRangeLabel =
    deleteRangeOptions.find((option) => option.value === selectedDeleteRange)?.label ?? 'Auswahl'
  const countLabel = loadingCount
    ? 'Wird gezählt...'
    : affectedCount === null
      ? 'Noch nicht gezählt'
      : `${affectedCount} Messwert${affectedCount === 1 ? '' : 'e'}`

  return (
    <>
      <Card>
        <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
          <Stack spacing={2.5}>
            <Stack spacing={0.75}>
              <Typography variant="h4" sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
                Live-Versuch
              </Typography>
              <Typography color="text.secondary">
                Messwerte des großen Live-Versuchs verwalten.
              </Typography>
            </Stack>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                <InputLabel id="experiment-delete-range-label">Zeitraum</InputLabel>
                <Select
                  labelId="experiment-delete-range-label"
                  label="Zeitraum"
                  value={selectedDeleteRange}
                  onChange={(event) =>
                    onSetSelectedDeleteRange(event.target.value as ExperimentMeasurementDeleteRange)
                  }
                >
                  {deleteRangeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={onRefreshCount}
                disabled={loadingCount || deleting}
              >
                Neu zählen
              </Button>
            </Stack>

            <Card variant="soft">
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between">
                  <BoxedValue label="Betroffener Bereich" value={selectedRangeLabel} />
                  <BoxedValue label="Betroffene Daten" value={countLabel} />
                </Stack>
              </CardContent>
            </Card>

            <Alert severity="warning">
              Das Löschen entfernt die Live-Experimentdaten dauerhaft aus Firestore. Die Nutzer-Messwerte
              der einzelnen Brennstoffzellen bleiben unverändert.
            </Alert>

            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={onOpenConfirm}
              disabled={deleting || loadingCount || !affectedCount}
              sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
            >
              Messwerte löschen
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onClose={deleting ? undefined : onCloseConfirm} fullWidth maxWidth="xs">
        <DialogTitle>Live-Messwerte löschen?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {countLabel} aus „{selectedRangeLabel}“ werden dauerhaft gelöscht.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseConfirm} disabled={deleting}>
            Abbrechen
          </Button>
          <Button variant="contained" color="error" onClick={onConfirmDelete} disabled={deleting}>
            {deleting ? 'Löschen...' : 'Endgültig löschen'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

function BoxedValue({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
        {value}
      </Typography>
    </Stack>
  )
}
