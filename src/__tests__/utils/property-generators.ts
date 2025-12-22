import * as fc from 'fast-check'
import { ForumsThread, ForumsPost, SummaryData, SentimentType } from '@/types'

// Property-based test generators for thread data
export const threadIdArbitrary = fc.string({ minLength: 1, maxLength: 50 })
export const usernameArbitrary = fc.string({ minLength: 1, maxLength: 30 })
export const timestampArbitrary = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }).map(d => {
  // Ensure valid date before converting to ISO string
  return isNaN(d.getTime()) ? new Date('2024-01-01T00:00:00.000Z').toISOString() : d.toISOString()
})

export const forumsThreadArbitrary: fc.Arbitrary<ForumsThread> = fc.record({
  id: threadIdArbitrary,
  title: fc.string({ minLength: 1, maxLength: 200 }),
  body: fc.string({ minLength: 1, maxLength: 5000 }),
  createdAt: timestampArbitrary,
  updatedAt: timestampArbitrary,
  user: fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    username: usernameArbitrary
  })
})

export const forumsPostArbitrary: fc.Arbitrary<ForumsPost> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  body: fc.string({ minLength: 1, maxLength: 2000 }),
  threadId: threadIdArbitrary,
  userId: fc.string({ minLength: 1, maxLength: 50 }),
  createdAt: timestampArbitrary,
  user: fc.record({
    username: usernameArbitrary
  })
})

export const sentimentArbitrary: fc.Arbitrary<SentimentType> = fc.constantFrom(
  'Positive', 'Neutral', 'Mixed', 'Negative'
)

export const summaryDataArbitrary: fc.Arbitrary<SummaryData> = fc.record({
  summary: fc.array(fc.string({ minLength: 1, maxLength: 200 }), { minLength: 1, maxLength: 5 }),
  keyPoints: fc.array(fc.string({ minLength: 1, maxLength: 200 }), { minLength: 3, maxLength: 5 }),
  contributors: fc.array(
    fc.record({
      username: usernameArbitrary,
      contribution: fc.string({ minLength: 1, maxLength: 100 })
    }),
    { minLength: 2, maxLength: 4 }
  ),
  sentiment: sentimentArbitrary,
  healthScore: fc.integer({ min: 1, max: 10 }),
  healthLabel: fc.constantFrom('Healthy', 'Needs Attention', 'Heated Discussion')
})

// Generator for thread with posts
export const threadWithPostsArbitrary = fc.record({
  thread: forumsThreadArbitrary,
  posts: fc.array(forumsPostArbitrary, { minLength: 0, maxLength: 50 })
})

// Cache key generator
export const cacheKeyArbitrary = fc.record({
  threadId: threadIdArbitrary,
  lastPostTimestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }).map(String)
}).map(({ threadId, lastPostTimestamp }) => ({
  pattern: `summary_${threadId}_${lastPostTimestamp}` as const,
  threadId,
  lastPostTimestamp
}))