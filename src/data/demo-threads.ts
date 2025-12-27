import { ForumsThread, ForumsPost } from '@/types';

/**
 * Demo thread data for hackathon presentation
 * Includes various edge cases and complexity levels for testing
 */

// Edge Case 1: Empty thread (no posts)
export const emptyThread: ForumsThread = {
  id: 'demo-empty-001',
  title: 'Welcome to the Forum!',
  body: 'This is a new discussion thread. Feel free to share your thoughts!',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  user: {
    id: 'user-001',
    username: 'moderator'
  }
};

export const emptyThreadPosts: ForumsPost[] = [];

// Edge Case 2: Single post thread
export const singlePostThread: ForumsThread = {
  id: 'demo-single-002',
  title: 'Quick Question About TypeScript',
  body: 'I\'m having trouble understanding generic constraints in TypeScript. Can someone explain the difference between `T extends string` and `T = string`?',
  createdAt: '2024-01-16T09:30:00Z',
  updatedAt: '2024-01-16T11:45:00Z',
  user: {
    id: 'user-002',
    username: 'typescript_newbie'
  }
};

export const singlePostThreadPosts: ForumsPost[] = [
  {
    id: 'post-001',
    body: 'Great question! `T extends string` means T must be a subtype of string (like string literals), while `T = string` sets a default type. The extends keyword creates a constraint, while = provides a default value when no type is specified.',
    threadId: 'demo-single-002',
    userId: 'user-003',
    createdAt: '2024-01-16T11:45:00Z',
    user: {
      username: 'ts_expert'
    }
  }
];

// Complex Case 1: Heated discussion with multiple viewpoints
export const heatedDiscussionThread: ForumsThread = {
  id: 'demo-heated-003',
  title: 'Should We Use Microservices or Monoliths?',
  body: 'Our team is debating architecture for our new project. Some want microservices for scalability, others prefer monoliths for simplicity. What are your thoughts on the trade-offs?',
  createdAt: '2024-01-17T14:00:00Z',
  updatedAt: '2024-01-17T18:30:00Z',
  user: {
    id: 'user-004',
    username: 'tech_lead_sarah'
  }
};

export const heatedDiscussionPosts: ForumsPost[] = [
  {
    id: 'post-002',
    body: 'Microservices are the way to go! They provide better scalability, fault isolation, and technology diversity. Each service can be developed and deployed independently.',
    threadId: 'demo-heated-003',
    userId: 'user-005',
    createdAt: '2024-01-17T14:15:00Z',
    user: {
      username: 'microservices_advocate'
    }
  },
  {
    id: 'post-003',
    body: 'I disagree. Microservices add unnecessary complexity for most projects. Network latency, distributed debugging, and data consistency become major headaches. Start with a monolith and split later if needed.',
    threadId: 'demo-heated-003',
    userId: 'user-006',
    createdAt: '2024-01-17T14:30:00Z',
    user: {
      username: 'monolith_defender'
    }
  },
  {
    id: 'post-004',
    body: '@monolith_defender You\'re stuck in the past! Modern orchestration tools like Kubernetes make microservices management trivial. The operational benefits far outweigh the complexity.',
    threadId: 'demo-heated-003',
    userId: 'user-005',
    createdAt: '2024-01-17T15:00:00Z',
    user: {
      username: 'microservices_advocate'
    }
  },
  {
    id: 'post-005',
    body: 'Both approaches have merit. The key is team size and domain complexity. Small teams (<10 devs) often struggle with microservices overhead. Large teams benefit from service boundaries.',
    threadId: 'demo-heated-003',
    userId: 'user-007',
    createdAt: '2024-01-17T15:30:00Z',
    user: {
      username: 'senior_architect'
    }
  },
  {
    id: 'post-006',
    body: '@microservices_advocate "Trivial"? Have you ever debugged a distributed transaction failure across 12 services at 3 AM? The cognitive load is real.',
    threadId: 'demo-heated-003',
    userId: 'user-006',
    createdAt: '2024-01-17T16:00:00Z',
    user: {
      username: 'monolith_defender'
    }
  },
  {
    id: 'post-007',
    body: 'Let\'s focus on the business requirements. What\'s the expected scale? Team structure? Deployment frequency? These factors should drive the decision, not ideology.',
    threadId: 'demo-heated-003',
    userId: 'user-008',
    createdAt: '2024-01-17T16:30:00Z',
    user: {
      username: 'pragmatic_pm'
    }
  },
  {
    id: 'post-008',
    body: 'Good point @pragmatic_pm. For our use case: 50k daily users, 5-person dev team, quarterly releases. Sounds like monolith-first approach makes sense.',
    threadId: 'demo-heated-003',
    userId: 'user-004',
    createdAt: '2024-01-17T17:00:00Z',
    user: {
      username: 'tech_lead_sarah'
    }
  },
  {
    id: 'post-009',
    body: 'Agreed. You can always extract services later when you hit specific scaling bottlenecks. Premature optimization is the root of all evil.',
    threadId: 'demo-heated-003',
    userId: 'user-007',
    createdAt: '2024-01-17T17:30:00Z',
    user: {
      username: 'senior_architect'
    }
  },
  {
    id: 'post-010',
    body: 'Fair enough. I still think you\'ll regret it when you need to scale individual components, but I understand the pragmatic approach for your team size.',
    threadId: 'demo-heated-003',
    userId: 'user-005',
    createdAt: '2024-01-17T18:00:00Z',
    user: {
      username: 'microservices_advocate'
    }
  },
  {
    id: 'post-011',
    body: 'Thanks everyone for the thoughtful discussion. We\'ll start with a modular monolith and keep service boundaries in mind for future extraction.',
    threadId: 'demo-heated-003',
    userId: 'user-004',
    createdAt: '2024-01-17T18:30:00Z',
    user: {
      username: 'tech_lead_sarah'
    }
  }
];

