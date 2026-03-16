import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import { Divider, Menu, MenuItem } from '@mui/material'
import type { Generator, UserProfile } from '../../../../shared/types/domain'

interface ModerationMenusProps {
  trashMenuAnchorEl: HTMLElement | null
  moderationMenuAnchorEl: HTMLElement | null
  trashedModerationEntriesCount: number
  menuUser: UserProfile | null
  menuGenerator: Generator | null
  onCloseTrashMenu: () => void
  onOpenTrashDialog: () => void
  onCloseModerationMenu: () => void
  onOpenUserDialog: (user: UserProfile) => void
  onOpenGeneratorMeasurements: (generator: Generator) => void
  onPromoteUserToAdmin: () => void
}

export function ModerationMenus({
  trashMenuAnchorEl,
  moderationMenuAnchorEl,
  trashedModerationEntriesCount,
  menuUser,
  menuGenerator,
  onCloseTrashMenu,
  onOpenTrashDialog,
  onCloseModerationMenu,
  onOpenUserDialog,
  onOpenGeneratorMeasurements,
  onPromoteUserToAdmin,
}: ModerationMenusProps) {
  return (
    <>
      <Menu
        anchorEl={trashMenuAnchorEl}
        open={Boolean(trashMenuAnchorEl)}
        onClose={onCloseTrashMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 210,
            overflow: 'hidden',
            borderRadius: 3,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: '0 22px 44px rgba(36,28,19,0.16)',
          },
        }}
      >
        <MenuItem onClick={onOpenTrashDialog} sx={{ gap: 1.25 }}>
          <DeleteOutlineOutlinedIcon fontSize="small" />
          {trashedModerationEntriesCount ? `Papierkorb (${trashedModerationEntriesCount})` : 'Papierkorb'}
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={moderationMenuAnchorEl}
        open={Boolean(moderationMenuAnchorEl)}
        onClose={onCloseModerationMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 250,
            overflow: 'hidden',
            borderRadius: 3,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: '0 22px 44px rgba(36,28,19,0.16)',
          },
        }}
        MenuListProps={{
          dense: true,
          sx: { p: 0.75 },
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuUser) {
              onOpenUserDialog(menuUser)
            }
          }}
          sx={{ gap: 1.25, borderRadius: 2, mx: 0.5, my: 0.25 }}
        >
          <PersonOutlineIcon fontSize="small" />
          Nutzer bearbeiten
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuGenerator) {
              onOpenGeneratorMeasurements(menuGenerator)
              onCloseModerationMenu()
            }
          }}
          disabled={!menuGenerator}
          sx={{ gap: 1.25, borderRadius: 2, mx: 0.5, my: 0.25 }}
        >
          <ShowChartIcon fontSize="small" />
          Messwerte
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={onPromoteUserToAdmin}
          disabled={menuUser?.role === 'admin'}
          sx={{ gap: 1.25, borderRadius: 2, mx: 0.5, my: 0.25 }}
        >
          <AdminPanelSettingsOutlinedIcon fontSize="small" />
          {menuUser?.role === 'admin' ? 'Bereits Admin' : 'Zum Admin machen'}
        </MenuItem>
      </Menu>
    </>
  )
}
