# Thread Summarizer

AI-powered forum thread analysis tool for Foru.ms.

## Setup

```bash
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

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