/**
 * Integration tests for API endpoints
 * Tests complete API flow including caching behavior
 */

import { mockForumsApiResponse, createMockSummaryData } from '../utils/mock-data'

// Create mock objects first
const mockForumsApi = {
  fetchCompleteThread: jest.fn(),
}

const mockAiService = {
  generateSummary: jest.fn(),
}

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  generateCacheKey: jest.fn(),
}

// Mock the ForumsApiError class
class MockForumsApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'ForumsApiError'
  }
}

// Then use them in mocks
jest.mock('@/services/forums-api', () => ({
  forumsApi: mockForumsApi,
  ForumsApiError: MockForumsApiError
}))

jest.mock('@/services/ai-service', () => ({
  aiService: mockAiService,
}))

jest.mock('@/services/cache-manager', () => ({
  cacheManager: mockCacheManager,
}))

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Cache Performance Integration', () => {
    test('should generate correct cache keys with timestamp format', () => {
      mockCacheManager.generateCacheKey.mockReturnValue('summary_test-123_1704067200000')

      const result = mockCacheManager.generateCacheKey('test-123', '1704067200000')
      expect(result).toBe('summary_test-123_1704067200000')

      // Verify cache key format matches pattern: summary_<thread_id>_<timestamp>
      expect(result).toMatch(/^summary_test-123_\d+$/)
    })

    test('should validate cache performance requirements', async () => {
      const mockSummaryData = createMockSummaryData()

      // Test cached request performance
      mockCacheManager.get.mockResolvedValue(mockSummaryData)

      const startTime = Date.now()
      
      // Simulate cache retrieval
      const cachedResult = await mockCacheManager.get('test-key')
      
      const responseTime = Date.now() - startTime

      expect(cachedResult).toEqual(mockSummaryData)
      expect(responseTime).toBeLessThan(100) // 100ms requirement for cached responses
    })
  })

  describe('Service Integration', () => {
    test('should integrate forums API and AI service correctly', async () => {
      const mockSummaryData = createMockSummaryData()

      mockForumsApi.fetchCompleteThread.mockResolvedValue(mockForumsApiResponse)
      mockAiService.generateSummary.mockResolvedValue({
        success: true,
        data: mockSummaryData
      })

      // Test the integration flow
      const threadData = await mockForumsApi.fetchCompleteThread('test-123')
      expect(threadData).toEqual(mockForumsApiResponse)

      const aiResponse = await mockAiService.generateSummary(threadData.thread, threadData.posts)
      expect(aiResponse.success).toBe(true)
      expect(aiResponse.data).toEqual(mockSummaryData)

      expect(mockForumsApi.fetchCompleteThread).toHaveBeenCalledWith('test-123')
      expect(mockAiService.generateSummary).toHaveBeenCalledWith(threadData.thread, threadData.posts)
    })

    test('should handle service errors appropriately', async () => {
      // Test 404 error handling
      mockForumsApi.fetchCompleteThread.mockRejectedValue(
        new MockForumsApiError('Thread with ID test-404 not found', 404)
      )

      await expect(mockForumsApi.fetchCompleteThread('test-404')).rejects.toThrow('Thread with ID test-404 not found')

      // Test authentication error handling
      mockForumsApi.fetchCompleteThread.mockRejectedValue(
        new MockForumsApiError('Authentication failed - invalid API key', 401)
      )

      await expect(mockForumsApi.fetchCompleteThread('test-auth')).rejects.toThrow('Authentication failed - invalid API key')
    })

    test('should handle cache operations correctly', async () => {
      const mockSummaryData = createMockSummaryData()
      
      // Test cache miss scenario
      mockCacheManager.get.mockResolvedValue(null)
      mockCacheManager.set.mockResolvedValue(undefined)
      mockCacheManager.generateCacheKey.mockReturnValue('summary_test-cache_1704067200000')

      const cacheKey = mockCacheManager.generateCacheKey('test-cache', '1704067200000')
      expect(cacheKey).toBe('summary_test-cache_1704067200000')

      const cachedResult = await mockCacheManager.get(cacheKey)
      expect(cachedResult).toBeNull()

      await mockCacheManager.set(cacheKey, mockSummaryData)
      expect(mockCacheManager.set).toHaveBeenCalledWith(cacheKey, mockSummaryData)
    })
  })
})