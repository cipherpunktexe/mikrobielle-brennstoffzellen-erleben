import { Link, Stack, Typography } from '@mui/material'
import { contactDetails, contactEmailHref } from './contactDetails'

interface ContactDetailsProps {
  showProjectName?: boolean
}

export function ContactDetails({ showProjectName = false }: ContactDetailsProps) {
  return (
    <Stack spacing={1}>
      <Typography component="address" variant="body2" sx={{ fontStyle: 'normal' }}>
        {showProjectName ? (
          <>
            {contactDetails.projectName}
            <br />
          </>
        ) : null}
        {contactDetails.responsiblePerson}
        <br />
        {contactDetails.streetAddress}
        <br />
        {contactDetails.postalCodeAndCity}
        <br />
        {contactDetails.country}
      </Typography>
      <Typography variant="body2">
        E-Mail:{' '}
        <Link href={contactEmailHref}>{contactDetails.email}</Link>
        <br />
        Telefon: {contactDetails.phone}
      </Typography>
    </Stack>
  )
}
