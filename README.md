# Claude Interface

A self-hosted, full-stack Claude chat interface built with React, Express, and PostgreSQL. Bring your own Anthropic API key and get a clean, private chat experience with conversation history, file attachments, and markdown rendering — all running on your own infrastructure.

![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Express](https://img.shields.io/badge/Express-5-lightgrey)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-required-336791)

---

## Features

- **Bring your own API key** — your Anthropic key is sent directly from the client and never persisted on the server
- **Conversation history** — all chats stored in PostgreSQL with animated title generation
- **File attachments** — upload images (PNG, JPEG, GIF, WebP) and text files (`.txt`, `.md`, `.json`, `.csv`, `.ts`, `.py`, `.sql`, and more); paste images directly from clipboard
- **Markdown rendering** — code blocks with syntax highlighting and one-click copy
- **Auto-continuation** — responses that hit the token limit are automatically continued and stitched together
- **Dark / light / system theme** — persisted per browser
- **Model selection** — switch between Claude Sonnet 4, Opus 4, Sonnet 3.7, Haiku 3.5, and more
- **Responsive** — full mobile sidebar support
- **Rate limiting** — 30 requests/minute on the chat endpoint
- **App secret auth** — optional `APP_SECRET` bearer token to lock down all API routes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Routing | wouter |
| Server state | TanStack React Query |
| Backend | Express 5, Node.js, TypeScript (tsx) |
| Database | PostgreSQL, Drizzle ORM |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) |
| Animations | Framer Motion |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Clone and install

```bash
git clone <repo-url>
cd Claude-Interface
npm install
```

### 2. Configure environment

Copy the example and fill in your values:

```bash
cp .env.example .env
```

```env
# Required — PostgreSQL connection string
DATABASE_URL=postgresql://localhost:5432/claude_interface

# Optional — set a strong random value to protect all API routes in production
# Leave blank to disable auth (fine for local dev)
APP_SECRET=
```

Generate a secure `APP_SECRET`:

```bash
openssl rand -hex 32
```

### 3. Push the database schema

```bash
npm run db:push
```

### 4. Start the dev server

```bash
npm run dev
```

The app runs at `http://localhost:5000`.

### 5. Set your API key

Open the app, click the gear icon in the sidebar, and enter:

- **Anthropic API Key** — your `sk-ant-...` key (stored in `localStorage`, never on the server)
- **App Secret** — must match `APP_SECRET` in your `.env` if you set one

---

## Project Structure

```
├── client/              # React SPA
│   └── src/
│       ├── components/  # UI components (Sidebar, ChatInput, MessageList, …)
│       ├── hooks/       # React Query hooks (use-chat, use-toast, …)
│       ├── lib/         # Utilities, query client, animation queue, models
│       └── pages/       # Home and Chat page routes
├── server/              # Express API server
│   ├── index.ts         # App entry point, middleware, auth
│   ├── routes.ts        # API route handlers
│   ├── storage.ts       # Database abstraction layer
│   └── conversation-title.ts  # AI title generation
├── shared/              # Shared between client and server
│   ├── schema.ts        # Drizzle DB schema + Zod types
│   ├── routes.ts        # API route definitions + Zod schemas
│   └── models.ts        # Claude model list (single source of truth)
└── script/              # Build and backfill scripts
```

---

## API Routes

All routes are prefixed with `/api` and require the `Authorization: Bearer <APP_SECRET>` header when `APP_SECRET` is set.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/conversations` | List all conversations |
| `POST` | `/api/conversations` | Create a new conversation |
| `GET` | `/api/conversations/:id` | Get conversation with messages |
| `DELETE` | `/api/conversations/:id` | Delete a conversation |
| `GET` | `/api/conversations/:id/messages` | List messages |
| `POST` | `/api/conversations/:id/messages` | Create a message (validated) |
| `POST` | `/api/chat` | Send a message and get an AI response (rate limited) |

The `/api/chat` endpoint reads the Anthropic API key from the `X-Api-Key` header — it is never part of the request body.

---

## Scripts

```bash
npm run dev          # Start development server with HMR
npm run build        # Build client + bundle server for production
npm run start        # Run production build
npm run check        # TypeScript type check
npm run db:push      # Push schema changes to the database
```

---

## Security

- **API key isolation** — the Anthropic key travels as an HTTP header (`X-Api-Key`), never in the request/response body or server logs
- **Bearer token auth** — set `APP_SECRET` in `.env` to require authentication on all API routes
- **Input validation** — all request bodies validated with Zod; no mass assignment
- **Rate limiting** — chat endpoint capped at 30 req/min per IP via `express-rate-limit`
- **Model allowlist** — only known Claude model IDs are forwarded to the Anthropic API
- **Attachment validation** — image media types validated server-side before forwarding
- **Error sanitisation** — internal errors are not leaked to the client; 500s return a generic message

---

## Production Deployment

```bash
npm run build
NODE_ENV=production APP_SECRET=<secret> DATABASE_URL=<url> npm run start
```

The server listens on `0.0.0.0` in production and `127.0.0.1` in development. Port defaults to `5000`, overridable via the `PORT` env var.

---

## License

MIT
