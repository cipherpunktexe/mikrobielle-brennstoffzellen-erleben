function applyCorsHeaders(res, methods = 'GET, OPTIONS') {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', methods)
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Experiment-Import-Token')
}

function sendApiError(res, status, code, error) {
  res.status(status).json({ code, error })
}

module.exports = {
  applyCorsHeaders,
  sendApiError,
}
