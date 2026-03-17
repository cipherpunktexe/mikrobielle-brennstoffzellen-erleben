import type { LeaderboardEntry } from '../data/domain'

export interface LeaderboardSection {
  title: string
  startRank: number
  endRank: number
  entries: LeaderboardEntry[]
}

export function buildLeaderboardSections(entries: LeaderboardEntry[], startingRank = 1): LeaderboardSection[] {
  if (entries.length === 0) {
    return []
  }

  const totalCount = entries.length + startingRank - 1
  const thresholds = [5, 10, 25, 50, 100].filter(
    (threshold) => threshold >= startingRank && threshold < totalCount,
  )
  const sectionLimits = [...thresholds, totalCount]
  let previousEnd = startingRank - 1

  return sectionLimits.map((limit) => {
    const startRank = previousEnd + 1
    const endRank = limit
    const sectionEntries = entries.slice(startRank - startingRank, endRank - startingRank + 1)
    previousEnd = limit

    return {
      title: `Top ${limit}`,
      startRank,
      endRank,
      entries: sectionEntries,
    }
  })
}
