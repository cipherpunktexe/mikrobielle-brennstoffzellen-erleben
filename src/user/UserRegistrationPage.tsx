import { Navigate, useParams } from 'react-router-dom'
import { formatCode } from '../common/format'

export function UserRegistrationPage() {
  const params = useParams()
  const scannedCode = formatCode(params.code ?? '')

  return <Navigate to={`/user?register=${encodeURIComponent(scannedCode)}`} replace />
}
