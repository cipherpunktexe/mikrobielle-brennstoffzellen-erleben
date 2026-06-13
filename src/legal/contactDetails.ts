export const contactDetails = {
  projectName: 'Mikrobielle Brennstoffzellen erleben',
  responsiblePerson: 'Gaußschule Gymnasium am Löwenwall',
  email: 'mikrobielle.brennstoffzelle.edu@gmail.com',
  streetAddress: 'Löwenwall 18a',
  postalCodeAndCity: '38100 Braunschweig',
  country: 'Deutschland',
  phone: '(0531) 470-4747',
} as const

export const contactEmailHref = `mailto:${contactDetails.email}`
