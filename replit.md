# Overview

This is an AI chat application inspired by Claude's interface. It's a full-stack TypeScript project where users can have conversations with Anthropic's Claude AI model. Users provide their own Anthropic API key (stored in browser localStorage), create conversations, send messages with optional file attachments, and receive AI-generated responses. The app features a sidebar with conversation history, a welcome screen with prompt suggestions, and markdown rendering for AI responses.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Overall Structure

The project follows a monorepo pattern with three main directories:

- **`client/`** — React single-page application (frontend)
- **`server/`** — Express.js API server (backend)
- **`shared/`** — Shared TypeScript types, schemas, and route definitions used by both client and server

## Frontend Architecture

- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: `wouter` (lightweight client-side router) with two main routes: Home (`/`) and Chat (`/chat/:id`)
- **State Management**: TanStack React Query for server state (fetching conversations, messages, mutations)
- **UI Components**: shadcn/ui component library (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with CSS variables for theming (warm, paper-like palette inspired by Claude's design). Custom fonts: DM Sans, Merriweather, JetBrains Mono
- **Key Libraries**: react-markdown (rendering AI responses), framer-motion (animations), react-textarea-autosize (chat input), date-fns (date formatting), lucide-react (icons)
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

## Backend Architecture

- **Framework**: Express.js running on Node.js with TypeScript (executed via `tsx`)
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **AI Integration**: Anthropic SDK (`@anthropic-ai/sdk`) used server-side to call Claude. The user's API key is passed from the client per request
- **Development**: Vite dev server middleware handles HMR and serves the frontend in development mode
- **Production**: Client is built to `dist/public/`, server is bundled with esbuild to `dist/index.cjs`

## API Routes

Defined in `shared/routes.ts` with Zod schemas for validation:

- `GET /api/conversations` — List all conversations
- `POST /api/conversations` — Create a new conversation
- `GET /api/conversations/:id` — Get conversation with messages
- `DELETE /api/conversations/:id` — Delete a conversation
- `POST /api/conversations/:id/messages` — Send a message (user or assistant role)
- `POST /api/conversations/:id/chat` — Send message and get AI response (uses Anthropic API)

## Data Storage

- **Database**: PostgreSQL via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema** (in `shared/schema.ts`):
  - `conversations` table: `id` (serial PK), `title` (text), `createdAt` (timestamp)
  - `messages` table: `id` (serial PK), `conversationId` (FK to conversations), `role` (text: 'user'|'assistant'), `content` (text), `attachments` (jsonb array of {name, content}), `createdAt` (timestamp)
- **Migrations**: Managed via `drizzle-kit push` (`npm run db:push`)
- **Storage Layer**: `server/storage.ts` implements `IStorage` interface with `DatabaseStorage` class, providing a clean abstraction over database operations

## Authentication

- No user authentication system — the app is single-user
- Anthropic API key is stored in browser `localStorage` and sent with chat requests to the server

# External Dependencies

- **PostgreSQL** — Primary database, connected via `DATABASE_URL` environment variable. Uses `pg` (node-postgres) driver with connection pooling
- **Anthropic API** — Claude AI model access via `@anthropic-ai/sdk`. API key is provided by the user and stored in localStorage (key: `anthropic_api_key`)
- **Google Fonts** — DM Sans, Merriweather, JetBrains Mono, Geist Mono, Fira Code, Architects Daughter loaded via CDN
- **Replit Plugins** — `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner` for development tooling on Replit
- **connect-pg-simple** — PostgreSQL session store (available but sessions not actively used since there's no auth)