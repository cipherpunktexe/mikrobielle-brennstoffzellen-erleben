function applyCorsHeaders(res, methods = 'GET, OPTIONS') {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', methods)
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Experiment-Import-Token')
}

function sendApiError(res, status, code, error, options = {}) {
  const payload = { code, error }

  if (options.field) {
    payload.field = options.field
  }

  if (options.details) {
    payload.details = options.details
  }

  res.status(status).json(payload)
}

module.exports = {
  applyCorsHeaders,
  sendApiError,
}
