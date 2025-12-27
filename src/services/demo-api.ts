import { ForumsThread, ForumsPost } from '@/types';
import { demoThreads, getDemoThreadData } from '@/data/demo-threads';

/**
 * Demo API service for hackathon presentation
 * Provides fallback data when Foru.ms API is unavailable
 */
export class DemoApiService {
  private static instance: DemoApiService;
  private isEnabled: boolean;

  private constructor() {
    // Enable demo mode if environment variable is set or if API key is missing
    this.isEnabled = process.env.DEMO_MODE === 'true' || !process.env.FORUMS_API_KEY;
  }

  public static getInstance(): DemoApiService {
    if (!DemoApiService.instance) {
      DemoApiService.instance = new DemoApiService();
    }
    return DemoApiService.instance;
  }

  /**
   * Check if demo mode is enabled
   */
  public isDemoMode(): boolean {
    return this.isEnabled;
  }

  /**
   * Enable demo mode (useful for testing)
   */
  public enableDemoMode(): void {
    this.isEnabled = true;
  }

  /**
   * Disable demo mode
   */
  public disableDemoMode(): void {
    this.isEnabled = false;
  }

  /**
   * Fetch thread data from demo data
   * Simulates API latency for realistic testing
   */
  public async fetchThread(threadId: string): Promise<ForumsThread> {
    if (!this.isEnabled) {
      throw new Error('Demo mode is not enabled');
    }

    // Simulate API latency (50-200ms)
    await this.simulateLatency(50, 200);

    const demoData = getDemoThreadData(threadId);
    if (!demoData) {
      throw new Error(`Demo thread with ID ${threadId} not found`);
    }

    return demoData.thread;
  }

  /**
   * Fetch thread posts from demo data
   * Simulates API latency for realistic testing
   */
  public async fetchThreadPosts(threadId: string): Promise<ForumsPost[]> {
    if (!this.isEnabled) {
      throw new Error('Demo mode is not enabled');
    }

    // Simulate API latency (100-300ms for posts)
    await this.simulateLatency(100, 300);

    const demoData = getDemoThreadData(threadId);
    if (!demoData) {
      throw new Error(`Demo posts for thread ${threadId} not found`);
    }

    return demoData.posts;
  }

  /**
   * Fetch complete thread data (thread + posts)
   */
  public async fetchCompleteThread(threadId: string): Promise<{thread: ForumsThread, posts: ForumsPost[]}> {
    if (!this.isEnabled) {
      throw new Error('Demo mode is not enabled');
    }

    // Simulate concurrent API calls with realistic latency
    const [thread, posts] = await Promise.all([
      this.fetchThread(threadId),
      this.fetchThreadPosts(threadId)
    ]);

    return { thread, posts };
  }

  /**
   * Get all available demo thread IDs
   */
  public getAvailableThreadIds(): string[] {
    if (!this.isEnabled) {
      return [];
    }

    return Object.values(demoThreads).map(demo => demo.thread.id);
  }

  /**
   * Get demo thread metadata for presentation
   */
  public getDemoThreadMetadata(): Array<{
    id: string;
    title: string;
    description: string;
    category: 'edge-case' | 'heated' | 'constructive' | 'technical';
    postCount: number;
  }> {
    if (!this.isEnabled) {
      return [];
    }

    return [
      {
        id: demoThreads.empty.thread.id,
        title: demoThreads.empty.thread.title,
        description: 'Empty thread with no posts - tests fallback handling',
        category: 'edge-case',
        postCount: demoThreads.empty.posts.length
      },
      {
        id: demoThreads.single.thread.id,
        title: demoThreads.single.thread.title,
        description: 'Single post thread - tests minimal content handling',
        category: 'edge-case',
        postCount: demoThreads.single.posts.length
      },
      {
        id: demoThreads.heated.thread.id,
        title: demoThreads.heated.thread.title,
        description: 'Heated debate with opposing viewpoints - tests sentiment analysis',
        category: 'heated',
        postCount: demoThreads.heated.posts.length
      },
      {
        id: demoThreads.constructive.thread.id,
        title: demoThreads.constructive.thread.title,
        description: 'Positive, collaborative discussion - tests healthy thread scoring',
        category: 'constructive',
        postCount: demoThreads.constructive.posts.length
      },
      {
        id: demoThreads.technical.thread.id,
        title: demoThreads.technical.thread.title,
        description: 'Technical problem-solving discussion - tests complex analysis',
        category: 'technical',
        postCount: demoThreads.technical.posts.length
      }
    ];
  }

  /**
   * Simulate API latency for realistic demo experience
   */
  private async simulateLatency(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

/**
 * Default export - singleton instance
 */
export const demoApiService = DemoApiService.getInstance();