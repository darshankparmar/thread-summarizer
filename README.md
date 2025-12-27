# Thread Summarizer

AI-powered forum thread analysis tool for Foru.ms.

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key (for AI summarization)
- Foru.ms API key (required for live data)

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
   
   # Required for accessing Foru.ms API
   FORUMS_API_KEY=your_forums_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open http://localhost:3000**

The landing page will load available threads from Foru.ms automatically.

## Testing

```bash
npm test
```

## Stack

- Next.js 14 + TypeScript
- OpenAI API
- Foru.ms API integration
- Jest + fast-check for testing

## Development Notes

- Following spec-driven development
- Property-based testing for correctness
- All AI processing server-side only
- Real-time thread data from Foru.ms