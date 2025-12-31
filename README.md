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

### Planned Features

* **Polling System**: Create and vote on polls within threads
* **Real-time Notifications**: Live updates for replies and mentions
* **Private Messaging**: User-to-user messaging system
* **Admin Dashboard**: Content moderation and user management tools
* **Advanced Engagement**: Likes, upvotes and  interaction metrics
* **WebSocket Integration**: Real-time thread updates
* **PWA Support**: Offline access and installable experience
* **User Following**: Activity feeds and follower relationships
* **Reporting System**: Content moderation and reporting workflows

### Technical Enhancements

* End-to-end testing with Playwright
* Advanced caching strategies
* CI/CD pipeline implementation
* Performance optimization and monitoring

## License

MIT License - see [LICENSE](LICENSE) for details.

[⬆ Return](#top)