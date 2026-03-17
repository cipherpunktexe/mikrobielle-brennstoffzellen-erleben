import { Box, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material'
import { memo, useCallback, useMemo } from 'react'
import type { ReactElement, ReactNode } from 'react'

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
  forceDesktopLayoutOnMobile?: boolean
}

interface PreparedColumn<TItem> extends UnifiedListColumn<TItem> {
  desktopAlign: 'start' | 'center' | 'end'
  textAlign: 'left' | 'center' | 'right'
  resolvedMobileSpan: 1 | 2
}

interface UnifiedListRowProps<TItem> {
  item: TItem
  isLastItem: boolean
  preparedColumns: PreparedColumn<TItem>[]
  desktopGridTemplate: string
  minDesktopWidth: number
  onItemClick?: (item: TItem) => void
  isItemDisabled?: (item: TItem) => boolean
  getItemAriaLabel?: (item: TItem) => string
  renderItemAction?: (item: TItem) => ReactNode
  renderMobileRow?: (item: TItem) => ReactNode
  forceDesktopLayoutOnMobile: boolean
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

const listItemButtonPaddingSx = { xs: 1.5, sm: 1.75 }

const UnifiedListRow = memo(function UnifiedListRow<TItem>({
  item,
  isLastItem,
  preparedColumns,
  desktopGridTemplate,
  minDesktopWidth,
  onItemClick,
  isItemDisabled,
  getItemAriaLabel,
  renderItemAction,
  renderMobileRow,
  forceDesktopLayoutOnMobile,
}: UnifiedListRowProps<TItem>) {
  const action = renderItemAction ? renderItemAction(item) : null
  const disabled = isItemDisabled?.(item) ?? false
  const mobileGridTemplate = preparedColumns.length <= 1 ? '1fr' : 'repeat(2, minmax(0, 1fr))'

  const handleItemClick = useCallback(() => {
    if (!onItemClick || disabled) {
      return
    }

    onItemClick(item)
  }, [disabled, item, onItemClick])

  return (
    <ListItem
      disablePadding
      secondaryAction={action}
      sx={{ borderBottom: isLastItem ? 'none' : '1px solid rgba(121,101,66,0.1)' }}
    >
      {onItemClick ? (
        <ListItemButton
          disabled={disabled}
          aria-label={getItemAriaLabel?.(item)}
          onClick={handleItemClick}
          sx={{
            px: listItemButtonPaddingSx,
            py: 1.3,
            pr: action ? 6 : listItemButtonPaddingSx,
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
          <Box sx={{ width: '100%' }}>
            <Box
              sx={{
                display: forceDesktopLayoutOnMobile ? 'grid' : { xs: 'none', sm: 'grid' },
                gridTemplateColumns: desktopGridTemplate,
                gap: 1.5,
                alignItems: 'center',
                minWidth: minDesktopWidth,
              }}
            >
              {preparedColumns.map((column) => (
                <Box
                  key={column.key}
                  sx={{
                    minWidth: 0,
                    justifySelf: column.desktopAlign,
                    textAlign: column.textAlign,
                  }}
                >
                  {column.render(item)}
                </Box>
              ))}
            </Box>

            {renderMobileRow ? (
              <Box sx={{ display: forceDesktopLayoutOnMobile ? 'none' : { xs: 'block', sm: 'none' } }}>
                {renderMobileRow(item)}
              </Box>
            ) : (
              <Box
                sx={{
                  display: forceDesktopLayoutOnMobile ? 'none' : { xs: 'grid', sm: 'none' },
                  gridTemplateColumns: mobileGridTemplate,
                  gap: 1,
                }}
              >
                {preparedColumns.map((column) => (
                  <Box
                    key={column.key}
                    sx={{
                      minWidth: 0,
                      gridColumn: `span ${column.resolvedMobileSpan}`,
                      borderRadius: 1.25,
                      px: 1,
                      py: 0.8,
                      bgcolor: 'rgba(255,255,255,0.24)',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {column.mobileLabel ?? column.header}
                    </Typography>
                    <Box sx={{ minWidth: 0, mt: 0.25, textAlign: column.textAlign }}>{column.render(item)}</Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </ListItemButton>
      ) : (
        <Box sx={{ px: listItemButtonPaddingSx, py: 1.3, pr: action ? 6 : listItemButtonPaddingSx, width: '100%' }}>
          <Box sx={{ width: '100%' }}>
            <Box
              sx={{
                display: forceDesktopLayoutOnMobile ? 'grid' : { xs: 'none', sm: 'grid' },
                gridTemplateColumns: desktopGridTemplate,
                gap: 1.5,
                alignItems: 'center',
                minWidth: minDesktopWidth,
              }}
            >
              {preparedColumns.map((column) => (
                <Box
                  key={column.key}
                  sx={{
                    minWidth: 0,
                    justifySelf: column.desktopAlign,
                    textAlign: column.textAlign,
                  }}
                >
                  {column.render(item)}
                </Box>
              ))}
            </Box>

            {renderMobileRow ? (
              <Box sx={{ display: forceDesktopLayoutOnMobile ? 'none' : { xs: 'block', sm: 'none' } }}>
                {renderMobileRow(item)}
              </Box>
            ) : (
              <Box
                sx={{
                  display: forceDesktopLayoutOnMobile ? 'none' : { xs: 'grid', sm: 'none' },
                  gridTemplateColumns: mobileGridTemplate,
                  gap: 1,
                }}
              >
                {preparedColumns.map((column) => (
                  <Box
                    key={column.key}
                    sx={{
                      minWidth: 0,
                      gridColumn: `span ${column.resolvedMobileSpan}`,
                      borderRadius: 1.25,
                      px: 1,
                      py: 0.8,
                      bgcolor: 'rgba(255,255,255,0.24)',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {column.mobileLabel ?? column.header}
                    </Typography>
                    <Box sx={{ minWidth: 0, mt: 0.25, textAlign: column.textAlign }}>{column.render(item)}</Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </ListItem>
  )
}) as <TItem>(props: UnifiedListRowProps<TItem>) => ReactElement

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
  forceDesktopLayoutOnMobile = true,
}: UnifiedListProps<TItem>) {
  const preparedColumns = useMemo<PreparedColumn<TItem>[]>(() => {
    const isOddColumnCount = columns.length % 2 === 1
    const lastIndex = columns.length - 1

    return columns.map((column, index) => ({
      ...column,
      desktopAlign: getDesktopCellAlign(column.align),
      textAlign: getTextAlign(column.align),
      resolvedMobileSpan: column.mobileSpan ?? (isOddColumnCount && index === lastIndex ? 2 : 1),
    }))
  }, [columns])

  const desktopGridTemplate = useMemo(
    () => preparedColumns.map((column) => column.width ?? 'minmax(0,1fr)').join(' '),
    [preparedColumns],
  )

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
            display: forceDesktopLayoutOnMobile ? 'grid' : { xs: 'none', sm: 'grid' },
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
          {preparedColumns.map((column) => (
            <Typography
              key={column.key}
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{ letterSpacing: '0.04em', textAlign: column.textAlign }}
            >
              {column.header}
            </Typography>
          ))}
        </Box>
      </Box>

      <List disablePadding aria-label={ariaLabel}>
        {items.length ? (
          items.map((item, index) => {
            return (
              <UnifiedListRow
                key={getItemKey(item, index)}
                item={item}
                isLastItem={index === items.length - 1}
                preparedColumns={preparedColumns}
                desktopGridTemplate={desktopGridTemplate}
                minDesktopWidth={minDesktopWidth}
                onItemClick={onItemClick}
                isItemDisabled={isItemDisabled}
                getItemAriaLabel={getItemAriaLabel}
                renderItemAction={renderItemAction}
                renderMobileRow={renderMobileRow}
                forceDesktopLayoutOnMobile={forceDesktopLayoutOnMobile}
              />
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
