import * as fc from 'fast-check'
import { ForumsThread, ForumsPost, SummaryData, SentimentType } from '@/types'

// Property-based test generators for thread data
export const threadIdArbitrary = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim() !== '') // Ensure thread ID is not empty after trimming
export const usernameArbitrary = fc.string({ minLength: 1, maxLength: 30 })
export const timestampArbitrary = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }).map(d => {
  // Ensure valid date before converting to ISO string
  return isNaN(d.getTime()) ? new Date('2024-01-01T00:00:00.000Z').toISOString() : d.toISOString()
})

export const forumsThreadArbitrary: fc.Arbitrary<ForumsThread> = fc.record({
  id: threadIdArbitrary,
  title: fc.string({ minLength: 1, maxLength: 200 }),
  slug: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
  body: fc.string({ minLength: 1, maxLength: 5000 }),
  locked: fc.option(fc.boolean()),
  pinned: fc.option(fc.boolean()),
  createdAt: timestampArbitrary,
  updatedAt: timestampArbitrary,
  user: fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    username: usernameArbitrary,
    avatar: fc.option(fc.string({ minLength: 1, maxLength: 200 }))
  }),
  tags: fc.option(fc.array(fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
    color: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
    extendedData: fc.option(fc.object())
  }), { minLength: 0, maxLength: 5 }))
})

export const forumsPostArbitrary: fc.Arbitrary<ForumsPost> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  body: fc.string({ minLength: 1, maxLength: 2000 }),
  threadId: threadIdArbitrary,
  userId: fc.string({ minLength: 1, maxLength: 50 }),
  parentId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  bestAnswer: fc.option(fc.boolean()),
  likes: fc.option(fc.array(fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    userId: fc.string({ minLength: 1, maxLength: 50 })
  }), { minLength: 0, maxLength: 10 })),
  upvotes: fc.option(fc.array(fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    userId: fc.string({ minLength: 1, maxLength: 50 })
  }), { minLength: 0, maxLength: 10 })),
  extendedData: fc.option(fc.object()),
  instanceId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  createdAt: timestampArbitrary,
  updatedAt: fc.option(timestampArbitrary),
  user: fc.option(fc.record({
    username: usernameArbitrary,
    id: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
    avatar: fc.option(fc.string({ minLength: 1, maxLength: 200 }))
  }))
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