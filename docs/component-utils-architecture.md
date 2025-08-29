# Component & Utils Architecture Pattern

## Overview

This document describes our architecture pattern for organizing components, utilities, and types in SvelteKit applications. The pattern promotes co-location for route-specific code while providing clear escalation paths to shared libraries when reusability is needed.

## Architecture Principles

### 1. **Co-location First**

Components, utilities, and types that are specific to a single route should be co-located with that route.

### 2. **Progressive Promotion**

Start with co-located code. When reusability emerges, promote to shared libraries with clear categorization.

### 3. **Clear Naming Conventions**

Use descriptive names that indicate purpose and domain rather than generic terms like "utils" or "helpers".

### 4. **Logical Separation**

Separate components, utilities, and types into distinct directories for better organization and discoverability.

## File Organization Patterns

### Route-Specific Organization

When components and utilities are specific to a single route, organize them in subdirectories:

```
src/routes/orgs/[orgId]/settings/integrations/webhooks/[webhookId]/mapping/
├── +page.svelte                 # Main page component
├── components/                  # Route-specific components
│   ├── webhook-field-selection-dialog.svelte
│   ├── mapping-table.svelte
│   └── validation-summary.svelte
├── utils/                      # Route-specific utilities
│   ├── field-mapping.ts        # Field mapping logic
│   ├── validation.ts           # Validation functions
│   ├── transformers.ts         # Data transformation utilities
│   └── constants.ts            # Route-specific constants
└── types.ts                    # Route-specific types and interfaces
```

### Shared Library Organization

When code needs to be reused across multiple routes, organize in categorized libraries:

```
src/lib/
├── components/
│   ├── ui/                     # shadcn-svelte components
│   │   ├── button/
│   │   ├── dialog/
│   │   └── ...
│   ├── business/               # Business domain components
│   │   ├── leads/              # Lead-related components
│   │   │   ├── lead-detail-sheet.svelte
│   │   │   ├── lead-info-card.svelte
│   │   │   └── index.ts
│   │   ├── webhooks/           # Webhook-related components
│   │   │   ├── webhook-status-badge.svelte
│   │   │   ├── webhook-form.svelte
│   │   │   └── index.ts
│   │   └── custom-fields/      # Custom fields components
│   │       ├── custom-field-dialog.svelte
│   │       ├── custom-field-form.svelte
│   │       └── index.ts
│   ├── layout/                 # Layout components
│   │   ├── org-sidebar/
│   │   ├── dashboard/
│   │   └── navigation/
│   └── common/                 # Generic reusable components
│       ├── alerts/
│       ├── forms/
│       └── data/
└── utils/
    ├── webhooks/               # Webhook domain utilities
    │   ├── field-mapping.ts
    │   ├── validation.ts
    │   └── types.ts
    ├── leads/                  # Lead domain utilities
    │   ├── scoring.ts
    │   ├── enrichment.ts
    │   └── types.ts
    └── common/                 # Generic utilities
        ├── dates.ts
        ├── formatting.ts
        └── validation.ts
```

## Naming Conventions

### Component Naming

- **Route-specific components**: Use descriptive names indicating their specific purpose
  - ✅ `webhook-field-selection-dialog.svelte`
  - ✅ `mapping-validation-summary.svelte`
  - ❌ `dialog.svelte`
  - ❌ `form.svelte`

- **Shared components**: Use domain prefix when needed for clarity
  - ✅ `lead-detail-sheet.svelte`
  - ✅ `webhook-status-badge.svelte`
  - ✅ `custom-field-form.svelte`

### Utility File Naming

- Use specific, descriptive names that indicate functionality
  - ✅ `field-mapping.ts` - Functions for mapping webhook fields
  - ✅ `validation.ts` - Validation logic and rules
  - ✅ `transformers.ts` - Data transformation utilities
  - ✅ `constants.ts` - Static values and configuration
  - ❌ `utils.ts` - Too generic
  - ❌ `helpers.ts` - Too generic

### Type File Naming

