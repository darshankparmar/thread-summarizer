import { createMockThread, createMockSummaryData } from './utils/mock-data'
import { forumsThreadArbitrary, summaryDataArbitrary } from './utils/property-generators'
import * as fc from 'fast-check'

describe('Test Setup Verification', () => {
  describe('Mock Data Utilities', () => {
    it('should create valid mock thread data', () => {
      const thread = createMockThread()
      
      expect(thread).toHaveProperty('id')
      expect(thread).toHaveProperty('title')
      expect(thread).toHaveProperty('body')
      expect(thread).toHaveProperty('user.username')
      expect(typeof thread.id).toBe('string')
      expect(typeof thread.title).toBe('string')
    })

    it('should create valid mock summary data', () => {
      const summary = createMockSummaryData()
      
      expect(Array.isArray(summary.summary)).toBe(true)
      expect(Array.isArray(summary.keyPoints)).toBe(true)
      expect(Array.isArray(summary.contributors)).toBe(true)
      expect(['Positive', 'Neutral', 'Mixed', 'Negative']).toContain(summary.sentiment)
      expect(summary.healthScore).toBeGreaterThanOrEqual(1)
      expect(summary.healthScore).toBeLessThanOrEqual(10)
    })
  })

  describe('Property-Based Test Generators', () => {
    it('should generate valid thread data', () => {
      fc.assert(
        fc.property(forumsThreadArbitrary, (thread) => {
          expect(thread.id).toBeTruthy()
          expect(thread.title).toBeTruthy()
          expect(thread.body).toBeTruthy()
          expect(thread.user.username).toBeTruthy()
          expect(new Date(thread.createdAt)).toBeInstanceOf(Date)
        }),
        { numRuns: 10 }
      )
    })

    it('should generate valid summary data', () => {
      fc.assert(
        fc.property(summaryDataArbitrary, (summary) => {
          expect(summary.summary.length).toBeGreaterThan(0)
          expect(summary.summary.length).toBeLessThanOrEqual(5)
          expect(summary.keyPoints.length).toBeGreaterThanOrEqual(3)
          expect(summary.keyPoints.length).toBeLessThanOrEqual(5)
          expect(summary.contributors.length).toBeGreaterThanOrEqual(2)
          expect(summary.contributors.length).toBeLessThanOrEqual(4)
          expect(summary.healthScore).toBeGreaterThanOrEqual(1)
          expect(summary.healthScore).toBeLessThanOrEqual(10)
        }),
        { numRuns: 10 }
      )
    })
  })
})