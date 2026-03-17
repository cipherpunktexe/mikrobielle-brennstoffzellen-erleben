import { Box, List, ListItem, ListItemButton, ListItemText, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

type CellAlign = 'left' | 'right' | 'center'

export interface UnifiedListColumn<TItem> {
  key: string
  header: ReactNode
  mobileLabel?: ReactNode
  width?: string
  align?: CellAlign
  render: (item: TItem) => ReactNode
}

interface UnifiedListProps<TItem> {
  items: TItem[]
  columns: UnifiedListColumn<TItem>[]
  getItemKey: (item: TItem, index: number) => string
  ariaLabel: string
  emptyPrimary: string
  emptySecondary?: string
  onItemClick?: (item: TItem) => void
  isItemDisabled?: (item: TItem) => boolean
  getItemAriaLabel?: (item: TItem) => string
  renderItemAction?: (item: TItem) => ReactNode
  renderMobileRow?: (item: TItem) => ReactNode
  minDesktopWidth?: number
}

function getDesktopCellAlign(align: CellAlign | undefined) {
  if (align === 'right') {
    return 'end'
  }

  if (align === 'center') {
    return 'center'
  }

  return 'start'
}

function getTextAlign(align: CellAlign | undefined) {
  if (align === 'right') {
    return 'right'
  }

  if (align === 'center') {
    return 'center'
  }

  return 'left'
}

export function UnifiedList<TItem>({
  items,
  columns,
  getItemKey,
  ariaLabel,
  emptyPrimary,
  emptySecondary,
  onItemClick,
  isItemDisabled,
  getItemAriaLabel,
  renderItemAction,
  renderMobileRow,
  minDesktopWidth = 520,
}: UnifiedListProps<TItem>) {
  const desktopGridTemplate = columns.map((column) => column.width ?? 'minmax(0,1fr)').join(' ')

  function handleItemClick(item: TItem) {
    if (!onItemClick) {
      return
    }

    onItemClick(item)
  }

  function renderRowContent(item: TItem) {
    return (
      <Box sx={{ width: '100%' }}>
        <Box
          sx={{
            display: { xs: 'none', sm: 'grid' },
            gridTemplateColumns: desktopGridTemplate,
            gap: 1.5,
            alignItems: 'center',
            minWidth: minDesktopWidth,
          }}
        >
          {columns.map((column) => (
            <Box
              key={column.key}
              sx={{
                minWidth: 0,
                justifySelf: getDesktopCellAlign(column.align),
                textAlign: getTextAlign(column.align),
              }}
            >
              {column.render(item)}
            </Box>
          ))}
        </Box>

        {renderMobileRow ? (
          <Box sx={{ display: { xs: 'block', sm: 'none' } }}>{renderMobileRow(item)}</Box>
        ) : (
          <Stack spacing={1.1} sx={{ display: { xs: 'flex', sm: 'none' } }}>
            {columns.map((column) => (
              <Stack key={column.key} direction="row" spacing={1.5} justifyContent="space-between" alignItems="flex-start">
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, minWidth: 72 }}>
                  {column.mobileLabel ?? column.header}
                </Typography>
                <Box sx={{ minWidth: 0, textAlign: 'right' }}>{column.render(item)}</Box>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        overflow: 'hidden',
        border: '1px solid rgba(121,101,66,0.14)',
        bgcolor: 'rgba(255,255,255,0.18)',
      }}
    >
      <Box sx={{ overflowX: 'auto' }}>
        <Box
          sx={{
            display: { xs: 'none', sm: 'grid' },
            gridTemplateColumns: desktopGridTemplate,
            gap: 1.5,
            px: 2,
            py: 1,
            pr: renderItemAction ? 6 : 2,
            borderBottom: items.length ? '1px solid rgba(121,101,66,0.1)' : 'none',
            minWidth: minDesktopWidth,
          }}
        >
          {columns.map((column) => (
            <Typography
              key={column.key}
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{ letterSpacing: '0.04em', textAlign: getTextAlign(column.align) }}
            >
              {column.header}
            </Typography>
          ))}
        </Box>
      </Box>

      <List disablePadding aria-label={ariaLabel}>
        {items.length ? (
          items.map((item, index) => {
            const action = renderItemAction ? renderItemAction(item) : null
            const disabled = isItemDisabled?.(item) ?? false

            return (
              <ListItem
                key={getItemKey(item, index)}
                disablePadding
                secondaryAction={action}
                sx={{ borderBottom: index < items.length - 1 ? '1px solid rgba(121,101,66,0.1)' : 'none' }}
              >
                {onItemClick ? (
                  <ListItemButton
                    disabled={disabled}
                    aria-label={getItemAriaLabel?.(item)}
                    onClick={() => handleItemClick(item)}
                    sx={{
                      px: { xs: 1.5, sm: 1.75 },
                      py: 1.3,
                      pr: action ? 6 : { xs: 1.5, sm: 1.75 },
                      borderRadius: 0,
                      '&.Mui-disabled': {
                        opacity: 1,
                        cursor: 'default',
                      },
                      '&:hover': {
                        bgcolor: disabled ? 'transparent' : 'rgba(255,255,255,0.34)',
                      },
                      '&:focus-visible': {
                        outline: '2px solid rgba(143,122,81,0.55)',
                        outlineOffset: -2,
                        bgcolor: 'rgba(255,255,255,0.34)',
                      },
                    }}
                  >
                    {renderRowContent(item)}
                  </ListItemButton>
                ) : (
                  <Box sx={{ px: { xs: 1.5, sm: 1.75 }, py: 1.3, pr: action ? 6 : { xs: 1.5, sm: 1.75 }, width: '100%' }}>
                    {renderRowContent(item)}
                  </Box>
                )}
              </ListItem>
            )
          })
        ) : (
          <ListItem sx={{ px: 1.5, py: 1.5 }}>
            <ListItemText primary={emptyPrimary} secondary={emptySecondary} />
          </ListItem>
        )}
      </List>
    </Box>
  )
}