- Route-specific: `types.ts` (since it's in the route context)
- Shared: Domain-specific naming like `webhook-types.ts` or include in util files

## Decision Matrix

Use this decision tree when organizing new components and utilities:

### For Components:

```
Is this component used in multiple routes?
├── No → Co-locate in route's components/ directory
└── Yes → Is it domain-specific?
    ├── Yes → $lib/components/business/{domain}/
    └── No → $lib/components/common/
```

### For Utilities:

```
Are these utilities used in multiple routes?
├── No → Co-locate in route's utils/ directory with specific naming
└── Yes → Is it domain-specific?
    ├── Yes → $lib/utils/{domain}/
    └── No → $lib/utils/common/
```

## Migration Strategy

### 1. **Start Co-located**

Begin with route-specific organization:

```
src/routes/my-feature/
├── +page.svelte
├── components/
│   └── feature-dialog.svelte
├── utils/
│   └── feature-logic.ts
└── types.ts
```

### 2. **Identify Reusability**

When you need to use the same component/utility in another route, that's the signal to promote.

### 3. **Promote to Shared Library**

Move to appropriate shared location:

```
src/lib/components/business/my-domain/
├── feature-dialog.svelte
├── feature-form.svelte
└── index.ts
```

### 4. **Update Imports**

Change imports from route-specific to library imports:

```typescript
// Before (route-specific)
import FeatureDialog from './components/feature-dialog.svelte';

// After (promoted to library)
import { FeatureDialog } from '$lib/components/business/my-domain';
```

## Import Patterns

### Route-Specific Imports

```typescript
// Components in same route
import WebhookFieldDialog from './components/webhook-field-selection-dialog.svelte';

// Utils in same route
import { validateMappings } from './utils/validation.js';
import { transformWebhookData } from './utils/transformers.js';

// Types in same route
import type { FieldMapping, ValidationResult } from './types.js';
```

### Shared Library Imports

```typescript
// Business domain components
import { LeadDetailSheet } from '$lib/components/business/leads';
import { WebhookStatusBadge } from '$lib/components/business/webhooks';

// Domain utilities
import { calculateFitScore } from '$lib/utils/leads/scoring.js';
import { validateWebhookPayload } from '$lib/utils/webhooks/validation.js';

// UI components
import { Button } from '$lib/components/ui/button';
import { Dialog } from '$lib/components/ui/dialog';
```

## Barrel Exports

Use index files for clean imports from shared libraries:

```typescript
// src/lib/components/business/webhooks/index.ts
export { default as WebhookStatusBadge } from './webhook-status-badge.svelte';
export { default as WebhookForm } from './webhook-form.svelte';
export { default as WebhookFieldDialog } from './webhook-field-dialog.svelte';

// src/lib/utils/webhooks/index.ts
export * from './field-mapping.js';
export * from './validation.js';
export * from './transformers.js';
export type * from './types.js';
```

## Best Practices

### 1. **Directory Structure**

- Keep route-specific code co-located
- Use `components/`, `utils/`, and `types.ts` pattern
- Create subdirectories when you have 3+ files of the same type

### 2. **File Naming**

- Be specific and descriptive
- Use domain prefixes for shared components
- Avoid generic names like `utils.ts` or `helpers.ts`

### 3. **Import Organization**

- Import from most specific to most general
- Group imports by type (components, utils, types)
- Use consistent import patterns across the codebase

### 4. **Promotion Guidelines**

- Don't promote prematurely - wait for actual reuse need
- When promoting, ensure the code is truly reusable
- Update all existing imports when promoting

### 5. **Type Organization**

- Keep route-specific types in `types.ts` files
- For shared types, prefer co-location with related utilities
- Use TypeScript's `type` imports for better tree-shaking

## Example Implementation

### Before (Generic naming):

```
src/routes/orgs/[orgId]/settings/integrations/webhooks/[webhookId]/mapping/
├── +page.svelte
├── utils.ts                    # Generic name, everything mixed
└── dialog.svelte               # Generic name
```

### After (Specific organization):

```
src/routes/orgs/[orgId]/settings/integrations/webhooks/[webhookId]/mapping/
├── +page.svelte
├── components/
│   └── webhook-field-selection-dialog.svelte
├── utils/
│   ├── field-mapping.ts        # Field mapping logic
│   ├── validation.ts           # Validation functions
│   └── transformers.ts         # Data transformation
└── types.ts                    # TypeScript interfaces
```

This architecture scales from simple single-file routes to complex multi-component features while maintaining clarity and discoverability.

## Integration with Remote Functions Architecture

This component and utils architecture works seamlessly with our [Remote Functions Architecture](./remote-functions-architecture.md):

- **Remote functions** handle all database operations
- **Route utils** handle route-specific business logic and data transformation
- **Shared utils** handle domain-specific logic that spans multiple routes
- **Components** consume both remote functions and utilities as needed

```typescript
// Route-specific component using both patterns
// src/routes/.../mapping/components/webhook-field-dialog.svelte
import { fetchCustomFieldsDefinitions } from '$lib/remote/custom-fields.remote';
import { validateMappings } from '../utils/validation.js';
import { transformWebhookFields } from '../utils/transformers.js';
```

This creates a clean separation of concerns while maintaining the co-location benefits for route-specific code.
