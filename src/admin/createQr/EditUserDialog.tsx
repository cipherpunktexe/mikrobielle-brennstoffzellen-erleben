import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SaveIcon from '@mui/icons-material/Save'
import {
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { FormEvent } from 'react'
import type { EntityLifecycleStatus, Generator, UserProfile } from '../../data/domain'
import type { UserFormState } from '../types'

interface EditUserDialogProps {
  open: boolean
  editingUser: UserProfile | null
  editingUserGenerator: Generator | null
  userForm: UserFormState
  userDangerOpen: boolean
  userLifecycleActionLoading: '' | EntityLifecycleStatus
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onSetUserForm: (updater: (current: UserFormState) => UserFormState) => void
  onSetUserDangerOpen: (value: boolean | ((current: boolean) => boolean)) => void
  onUserLifecycleAction: (status: EntityLifecycleStatus) => void
}

function getStatusLabel(status: EntityLifecycleStatus) {
  if (status === 'blocked') {
    return 'Gesperrt'
  }

  if (status === 'deleted') {
    return 'Gelöscht'
  }

  return 'Aktiv'
}

function getStatusChipColor(status: EntityLifecycleStatus): 'success' | 'warning' | 'default' {
  if (status === 'blocked') {
    return 'warning'
  }

  if (status === 'deleted') {
    return 'default'
  }

  return 'success'
}

export function EditUserDialog({
  open,
  editingUser,
  editingUserGenerator,
  userForm,
  userDangerOpen,
  userLifecycleActionLoading,
  onClose,
  onSubmit,
  onSetUserForm,
  onSetUserDangerOpen,
  onUserLifecycleAction,
}: EditUserDialogProps) {
  const currentStatus = editingUser?.status ?? 'active'

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Nutzer bearbeiten</DialogTitle>
      <Box component="form" onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="Name"
              value={userForm.name}
              onChange={(event) => onSetUserForm((current) => ({ ...current, name: event.target.value }))}
              fullWidth
            />
            <TextField
              label="E-Mail"
              value={userForm.email}
              onChange={(event) => onSetUserForm((current) => ({ ...current, email: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Rolle"
              select
              value={userForm.role}
              onChange={(event) =>
                onSetUserForm((current) => ({
                  ...current,
                  role: event.target.value as UserFormState['role'],
                }))
              }
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </TextField>
            <TextField
              label="Verknüpfte Brennstoffzelle"
              InputLabelProps={{ shrink: true }}
              value={editingUserGenerator?.code ?? 'Keine'}
              disabled
              fullWidth
            />

            <Box
              sx={{
                border: '1px solid rgba(121,101,66,0.22)',
                borderRadius: 2.5,
                bgcolor: 'rgba(255,255,255,0.44)',
                px: 1.25,
                py: 1,
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Kontostatus
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Aktionen für Sperren, Wiederherstellen oder Löschen
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Chip
                    size="small"
                    label={getStatusLabel(currentStatus)}
                    color={getStatusChipColor(currentStatus)}
                  />
                  <Button
                    type="button"
                    color="inherit"
                    endIcon={
                      <ExpandMoreIcon
                        sx={{
                          transform: userDangerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 160ms ease',
                        }}
                      />
                    }
                    onClick={() => onSetUserDangerOpen((current) => !current)}
                    sx={{ px: 0.5, minWidth: 0 }}
                  >
                    Aktionen
                  </Button>
                </Stack>
              </Stack>

              <Collapse in={userDangerOpen}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ pt: 1.25 }}>
                  <Button
                    type="button"
                    color="success"
                    variant={currentStatus === 'active' ? 'outlined' : 'contained'}
                    onClick={() => onUserLifecycleAction('active')}
                    disabled={Boolean(userLifecycleActionLoading) || currentStatus === 'active'}
                    fullWidth
                  >
                    {userLifecycleActionLoading === 'active'
                      ? 'Wiederherstellen...'
                      : currentStatus === 'blocked'
                        ? 'Entsperren'
                        : 'Wiederherstellen'}
                  </Button>
                  <Button
                    type="button"
                    color="warning"
                    variant={currentStatus === 'blocked' ? 'outlined' : 'contained'}
                    onClick={() => onUserLifecycleAction('blocked')}
                    disabled={Boolean(userLifecycleActionLoading) || currentStatus === 'blocked'}
                    fullWidth
                  >
                    {userLifecycleActionLoading === 'blocked' ? 'Sperren...' : 'Sperren'}
                  </Button>
                  <Button
                    type="button"
                    color="error"
                    variant={currentStatus === 'deleted' ? 'outlined' : 'contained'}
                    onClick={() => onUserLifecycleAction('deleted')}
                    disabled={Boolean(userLifecycleActionLoading) || currentStatus === 'deleted'}
                    fullWidth
                  >
                    {userLifecycleActionLoading === 'deleted' ? 'Löschen...' : 'Löschen'}
                  </Button>
                </Stack>
              </Collapse>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={Boolean(userLifecycleActionLoading)}>
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={Boolean(userLifecycleActionLoading)}
          >
            Speichern
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
