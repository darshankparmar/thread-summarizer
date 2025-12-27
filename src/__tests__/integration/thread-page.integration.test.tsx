/**
 * Integration tests for thread page user flow
 * Tests complete flow from thread page load to summary display
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useParams } from 'next/navigation'
import '@testing-library/jest-dom'
import ThreadPage from '@/app/thread/[id]/page'
import { mockForumsApiResponse, createMockSummaryData } from '../utils/mock-data'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useParams: jest.fn(),
}))

// Mock window.history.back
Object.defineProperty(window, 'history', {
  value: {
    back: jest.fn(),
  },
  writable: true,
})

// Setup global fetch mock
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>
global.fetch = mockFetch

describe('Thread Page Integration Tests', () => {
  const mockThreadId = 'test-thread-123'

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
    mockFetch.mockReset()

    jest.mocked(useParams).mockReturnValue({ id: mockThreadId })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Complete User Flow - Thread Load to Summary Display', () => {
    test('should load thread data and display thread content', async () => {
      // Mock successful thread data fetch
      const mockThreadResponse = {
        success: true,
        thread: mockForumsApiResponse.thread,
        posts: mockForumsApiResponse.posts,
        fetchedAt: new Date().toISOString()
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockThreadResponse)
      } as Response)

      render(<ThreadPage />)

      // Wait for thread data to load
      await waitFor(() => {
        expect(screen.getByText(mockForumsApiResponse.thread.title)).toBeInTheDocument()
      })

      // Verify thread content is displayed
      expect(screen.getByText(mockForumsApiResponse.thread.body)).toBeInTheDocument()
      expect(screen.getAllByText((content, element) => {
        return element?.textContent?.includes(`@${mockForumsApiResponse.thread.user.username}`) || false
      })[0]).toBeInTheDocument()
      expect(screen.getByText('3 replies')).toBeInTheDocument()

      // Verify posts are displayed - use getAllByText for multiple elements
      const replyElements = screen.getAllByText(/Reply #[123]/)
      expect(replyElements).toHaveLength(3)

      // Check for usernames in posts
      expect(screen.getAllByText((content, element) => {
        return element?.textContent?.includes('@alice') || false
      })[0]).toBeInTheDocument()
      expect(screen.getAllByText((content, element) => {
        return element?.textContent?.includes('@bob') || false
      })[0]).toBeInTheDocument()
      expect(screen.getAllByText((content, element) => {
        return element?.textContent?.includes('@charlie') || false
      })[0]).toBeInTheDocument()

      // Verify summary panel is present
      expect(screen.getByText('AI Thread Summary')).toBeInTheDocument()
      const generateButton = screen.getByRole('button', { name: 'Generate Summary' })
      expect(generateButton).toBeInTheDocument()

      // Verify API call was made correctly
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(`/api/thread/${mockThreadId}`, expect.any(Object))
    })

    test('should load thread data and allow summary generation', async () => {
      // Mock successful thread data fetch
      const mockThreadResponse = {
        success: true,
        thread: mockForumsApiResponse.thread,
        posts: mockForumsApiResponse.posts,
        fetchedAt: new Date().toISOString()
      }

      const mockSummaryResponse = {
        success: true,
        data: createMockSummaryData(),
        cached: false,
        generatedAt: new Date().toISOString()
      }

      // Setup fetch mock to handle both thread and summary requests
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockThreadResponse)
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSummaryResponse)
        } as Response)

      render(<ThreadPage />)

      // Wait for thread data to load
      await waitFor(() => {
        expect(screen.getByText(mockForumsApiResponse.thread.title)).toBeInTheDocument()
      })

      // Click generate summary button
      const generateButton = screen.getByRole('button', { name: 'Generate Summary' })
      fireEvent.click(generateButton)

      // Wait for summary to be generated and displayed
      await waitFor(() => {
        expect(screen.getAllByText((content, element) => {
          return element?.textContent?.includes(mockSummaryResponse.data.summary[0]) || false
        })[0]).toBeInTheDocument()
      }, { timeout: 5000 })

      // Verify summary data is displayed
      expect(screen.getByText('😊')).toBeInTheDocument()
      expect(screen.getByText('Positive')).toBeInTheDocument()
      expect(screen.getAllByText((content, element) => {
        return element?.textContent?.includes('8/10') || false
      })[0]).toBeInTheDocument()
      expect(screen.getAllByText((content, element) => {
        return element?.textContent?.includes('Healthy') || false
      })[0]).toBeInTheDocument()
      expect(screen.getByText('@expert1 – Provided technical insights')).toBeInTheDocument()

      // Verify API calls were made correctly
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenNthCalledWith(1, `/api/thread/${mockThreadId}`, expect.any(Object))
      expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/summarize', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: mockThreadId })
      }))
    })
  })

  describe('Error Handling and Performance', () => {
    test('should handle thread loading errors gracefully', async () => {
      // Mock thread fetch failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Thread not found' })
      } as Response)

      render(<ThreadPage />)

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Error Loading Thread')).toBeInTheDocument()
      })

      expect(screen.getByText('Thread not found. Please check the thread ID.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument()
    })

    test('should complete initial thread load within reasonable time', async () => {
      const mockThreadResponse = {
        success: true,
        thread: mockForumsApiResponse.thread,
        posts: mockForumsApiResponse.posts,
        fetchedAt: new Date().toISOString()
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockThreadResponse)
      } as Response)

      const startTime = Date.now()
      render(<ThreadPage />)

      await waitFor(() => {
        expect(screen.getByText(mockForumsApiResponse.thread.title)).toBeInTheDocument()
      })

      const loadTime = Date.now() - startTime
      // Should load within reasonable time (allowing for test environment overhead)
      expect(loadTime).toBeLessThan(5000) // 5 seconds for test environment
    })

    test('should handle empty threads appropriately', async () => {
      const mockEmptyThreadResponse = {
        success: true,
        thread: mockForumsApiResponse.thread,
        posts: [], // No posts
        fetchedAt: new Date().toISOString()
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmptyThreadResponse)
      } as Response)

      render(<ThreadPage />)

      await waitFor(() => {
        expect(screen.getByText(mockForumsApiResponse.thread.title)).toBeInTheDocument()
      })

      expect(screen.getByText('0 replies')).toBeInTheDocument()
      expect(screen.getByText('No replies yet. Be the first to respond!')).toBeInTheDocument()

      // Summary panel should still be available
      expect(screen.getByText('AI Thread Summary')).toBeInTheDocument()
    })
  })

  describe('Cache Performance Integration', () => {
    test('should handle cached summary responses', async () => {
      const mockThreadResponse = {
        success: true,
        thread: mockForumsApiResponse.thread,
        posts: mockForumsApiResponse.posts,
        fetchedAt: new Date().toISOString()
      }

      const mockCachedSummaryResponse = {
        success: true,
        data: createMockSummaryData(),
        cached: true, // Indicates cached response
        generatedAt: new Date(Date.now() - 60000).toISOString() // 1 minute ago
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockThreadResponse)
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCachedSummaryResponse)
        } as Response)

      render(<ThreadPage />)

      // Wait for thread to load
      await waitFor(() => {
        expect(screen.getByText(mockForumsApiResponse.thread.title)).toBeInTheDocument()
      })

      // Click generate summary
      const generateButton = screen.getByRole('button', { name: 'Generate Summary' })
      fireEvent.click(generateButton)

      // For cached responses, summary should appear
      await waitFor(() => {
        expect(screen.getAllByText((content, element) => {
          return element?.textContent?.includes(mockCachedSummaryResponse.data.summary[0]) || false
        })[0]).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(screen.getByText('😊')).toBeInTheDocument()
      expect(screen.getByText('Positive')).toBeInTheDocument()
    })
  })
})