// Complex Case 2: Positive, constructive discussion
export const constructiveThread: ForumsThread = {
  id: 'demo-positive-004',
  title: 'Best Practices for Code Reviews',
  body: 'I\'d love to hear about your team\'s code review processes. What works well? What should we avoid? Looking to improve our review culture.',
  createdAt: '2024-01-18T10:00:00Z',
  updatedAt: '2024-01-18T16:45:00Z',
  user: {
    id: 'user-009',
    username: 'dev_manager_alex'
  }
};

export const constructivePosts: ForumsPost[] = [
  {
    id: 'post-012',
    body: 'We use a checklist approach: functionality, readability, performance, security, and tests. Each reviewer focuses on 1-2 areas to avoid cognitive overload.',
    threadId: 'demo-positive-004',
    userId: 'user-010',
    createdAt: '2024-01-18T10:30:00Z',
    user: {
      username: 'code_quality_guru'
    }
  },
  {
    id: 'post-013',
    body: 'Great approach! We also do "positive reviews" - explicitly calling out good patterns and clever solutions. It helps with knowledge sharing and team morale.',
    threadId: 'demo-positive-004',
    userId: 'user-011',
    createdAt: '2024-01-18T11:00:00Z',
    user: {
      username: 'team_builder'
    }
  },
  {
    id: 'post-014',
    body: 'Time-boxing is crucial. We limit reviews to 60 minutes max. Beyond that, schedule a pairing session instead of endless comment threads.',
    threadId: 'demo-positive-004',
    userId: 'user-012',
    createdAt: '2024-01-18T11:30:00Z',
    user: {
      username: 'efficiency_expert'
    }
  },
  {
    id: 'post-015',
    body: 'We use automated tools (linters, formatters, security scanners) to handle the mechanical stuff, so reviewers can focus on logic and design.',
    threadId: 'demo-positive-004',
    userId: 'user-013',
    createdAt: '2024-01-18T12:00:00Z',
    user: {
      username: 'automation_fan'
    }
  },
  {
    id: 'post-016',
    body: 'One thing that helped us: "Ask, don\'t tell" in review comments. "What do you think about extracting this into a helper function?" vs "Extract this into a helper function."',
    threadId: 'demo-positive-004',
    userId: 'user-014',
    createdAt: '2024-01-18T13:00:00Z',
    user: {
      username: 'communication_coach'
    }
  },
  {
    id: 'post-017',
    body: 'Excellent suggestions! @communication_coach that phrasing tip is gold. We\'ve also found that reviewing in-person (or video call) for complex changes builds better relationships.',
    threadId: 'demo-positive-004',
    userId: 'user-009',
    createdAt: '2024-01-18T14:00:00Z',
    user: {
      username: 'dev_manager_alex'
    }
  },
  {
    id: 'post-018',
    body: 'For junior developers, we pair them with seniors for their first few reviews. It\'s a great mentoring opportunity and helps them learn what to look for.',
    threadId: 'demo-positive-004',
    userId: 'user-015',
    createdAt: '2024-01-18T15:00:00Z',
    user: {
      username: 'mentor_mike'
    }
  },
  {
    id: 'post-019',
    body: 'We track review metrics (time to review, number of iterations) not for performance evaluation, but to identify process bottlenecks and improve flow.',
    threadId: 'demo-positive-004',
    userId: 'user-016',
    createdAt: '2024-01-18T16:00:00Z',
    user: {
      username: 'metrics_maven'
    }
  },
  {
    id: 'post-020',
    body: 'Thanks everyone! This gives me lots of ideas to try. I\'ll start with the checklist approach and positive feedback culture. Will report back on how it goes!',
    threadId: 'demo-positive-004',
    userId: 'user-009',
    createdAt: '2024-01-18T16:45:00Z',
    user: {
      username: 'dev_manager_alex'
    }
  }
];

