export const contactDetails = {
  projectName: 'Mikrobielle Brennstoffzellen erleben',
  responsiblePerson: 'Jan Lukas Behme',
  email: 'mikrobielle.brennstoffzelle.edu@gmail.com',
  streetAddress: '[Straße und Hausnummer ergänzen]',
  postalCodeAndCity: '[PLZ und Ort ergänzen]',
  country: 'Deutschland',
  phone: '[Telefonnummer ergänzen]',
} as const

export const contactEmailHref = `mailto:${contactDetails.email}`
