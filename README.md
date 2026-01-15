# SteppersLife Restaurants

Restaurant owner portal for the SteppersLife platform.

**Domain:** restaurants.stepperslife.com
**Port:** 3016
**Role:** Creator portal for restaurant owners

## Purpose

Restaurant owners use this portal to:
- Create and manage restaurant profiles
- Set up menu categories and items
- Process food orders
- Manage restaurant staff
- Handle seating and reservations
- Track reviews and ratings

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Convex (shared backend)
- Stripe + PayPal payments
- Tailwind CSS 4 + Radix UI

## Development

```bash
npm install
npm run dev          # http://localhost:3016
```

## Build & Deploy

```bash
npm run build:with-convex   # Build with Convex deploy
```

Deploy via Coolify, then purge Cloudflare cache.

## Testing

```bash
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:payment:all  # Payment tests
```

## Coolify UUID

`eckgswkw8os44gk8wgsogs40`

## Related

- Platform docs: `~/.claude/references/stepperslife-platform.md`
- Main aggregator: stepperslife-landing
