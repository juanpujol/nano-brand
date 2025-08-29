# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL RULES - MUST FOLLOW

### Package Management

- **ALWAYS** use `bun` as package manager and `bunx` as command runner
- **NEVER** use npm, yarn, or pnpm

### Development Server Restriction

- **YOU ARE NOT ALLOWED TO START THE SERVER**
- **DO NOT** run `bun run dev` under any circumstances

### Svelte Framework

- **ALWAYS** use Svelte 5 with runes (`$state`, `$derived`, `$effect`)
- **NEVER** use legacy Svelte store patterns in new code

### Import Conventions (Strictly Enforced)

```typescript
// ✅ CORRECT - UI Components
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';

// ❌ WRONG - Never use /index.js
import { Badge } from '$lib/components/ui/badge/index.js';

// ✅ CORRECT - Data Tables
import { createSvelteTable } from '$lib/components/ui/data-table';

// ❌ WRONG - Never import from @tanstack directly
import { createSvelteTable } from '@tanstack/table-core';

// ✅ CORRECT - Lucide Icons (with Icon suffix)
import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/svelte';

// ❌ WRONG - Without Icon suffix
import { ChevronLeft, ChevronRight } from '@lucide/svelte';
```

### Language Requirements

- **ALL CODE** must be in English: routes, variables, functions, file names, comments
- **ONLY UI CONTENT/TEXT** should be in Portuguese (pt-BR)
- **NEVER** mix languages in code structure

## Package Management & Commands

- **Build**: `bun run build` - Create production build
- **Linting**: `bun run lint` - Run ESLint with auto-fix and Prettier formatting
- **Type Checking**: `bun run check` - Run Svelte Kit sync and type checking
- **Testing**:
  - `bun run test:unit` - Run Vitest unit tests
  - `bun run test:e2e` - Run Playwright E2E tests
  - `bun run test` - Run both unit and E2E tests
- **Database**: `bun run db:reset` - Reset Supabase database and run all seeds

## Framework & Technology Stack

- **Frontend**: SvelteKit with Svelte 5 (runes pattern only)
- **Backend**: Supabase with PostgreSQL
- **Styling**: TailwindCSS v4 with shadcn-svelte components
- **Charts**: LayerChart for data visualization
- **Layout**: GridStack.js for dashboard grid system
- **Authentication**: Supabase Auth with organization-based multi-tenancy
- **Deployment**: Cloudflare (adapter configured)

## Architecture Overview

### Database Schema

- **Multi-tenant**: Organization-based with profiles and memberships
- **Core Entities**: Organizations, Profiles, Leads, Conversions, Custom Fields, Segments, Dashboards
- **Advanced Features**: Custom field definitions, rule-based segments with complex filtering

### Authentication Flow

- Supabase Auth with email/password and magic links
- Organization membership required for app access
- Auto-redirect flow: unauthenticated → login → org setup → dashboard

### Route Structure

```
/auth/* - Authentication pages (login, verify, new-org)
/orgs/[orgId]/* - Organization-scoped application
  ├── /leads - Lead management
  ├── /conversions - Conversion tracking
  ├── /segments - Audience segmentation with rule builder
  ├── /custom-fields - Custom field definitions
  └── /dash/[dashId] - Dashboard with GridStack widgets
```

### Key Components Architecture

#### Segment System

- **Rule Builder**: Complex nested rule groups with AND/OR logic
- **Field Types**: Lead fields, conversion fields, custom fields
- **Operators**: 25+ operators including JSON operations and temporal filters
- **Temporal Filtering**: Relative periods (last 7 days, etc.) and absolute dates

#### Dashboard System

- **GridStack Integration**: Drag-and-drop widget layout with responsive breakpoints
- **Widget Types**: Counter, Series Chart, Table, Pie Chart, Test widgets
- **Grid Config**: 3-column desktop, responsive down to 1-column mobile
- **Widget Sizing**: Based on 250px cell height units

#### Data Table Implementation

- Uses TanStack Table with custom Svelte wrapper
- Column meta interface extended for alignment
- Pagination and sorting built-in

### Remote Functions Pattern

- SvelteKit's experimental `remoteFunctions` feature enabled
- Server functions in `$lib/remote/*.remote.ts`
- Uses `command`, `form`, and `query` from `$app/server`
- Valibot for validation schemas
- See `/docs/error-handling-remote-functions.md` for error handling patterns

### Supabase Integration

- **Client**: `$lib/supabase/client.ts` for browser-side operations
- **Server**: `$lib/supabase/server.ts` for server-side operations with cookies
- **Types**: Auto-generated from database schema in `$lib/types/*`
- **RLS**: Row Level Security policies for multi-tenant data isolation

## Development Notes

- **TypeScript**: Strict mode enabled with experimental async compiler options
- **Testing**: Vitest for unit tests, Playwright for E2E with browser testing
- **Linting**: ESLint + Prettier with Svelte-specific rules
- **Database Migrations**: Sequential numbered migrations in `/supabase/migrations/`
- **Seeding**: SQL seed files for development data in `/supabase/seeds/`