// Complex Case 3: Mixed sentiment with technical depth
export const technicalThread: ForumsThread = {
  id: 'demo-technical-005',
  title: 'Performance Issues with Large React Lists',
  body: 'Our app is struggling with rendering 10k+ items in a list. We\'ve tried React.memo but still seeing lag. Any suggestions for optimization?',
  createdAt: '2024-01-19T09:00:00Z',
  updatedAt: '2024-01-19T17:20:00Z',
  user: {
    id: 'user-017',
    username: 'frontend_dev_jane'
  }
};

export const technicalPosts: ForumsPost[] = [
  {
    id: 'post-021',
    body: 'Have you tried virtualization? Libraries like react-window or react-virtualized only render visible items, dramatically improving performance for large lists.',
    threadId: 'demo-technical-005',
    userId: 'user-018',
    createdAt: '2024-01-19T09:30:00Z',
    user: {
      username: 'react_performance_pro'
    }
  },
  {
    id: 'post-022',
    body: 'Virtualization is good, but make sure your memo comparisons are actually working. Use React DevTools Profiler to see which components are re-rendering unnecessarily.',
    threadId: 'demo-technical-005',
    userId: 'user-019',
    createdAt: '2024-01-19T10:00:00Z',
    user: {
      username: 'debugging_detective'
    }
  },
  {
    id: 'post-023',
    body: 'Also consider pagination or infinite scrolling. 10k items at once is rarely good UX anyway. Users can\'t meaningfully process that much information.',
    threadId: 'demo-technical-005',
    userId: 'user-020',
    createdAt: '2024-01-19T11:00:00Z',
    user: {
      username: 'ux_advocate'
    }
  },
  {
    id: 'post-024',
    body: '@ux_advocate Unfortunately, it\'s a data analysis tool where users need to see all items for filtering and sorting. Pagination breaks the workflow.',
    threadId: 'demo-technical-005',
    userId: 'user-017',
    createdAt: '2024-01-19T12:00:00Z',
    user: {
      username: 'frontend_dev_jane'
    }
  },
  {
    id: 'post-025',
    body: 'In that case, definitely go with react-window. Also, move filtering/sorting to the server side if possible. Client-side operations on 10k items will always be slow.',
    threadId: 'demo-technical-005',
    userId: 'user-021',
    createdAt: '2024-01-19T13:00:00Z',
    user: {
      username: 'fullstack_optimizer'
    }
  },
  {
    id: 'post-026',
    body: 'One gotcha with react-window: if your items have dynamic heights, use VariableSizeList instead of FixedSizeList. It\'s slightly slower but handles content better.',
    threadId: 'demo-technical-005',
    userId: 'user-018',
    createdAt: '2024-01-19T14:00:00Z',
    user: {
      username: 'react_performance_pro'
    }
  },
  {
    id: 'post-027',
    body: 'We had similar issues. Web Workers for heavy computations + IndexedDB for client-side caching made a huge difference. Don\'t block the main thread!',
    threadId: 'demo-technical-005',
    userId: 'user-022',
    createdAt: '2024-01-19T15:00:00Z',
    user: {
      username: 'web_worker_wizard'
    }
  },
  {
    id: 'post-028',
    body: 'Update: Implemented react-window with server-side filtering. Performance is night and day! Thanks @react_performance_pro and @fullstack_optimizer for the guidance.',
    threadId: 'demo-technical-005',
    userId: 'user-017',
    createdAt: '2024-01-19T16:30:00Z',
    user: {
      username: 'frontend_dev_jane'
    }
  },
  {
    id: 'post-029',
    body: 'Glad it worked out! For others facing similar issues, I wrote a blog post about React performance patterns: [link]. Feel free to share experiences there too.',
    threadId: 'demo-technical-005',
    userId: 'user-018',
    createdAt: '2024-01-19T17:20:00Z',
    user: {
      username: 'react_performance_pro'
    }
  }
];

/**
 * Demo thread registry for easy access
 */
export const demoThreads = {
  empty: {
    thread: emptyThread,
    posts: emptyThreadPosts
  },
  single: {
    thread: singlePostThread,
    posts: singlePostThreadPosts
  },
  heated: {
    thread: heatedDiscussionThread,
    posts: heatedDiscussionPosts
  },
  constructive: {
    thread: constructiveThread,
    posts: constructivePosts
  },
  technical: {
    thread: technicalThread,
    posts: technicalPosts
  }
};

/**
 * Get all demo thread IDs for testing
 */
export const getDemoThreadIds = (): string[] => {
  return Object.values(demoThreads).map(demo => demo.thread.id);
};

/**
 * Get demo thread data by ID
 */
export const getDemoThreadData = (threadId: string): { thread: ForumsThread; posts: ForumsPost[] } | null => {
  const demo = Object.values(demoThreads).find(demo => demo.thread.id === threadId);
  return demo || null;
};