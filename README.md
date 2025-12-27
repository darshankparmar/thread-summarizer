# Thread Summarizer

AI-powered forum thread analysis tool for Foru.ms.

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key (for AI summarization)
- Foru.ms API key (demo mode also available)

### Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```

3. **Add your API keys to `.env.local`**
   ```bash
   # Required for AI summarization
   OPENAI_API_KEY=your_openai_key_here
   
   # Optional - if missing, demo mode auto-enables
   FORUMS_API_KEY=your_forums_key_here
   
   # Optional - force demo mode even with API key
   DEMO_MODE=true
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open http://localhost:3000**

### Demo Mode

Demo mode provides sample thread data for development and presentations:

- **Auto-enabled** when `FORUMS_API_KEY` is missing
- **Force-enabled** by setting `DEMO_MODE=true`
- **5 demo threads** covering edge cases and different scenarios
- **Simulated API latency** for realistic testing

### Available Demo Threads
- Empty thread (edge case testing)
- Single post thread (minimal content)
- Heated debate (sentiment analysis)
- Constructive discussion (healthy scoring)
- Technical problem-solving (complex analysis)

## Testing

```bash
npm test
```

## Stack

- Next.js 14 + TypeScript
- OpenAI API
- Jest + fast-check for testing

## Development Notes

- Following spec-driven development
- Property-based testing for correctness
- All AI processing server-side only