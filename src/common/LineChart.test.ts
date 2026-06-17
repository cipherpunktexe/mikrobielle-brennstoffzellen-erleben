import { describe, expect, test } from 'vitest'
import { getSampledChartIndexes } from './LineChart'

describe('LineChart sampling', () => {
  test('keeps every index when the data fits the maximum', () => {
    expect(getSampledChartIndexes(4, 6)).toEqual([0, 1, 2, 3])
  })

  test('samples large datasets evenly with first and last index', () => {
    expect(getSampledChartIndexes(10, 4)).toEqual([0, 3, 6, 9])
    expect(getSampledChartIndexes(101, 5)).toEqual([0, 25, 50, 75, 100])
  })

  test('uses the last index when only one sample is allowed', () => {
    expect(getSampledChartIndexes(10, 1)).toEqual([9])
  })

  test('returns no indexes for empty data or invalid limits', () => {
    expect(getSampledChartIndexes(0, 4)).toEqual([])
    expect(getSampledChartIndexes(4, 0)).toEqual([])
  })
})
