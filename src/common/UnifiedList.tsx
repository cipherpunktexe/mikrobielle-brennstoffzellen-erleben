import { Box, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material'
import type { ReactNode } from 'react'

type CellAlign = 'left' | 'right' | 'center'

export interface UnifiedListColumn<TItem> {
  key: string
  header: ReactNode
  mobileLabel?: ReactNode
  width?: string
  align?: CellAlign
  mobileSpan?: 1 | 2
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
          <Box
            sx={{
              display: { xs: 'grid', sm: 'none' },
              gridTemplateColumns: columns.length <= 1 ? '1fr' : 'repeat(2, minmax(0, 1fr))',
              gap: 1,
            }}
          >
            {columns.map((column, index) => {
              const isLastOddColumn = columns.length % 2 === 1 && index === columns.length - 1
              const span = column.mobileSpan ?? (isLastOddColumn ? 2 : 1)

              return (
                <Box
                  key={column.key}
                  sx={{
                    minWidth: 0,
                    gridColumn: `span ${span}`,
                    borderRadius: 1.25,
                    px: 1,
                    py: 0.8,
                    bgcolor: 'rgba(255,255,255,0.24)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {column.mobileLabel ?? column.header}
                  </Typography>
                  <Box sx={{ minWidth: 0, mt: 0.25, textAlign: getTextAlign(column.align) }}>{column.render(item)}</Box>
                </Box>
              )
            })}
          </Box>
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
            bgcolor: 'rgba(121,101,66,0.08)',
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
