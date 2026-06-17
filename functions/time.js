function timestampToIso(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return null
  }

  return timestamp.toDate().toISOString()
}

function toMillis(timestamp) {
  if (!timestamp || typeof timestamp.toMillis !== 'function') {
    return 0
  }

  return timestamp.toMillis()
}

module.exports = {
  timestampToIso,
  toMillis,
}
