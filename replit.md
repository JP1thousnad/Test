# Earnings Analysis Bot - Technical Documentation

## Overview

The Earnings Analysis Bot is a comprehensive financial analysis platform that enables users to analyze stock earnings, view financial metrics, perform sentiment analysis on earnings calls, and compare companies against their peers. The application combines real-time financial data fetching with NLP-powered insights to provide actionable investment intelligence.

The platform features a modern web interface built with React and TypeScript, backed by an Express server that integrates with Yahoo Finance for market data and provides sentiment analysis capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript using Vite as the build tool

**UI Component System**: 
- Radix UI primitives for accessible, unstyled components
- Shadcn/ui component library following the "New York" style variant
- IBM Carbon Design System patterns for financial dashboards
- Tailwind CSS for styling with custom design tokens

**State Management**:
- TanStack Query (React Query) for server state management and data fetching
- Local component state with React hooks for UI state
- Query client configured with stale-time infinity to prevent unnecessary refetches

**Routing**: Wouter for lightweight client-side routing

**Key Design Decisions**:
- Component-based architecture with reusable UI primitives
- IBM Plex Sans for typography (professional financial aesthetic)
- IBM Plex Mono for numerical data (tabular alignment)
- Carbon Design System patterns chosen for data-intensive enterprise applications
- Light/dark theme support with system preference detection

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js

**API Design**: RESTful API with the following key endpoints:
- `GET /api/health` - Health check endpoint
- `GET /api/analyze/:ticker` - Fetch comprehensive earnings analysis for a stock ticker
- `POST /api/peers` - Fetch peer comparison data

**Service Layer Pattern**:
- `stockDataService` - Handles all financial data fetching and calculation
- `sentimentService` - Performs text sentiment analysis on earnings transcripts

**Data Processing**:
- Yahoo Finance integration via `yahoo-finance2` package for real-time market data
- Metrics calculation including margins, growth rates, beat/miss analysis
- Earnings history aggregation and trend analysis
- Peer comparison metrics compilation

**Build Strategy**:
- ESBuild for server bundling with selective dependency bundling
- Vite for client bundling and development server
- Allowlist pattern for bundling specific dependencies to reduce cold start times
- Development mode with HMR via Vite middleware integration

### Data Storage Solutions

**Database**: PostgreSQL configured via Drizzle ORM

**Schema Management**:
- Drizzle Kit for migrations (output to `/migrations` directory)
- Schema defined in `shared/schema.ts` for type safety across client/server
- Neon serverless PostgreSQL driver for connection pooling

**Current Schema**:
- Users table with UUID primary keys, username, and password fields
- Zod schemas for runtime validation of database operations

**Design Decision**: Database is provisioned but minimal usage in current implementation - primary data source is external APIs (Yahoo Finance). Database is available for caching analyzed results, user preferences, and saved analyses in future iterations.

### Authentication and Authorization

**Session Management**: 
- Express-session middleware configured (visible in dependencies)
- Connect-pg-simple for PostgreSQL-backed session storage
- In-memory storage fallback via `MemStorage` class

**User Management**:
- User CRUD operations abstracted through `IStorage` interface
- Password hashing capabilities (bcrypt/passport dependencies present)
- Currently using in-memory storage with UUID-based user IDs

**Design Decision**: Authentication infrastructure is in place but not actively enforced on API routes - suitable for adding protected endpoints and user-specific analysis saving features.

## External Dependencies

### Third-Party APIs and Services

**Yahoo Finance (yahoo-finance2)**:
- Primary data source for stock quotes, financial statements, and earnings history
- Endpoints used: `quote()`, `quoteSummary()` with modules for income statements and earnings
- No API key required (public data access)
- Rate limiting considerations handled at service layer

**Neon Database**:
- Serverless PostgreSQL database accessed via `@neondatabase/serverless`
- Connection via `DATABASE_URL` environment variable
- WebSocket-based protocol for serverless environments

### Key NPM Packages

**Data Fetching & Validation**:
- `drizzle-orm` v0.39.1 - Type-safe ORM
- `drizzle-zod` v0.7.0 - Zod schema generation from Drizzle schemas
- `zod` - Runtime type validation and schema definition
- `yahoo-finance2` - Financial market data

**UI Libraries**:
- `@radix-ui/*` - 25+ primitive components for accessibility
- `@tanstack/react-query` v5.60.5 - Server state management
- `recharts` - Data visualization and charting
- `embla-carousel-react` - Carousel/slider functionality
- `date-fns` v3.6.0 - Date formatting and manipulation
- `lucide-react` - Icon library

**Styling**:
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` - Type-safe variant management
- `clsx` + `tailwind-merge` - Conditional class composition

**Development Tools**:
- `vite` - Build tool and dev server
- `tsx` - TypeScript execution for Node.js
- `esbuild` - JavaScript bundler for server builds
- `@replit/vite-plugin-*` - Replit-specific development enhancements

### Environment Configuration

**Required Environment Variables**:
- `DATABASE_URL` - PostgreSQL connection string (required for database operations)
- `NODE_ENV` - Environment indicator (development/production)

**Optional Integrations** (infrastructure present, not actively used):
- OpenAI API (for advanced NLP/GPT features)
- Stripe (for payment processing)
- Google Generative AI (alternative AI provider)

### Design Rationale for External Dependencies

**Why Yahoo Finance**: Free, reliable, comprehensive coverage of US stocks without API key requirements. Provides both real-time quotes and historical financial statements.

**Why Neon**: Serverless PostgreSQL eliminates connection pool management complexity in edge/serverless deployments. WebSocket protocol provides low-latency access.

**Why Drizzle ORM**: Type-safe queries prevent runtime errors, Zod integration provides seamless validation, and lightweight footprint suits serverless environments.

**Why Radix UI**: Unstyled, accessible primitives allow full design customization while maintaining WCAG compliance - critical for financial applications serving diverse users.

**Why TanStack Query**: Industry-standard solution for server state with built-in caching, background refetching, and optimistic updates - reduces boilerplate and improves UX.