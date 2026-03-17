import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SaveIcon from '@mui/icons-material/Save'
import { Box, Button, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'
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
            <Box>
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
                sx={{ px: 0, minWidth: 0 }}
              >
                Kontostatus
              </Button>
              <Collapse in={userDangerOpen}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ pt: 1.25 }}>
                  <Button
                    type="button"
                    color="success"
                    onClick={() => onUserLifecycleAction('active')}
                    disabled={Boolean(userLifecycleActionLoading) || editingUser?.status === 'active'}
                  >
                    {userLifecycleActionLoading === 'active'
                      ? 'Wiederherstellen...'
                      : editingUser?.status === 'active'
                        ? 'Aktiv'
                        : editingUser?.status === 'blocked'
                          ? 'Entsperren'
                          : 'Wiederherstellen'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => onUserLifecycleAction('blocked')}
                    disabled={Boolean(userLifecycleActionLoading) || editingUser?.status === 'blocked'}
                  >
                    {userLifecycleActionLoading === 'blocked'
                      ? 'Sperren...'
                      : editingUser?.status === 'blocked'
                        ? 'Gesperrt'
                        : 'Sperren'}
                  </Button>
                  <Button
                    type="button"
                    color="error"
                    onClick={() => onUserLifecycleAction('deleted')}
                    disabled={Boolean(userLifecycleActionLoading) || editingUser?.status === 'deleted'}
                  >
                    {userLifecycleActionLoading === 'deleted'
                      ? 'Loeschen...'
                      : editingUser?.status === 'deleted'
                        ? 'Geloescht'
                        : 'Loeschen'}
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
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={Boolean(userLifecycleActionLoading)}>
            Speichern
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
