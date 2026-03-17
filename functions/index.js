const admin = require('firebase-admin')
const { onRequest } = require('firebase-functions/v2/https')

admin.initializeApp()

const db = admin.firestore()

function isActiveEntity(status) {
  return status !== 'blocked' && status !== 'deleted'
}

function toMillis(timestamp) {
  if (!timestamp || typeof timestamp.toMillis !== 'function') {
    return 0
  }

  return timestamp.toMillis()
}

function applyCorsHeaders(res) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
}

exports.leaderboard = onRequest({ region: 'europe-west1' }, async (req, res) => {
  applyCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed. Use GET.' })
    return
  }

  const parsedLimit = Number.parseInt(String(req.query.limit ?? ''), 10)
  const limit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(parsedLimit, 500))
    : 100

  try {
    const [generatorsSnapshot, measurementsSnapshot] = await Promise.all([
      db.collection('generators').get(),
      db.collection('measurements').get(),
    ])

    const activeGenerators = new Map()

    generatorsSnapshot.docs.forEach((doc) => {
      const generator = doc.data() || {}

      if (!isActiveEntity(generator.status)) {
        return
      }

      activeGenerators.set(doc.id, {
        id: doc.id,
        code: generator.code || 'unbekannt',
        ownerName: (generator.ownerName || '').trim(),
      })
    })

    const maxByGenerator = new Map()

    measurementsSnapshot.docs.forEach((doc) => {
      const measurement = doc.data() || {}
      const generatorId = measurement.generatorId
      const generator = activeGenerators.get(generatorId)

      if (!generator) {
        return
      }

      const value = Number(measurement.value)

      if (!Number.isFinite(value)) {
        return
      }

      const createdAt = measurement.createdAt || null
      const current = maxByGenerator.get(generatorId)

      if (!current) {
        maxByGenerator.set(generatorId, {
          generatorId,
          code: generator.code,
          displayName: generator.ownerName || generator.code,
          maxValue: value,
          maxMeasuredAt: createdAt,
        })
        return
      }

      const currentMs = toMillis(current.maxMeasuredAt)
      const nextMs = toMillis(createdAt)

      if (value > current.maxValue || (value === current.maxValue && nextMs > currentMs)) {
        maxByGenerator.set(generatorId, {
          ...current,
          maxValue: value,
          maxMeasuredAt: createdAt,
        })
      }
    })

    const entries = Array.from(maxByGenerator.values())
      .sort((left, right) => {
        if (right.maxValue !== left.maxValue) {
          return right.maxValue - left.maxValue
        }

        return toMillis(right.maxMeasuredAt) - toMillis(left.maxMeasuredAt)
      })
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        generatorId: entry.generatorId,
        code: entry.code,
        displayName: entry.displayName,
        maxValue: entry.maxValue,
        maxMeasuredAt: entry.maxMeasuredAt ? entry.maxMeasuredAt.toDate().toISOString() : null,
      }))

    res.set('Cache-Control', 'public, max-age=60')
    res.status(200).json({
      generatedAt: new Date().toISOString(),
      count: entries.length,
      entries,
    })
  } catch (error) {
    console.error('Leaderboard API failed', error)
    res.status(500).json({ error: 'Leaderboard could not be loaded.' })
  }
})
