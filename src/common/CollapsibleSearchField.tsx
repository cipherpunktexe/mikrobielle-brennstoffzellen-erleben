import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import { Box, IconButton, InputBase } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef } from 'react'

interface CollapsibleSearchFieldProps {
  value: string
  open: boolean
  onChange: (value: string) => void
  onOpenChange: (open: boolean | ((current: boolean) => boolean)) => void
  placeholder?: string
  ariaLabel?: string
  fullWidth?: boolean
}

export function CollapsibleSearchField({
  value,
  open,
  onChange,
  onOpenChange,
  placeholder = 'Suchen',
  ariaLabel = 'Suchen',
  fullWidth = true,
}: CollapsibleSearchFieldProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target

      if (!(target instanceof Node)) {
        return
      }

      if (!rootRef.current?.contains(target)) {
        onOpenChange(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open) {
      return
    }

    inputRef.current?.focus()
  }, [open])

  return (
    <Box
      ref={rootRef}
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 44,
        width: fullWidth ? (open ? '100%' : 44) : 'auto',
        minWidth: 44,
        borderRadius: 999,
        border: (theme) => `1px solid ${alpha(theme.palette.secondary.main, open ? 0.28 : 0.18)}`,
        bgcolor: (theme) => alpha(theme.palette.common.white, open ? 0.9 : 0.72),
        boxShadow: (theme) =>
          open ? `0 14px 28px ${alpha(theme.palette.common.black, 0.14)}` : 'none',
        overflow: 'hidden',
        transition:
          'width 220ms ease, background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
      }}
    >
      <IconButton
        aria-label={open ? 'Suche einklappen' : 'Suche aufklappen'}
        onClick={() => onOpenChange((current) => !current)}
        sx={{
          width: 42,
          height: 42,
          flexShrink: 0,
          borderRadius: 999,
          color: open ? 'secondary.main' : 'text.secondary',
          '&:hover': {
            bgcolor: (theme) => open ? alpha(theme.palette.secondary.main, 0.14) : theme.palette.action.hover,
          },
        }}
      >
        <SearchIcon fontSize="small" />
      </IconButton>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flex: open ? 1 : '0 0 0px',
          maxWidth: open ? '100%' : 0,
          minWidth: 0,
          pr: open ? 0.6 : 0,
          opacity: open ? 1 : 0,
          transition: 'max-width 220ms ease, opacity 180ms ease, padding 220ms ease',
        }}
      >
        <InputBase
          inputRef={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          inputProps={{ 'aria-label': ariaLabel }}
          sx={{
            flex: 1,
            minWidth: 0,
            color: 'text.primary',
            fontSize: '1rem',
            '& input::placeholder': {
              color: 'text.secondary',
              opacity: 1,
            },
          }}
        />
        <IconButton
          aria-label="Suche leeren"
          size="small"
          onClick={() => onChange('')}
          sx={{
            ml: 0.35,
            color: 'text.secondary',
            opacity: value ? 1 : 0.5,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )
}
