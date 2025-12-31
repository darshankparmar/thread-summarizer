<a id="top"></a>
# Thread Summarizer

*Transform Conversations into Clear, Actionable Insights*

## Project Overview

Thread Summarizer is a full-stack web application that analyzes online forum discussions to generate concise, structured summaries. It integrates with the Foru.ms API to retrieve thread data and leverages OpenAI’s structured output capabilities to extract key themes, highlight contributor perspectives and  assess overall discussion quality. Designed for developers and researchers, the system streamlines large-scale thread analysis while maintaining clarity, accuracy and  contextual relevance.

## Features

### Core Functionality

* **AI-Powered Summarization**: Generates structured summaries including key points, sentiment analysis and  discussion health scoring
* **Thread Management**: Full CRUD support for threads and posts
* **User Authentication**: Secure authentication and session management using NextAuth.js
* **Advanced Search**: Filter threads by tags, author, date and  engagement metrics
* **Responsive Design**: Mobile-optimized interface with light and dark theme support

### User Interface

* Thread listing with pagination and advanced sorting
* Rich-text editor for thread and post creation
* Robust error handling and clear loading states

### Security & Performance

* Server-side AI processing with strict input validation
* Response caching with a 24-hour TTL
* Rate limiting and CSRF protection

## Tech Stack

### Frontend

* **Next.js 16** – React framework with App Router
* **TypeScript** – Type-safe development
* **Tailwind CSS** – Utility-first styling
* **ShadCN UI** – Component library
* **Lucide React** – Icon library

### Backend

* **Next.js API Routes** – Server-side endpoints
* **NextAuth.js** – Authentication framework
* **OpenAI API** – AI summarization service
* **Foru.ms API** – Forum data integration

### Development

* **Jest** – Unit testing framework
* **Fast-Check** – Property-based testing
* **ESLint** – Code linting
* **React Testing Library** – Component testing

## Installation

### Prerequisites

* Node.js 18+
* npm
* OpenAI API key
* Foru.ms API access

### Setup

```bash
# Clone repository
git clone https://github.com/darshankparmar/thread-summarizer.git

cd thread-summarizer

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

### Environment Variables

```bash
FORUMS_API_URL=https://foru.ms
FORUMS_API_KEY=your_forums_api_key
OPENAI_API_KEY=your_openai_api_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## Usage

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run test suite
npm run type-check   # TypeScript validation
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
├── contexts/               # React contexts (theme, auth)
├── domains/                # Domain-specific logic
│   ├── ai/                 # AI service and types
│   ├── auth/               # Authentication logic
│   └── threads/            # Thread management
├── hooks/                  # Custom React hooks
├── infrastructure/         # Cross-cutting concerns
│   ├── cache/              # Caching layer
│   ├── monitoring/         # Performance monitoring
│   └── security/           # Security middleware
├── services/               # External API integrations
└── shared/                 # Shared utilities and types
```

## Future Improvements

### AI & Intelligence Enhancements

* **Advanced Summarization Modes** – Support multiple summary styles such as TL;DR, executive overview, technical breakdown, and decision-focused summaries.
* **Context-Aware Thread Understanding** – Improve summarization accuracy by identifying key arguments, consensus points, and unresolved questions within long discussions.
* **Multi-Model Support** – Enable flexible switching between different LLM providers (OpenAI, open-source models, or self-hosted inference) based on cost, performance, or privacy needs.
* **Incremental Summarization** – Update summaries dynamically as new posts are added instead of reprocessing entire threads.

### Platform & Feature Expansion

* **Engagement Signals** – Introduce reactions, voting, and engagement metrics to improve content ranking and insight extraction.
* **Real-Time Updates** – WebSocket-based live thread updates and streaming summaries.
* **User Preferences & Customization** – Allow users to control summary length, tone, and formatting.
* **Moderation & Insights** – Surface moderation signals, sentiment trends, and conversation health indicators for community managers.

### Performance & Scalability

* **Advanced Caching and Batching** – Reduce latency and compute cost for large or frequently updated threads.
* **Scalable Processing Pipelines** – Prepare the system for high-volume communities and enterprise-scale usage.
* **Monitoring & Observability** – Add structured logging, tracing, and performance metrics.

### Ecosystem & Integration

* **Deeper Foru.ms Integration** – Expand beyond summaries into analytics dashboards, moderation tooling, and content discovery.
* **API-First Extensions** – Enable external tools and products to consume summarized thread data.
* **PWA & Offline Support** – Improve accessibility with offline viewing and installable experiences.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="right"><a href="#top">⬆ Return to top</a></p>