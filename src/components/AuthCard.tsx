import GoogleIcon from '@mui/icons-material/Google'
import { Alert, Button, Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material'
import { type FormEvent } from 'react'

export interface AuthValues {
  email: string
  password: string
}

interface AuthCardProps {
  title: string
  description: string
  values: AuthValues
  submitLabel: string
  googleLabel?: string
  loading: boolean
  error: string
  onChange: (field: keyof AuthValues, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onGoogleSignIn?: () => void | Promise<void>
}

export function AuthCard(props: AuthCardProps) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <div>
            <Typography variant="h4" gutterBottom>
              {props.title}
            </Typography>
            <Typography color="text.secondary">{props.description}</Typography>
          </div>

          {props.error ? <Alert severity="error">{props.error}</Alert> : null}

          <Stack component="form" spacing={2} onSubmit={props.onSubmit}>
            <TextField
              label="E-Mail"
              type="email"
              value={props.values.email}
              onChange={(event) => props.onChange('email', event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Passwort"
              type="password"
              value={props.values.password}
              onChange={(event) => props.onChange('password', event.target.value)}
              required
              fullWidth
            />
            <Button disabled={props.loading} type="submit" variant="contained">
              {props.loading ? 'Bitte warten...' : props.submitLabel}
            </Button>
          </Stack>

          {props.onGoogleSignIn ? (
            <>
              <Divider>oder</Divider>
              <Button
                disabled={props.loading}
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={() => void props.onGoogleSignIn?.()}
              >
                {props.googleLabel ?? 'Mit Google anmelden'}
              </Button>
            </>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  )
}
