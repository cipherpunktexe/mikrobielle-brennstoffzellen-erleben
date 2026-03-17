import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import { Box, IconButton, InputBase } from '@mui/material'
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
        width: fullWidth ? '100%' : 'auto',
        minWidth: 44,
        borderRadius: 999,
        border: open ? '1px solid rgba(121,101,66,0.28)' : '1px solid rgba(121,101,66,0.18)',
        bgcolor: open ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.72)',
        boxShadow: open ? '0 6px 16px rgba(36,28,19,0.07)' : 'none',
        overflow: 'hidden',
        transition:
          'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
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
          color: open ? '#6C5A39' : 'rgba(110,103,95,0.92)',
          '&:hover': {
            bgcolor: open ? 'rgba(121,101,66,0.14)' : 'rgba(121,101,66,0.08)',
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
            color: 'rgba(60,48,33,0.96)',
            fontSize: '1rem',
            '& input::placeholder': {
              color: 'rgba(110,103,95,0.88)',
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
            color: 'rgba(110,103,95,0.9)',
            opacity: value ? 1 : 0.5,
            '&:hover': {
              bgcolor: 'rgba(121,101,66,0.1)',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )
}
