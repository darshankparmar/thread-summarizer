import { ForumsThread, ForumsPost, SummaryData } from '@/types'

// Mock thread data generators
export const createMockThread = (overrides: Partial<ForumsThread> = {}): ForumsThread => ({
  id: 'thread-123',
  title: 'Sample Discussion Thread',
  body: 'This is the main thread content discussing various topics.',
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T15:30:00Z',
  user: {
    id: 'user-1',
    username: 'threadstarter'
  },
  ...overrides
})

export const createMockPost = (overrides: Partial<ForumsPost> = {}): ForumsPost => ({
  id: 'post-456',
  body: 'This is a sample post response.',
  threadId: 'thread-123',
  userId: 'user-2',
  createdAt: '2024-01-01T11:00:00Z',
  user: {
    username: 'responder'
  },
  ...overrides
})

export const createMockSummaryData = (overrides: Partial<SummaryData> = {}): SummaryData => ({
  summary: [
    'Main discussion point about the topic',
    'Secondary point with additional context',
    'Conclusion or resolution reached'
  ],
  keyPoints: [
    'First unique viewpoint from the discussion',
    'Alternative perspective on the issue',
    'Compromise or middle-ground position'
  ],
  contributors: [
    { username: 'expert1', contribution: 'Provided technical insights' },
    { username: 'moderator', contribution: 'Facilitated productive discussion' }
  ],
  sentiment: 'Positive',
  healthScore: 8,
  healthLabel: 'Healthy',
  ...overrides
})

// Mock API responses
export const mockForumsApiResponse = {
  thread: createMockThread(),
  posts: [
    createMockPost({ id: 'post-1', userId: 'user-2', user: { username: 'alice' } }),
    createMockPost({ id: 'post-2', userId: 'user-3', user: { username: 'bob' } }),
    createMockPost({ id: 'post-3', userId: 'user-4', user: { username: 'charlie' } })
  ]
}

// Mock fetch responses
export const mockFetchSuccess = (data: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    })
  ) as jest.Mock
}

export const mockFetchError = (status: number = 500, message: string = 'Server Error') => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status,
      statusText: message,
      json: () => Promise.resolve({ error: message }),
    })
  ) as jest.Mock
}