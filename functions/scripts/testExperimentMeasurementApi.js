const defaultApiUrl =
  'https://mikrobielle-brennstoffzellen.web.app/api/experiment-measurement'

const apiUrl = process.env.EXPERIMENT_API_URL || defaultApiUrl
const token = process.env.EXPERIMENT_IMPORT_TOKEN
const measuredAt = process.env.EXPERIMENT_TEST_MEASURED_AT || new Date().toISOString()
const deviceId = process.env.EXPERIMENT_TEST_DEVICE_ID || 'hauptversuch'
const valueMv = Number(process.env.EXPERIMENT_TEST_VALUE_MV || '742')
const dryRun = process.env.EXPERIMENT_TEST_DRY_RUN !== 'false'

if (!token) {
  console.error('Set EXPERIMENT_IMPORT_TOKEN before calling the import API.')
  process.exitCode = 1
} else if (!Number.isFinite(valueMv)) {
  console.error('EXPERIMENT_TEST_VALUE_MV must be a finite number.')
  process.exitCode = 1
} else {
  const payload = {
    valueMv,
    measuredAt,
    deviceId,
    measurementId: `${deviceId}-${measuredAt}`,
    dryRun,
  }

  fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
    .then(async (response) => {
      const body = await response.json().catch(() => null)

      console.log(JSON.stringify({ ok: response.ok, status: response.status, body }, null, 2))

      if (!response.ok) {
        process.exitCode = 1
      }
    })
    .catch((error) => {
      console.error('Could not call experiment measurement API.', error)
      process.exitCode = 1
    })
}
