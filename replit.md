# MITS Assistant - Educational Chatbot

## Overview

MITS Assistant is a conversational AI chatbot designed for Madhav Institute of Technology & Science (MITS), Gwalior. The application enables students, prospective applicants, and visitors to ask questions about the institution and receive accurate, sourced answers from the official website content. The system scrapes and indexes content from the MITS website, then uses OpenAI's GPT model to generate contextually relevant responses with source citations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server for fast HMR and optimized production builds
- **Wouter** for lightweight client-side routing (single-page application with chat interface and 404 page)

**UI Component Strategy**
- **shadcn/ui** component library built on Radix UI primitives for accessible, customizable components
- **Tailwind CSS** for utility-first styling with a custom design system
- Custom color scheme defined via CSS variables supporting light/dark themes
- Typography system using Inter (body) and Space Grotesk (headings) from Google Fonts

**State Management**
- **TanStack Query (React Query)** for server state management, API calls, and caching
- Local React state for UI interactions (input fields, theme toggle)
- No global state management library needed due to simple application scope

**Design System**
- Follows design guidelines emphasizing clarity, readability, and campus-friendly aesthetics
- Centered chat layout with max-width constraints for optimal reading
- Responsive design with mobile-first approach
- Consistent spacing framework using Tailwind's spacing scale (2, 4, 6, 8, 12, 16)

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript running on Node.js
- ESM module system for modern JavaScript imports
- Middleware for JSON parsing, logging, and request tracking

**API Design**
- RESTful API with two primary endpoints:
  - `POST /api/chat` - Accepts user messages, returns AI-generated responses
  - `POST /api/scrape` - Administrative endpoint for scraping website content (inferred from storage layer)
- Request validation using Zod schemas for type safety
- Standardized error handling and response formats

**Development vs Production**
- Development: Vite middleware integrated for HMR and asset serving
- Production: Static file serving from built assets
- Environment-based configuration for OpenAI API and database connections

### Data Storage & Management

**Database Strategy**
- **Drizzle ORM** configured for PostgreSQL via Neon serverless driver
- Schema defines `scraped_content` table with URL, title, content, and timestamp fields
- Current implementation uses **in-memory storage** (MemStorage class) as a fallback/development solution
- Database migrations managed through Drizzle Kit

**Storage Abstraction**
- `IStorage` interface defines contract for content retrieval and persistence
- Allows switching between in-memory and PostgreSQL implementations without code changes
- CRUD operations: create, read (single/all), and update scraped content

**Content Management**
- Web scraping system extracts text from MITS website pages
- Content indexed by URL with duplicate prevention
- Full-text storage for retrieval-augmented generation (RAG) approach

### AI Integration & Processing

**OpenAI Integration**
- Uses Replit's AI Integrations service for OpenAI-compatible API access
- No direct OpenAI API key required (provided via environment variables)
- **Model**: GPT-5 (released August 2025) for latest capabilities

**RAG (Retrieval-Augmented Generation) Pipeline**
1. User submits question via chat interface
2. System retrieves all scraped content from storage
3. `findRelevantContent` function identifies most relevant pages based on keyword matching
4. Relevant content passed as context to GPT model
5. AI generates structured response (summary + bullet points) with source attribution
6. Response returned to frontend with source citations

**Rate Limiting & Retry Logic**
- `p-limit` for concurrency control
- `p-retry` for automatic retry on rate limit errors
- Error detection for 429 status codes and quota exceeded messages

**Response Formatting**
- Structured JSON output: `{ summary: string, bullets: string[], hasAnswer: boolean }`
- System prompt enforces factual accuracy and citation requirements
- Frontend renders summary and bullet points with clear visual hierarchy

### Web Scraping System

**Scraping Implementation**
- **Axios** for HTTP requests with custom User-Agent headers
- **Cheerio** for HTML parsing and text extraction
- Removes unnecessary elements (scripts, styles, navigation, footers)
- Extracts text from semantic elements (paragraphs, headings, lists, tables)
- Content limited to 10,000 characters per page to manage token limits

**Content Relevance Matching**
- Keyword-based relevance scoring for context selection
- Prioritizes pages with higher keyword overlap with user queries
- Ensures most contextually appropriate content is provided to AI model

### Authentication & Security

**Current State**
- No authentication system implemented (open access chatbot)
- Administrative scraping endpoint should be protected in production
- CORS and security headers not explicitly configured

**Considerations for Production**
- Admin authentication needed for scraping endpoints
- Rate limiting on chat endpoint to prevent abuse
- CSRF protection for state-changing operations
- Content Security Policy headers

### Build & Deployment

**Build Process**
1. Frontend: Vite builds React app to `dist/public`
2. Backend: esbuild bundles Express server to `dist/index.js`
3. Single production artifact with static assets and server bundle

**Environment Variables Required**
- `DATABASE_URL` - PostgreSQL connection string (currently optional due to in-memory fallback)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Replit AI integrations endpoint
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Service authentication token
- `NODE_ENV` - Environment flag (development/production)

**Development Workflow**
- `npm run dev` - Starts development server with HMR
- `npm run build` - Production build
- `npm run start` - Runs production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push Drizzle schema to database

## External Dependencies

### Third-Party Services

**AI/ML Services**
- **Replit AI Integrations** - OpenAI-compatible API service for GPT-5 access
- Provides managed API keys and rate limiting
- Handles authentication and billing abstraction

**Database**
- **Neon** - Serverless PostgreSQL provider (configured but not actively used)
- Connection via `@neondatabase/serverless` driver
- Drizzle ORM provides database abstraction layer

### Key NPM Packages

**Frontend Core**
- `react` & `react-dom` - UI framework
- `wouter` - Lightweight routing
- `@tanstack/react-query` - Server state management
- `vite` - Build tool and dev server

**UI Components**
- `@radix-ui/*` - Accessible primitive components (17+ packages)
- `tailwindcss` - Utility CSS framework
- `class-variance-authority` & `clsx` - Dynamic className management
- `lucide-react` - Icon library

**Backend Core**
- `express` - Web server framework
- `drizzle-orm` - TypeScript ORM
- `zod` - Schema validation
- `tsx` - TypeScript execution for development

**AI & Data Processing**
- `openai` - OpenAI client library
- `axios` - HTTP client for web scraping
- `cheerio` - HTML parsing
- `p-limit` & `p-retry` - Concurrency and retry utilities

**Development Tools**
- `@vitejs/plugin-react` - React support for Vite
- `esbuild` - Fast JavaScript bundler for production
- `drizzle-kit` - Database migration tool
- `typescript` - Type system

### API Integrations

**MITS Website**
- Scrapes content from official MITS Gwalior website
- No authentication required for public pages
- Content extraction via cheerio HTML parsing
- Respectful scraping with timeout controls (15s)