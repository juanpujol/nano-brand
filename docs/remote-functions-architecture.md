# Remote Functions Architecture Pattern

## Overview

This document describes our centralized database CRUD architecture pattern using SvelteKit's Remote Functions. This pattern consolidates all database operations into reusable, type-safe functions that can be used flexibly across page loads, form actions, and component interactions.

## Architecture Principles

### 1. **Single Source of Truth**

All database operations for an entity are centralized in one remote functions file (`$lib/remote/{entity}.remote.ts`).

### 2. **Flexible API Design**

Functions support multiple use cases through optional parameters:

- Simple data fetching for dropdowns
- Paginated results for data tables
- Column selection for performance
- Search and filtering capabilities

### 3. **Type Safety**

Full TypeScript support with proper return type inference based on parameters.

### 4. **Separation of Concerns**

- **Remote Functions**: Pure database operations with validation
- **Page Server Actions**: Form-specific validation, error handling, redirects
- **Components**: Direct access for granular interactions

## Implementation Pattern

### Remote Functions Structure

```typescript
// $lib/remote/custom-fields.remote.ts
import { command, query, getRequestEvent } from '$app/server';
import { object, string, optional, boolean, number, array } from 'valibot';

// Flexible fetch function
export const fetchCustomFieldsDefinitions = query(
	fetchSchema,
	async ({ organizationId, columns, search, page, pageSize, includeCount }) => {
		// Smart return type based on pagination parameters
		if (page && pageSize) {
			return {
				customFields: data,
				total,
				page,
				pageSize,
				totalPages
			} as const; // Paginated result
		}

		return data; // Simple array
	}
);

// CRUD operations
export const createCustomFieldDefinition = command(createSchema, async (data) => {
	// Validation and creation logic
	return createdRecord;
});

export const updateCustomFieldDefinition = command(updateSchema, async (data) => {
	// Update logic
	return updatedRecord;
});

export const deleteCustomFieldDefinition = command(deleteSchema, async (data) => {
	// Delete logic
	return { success: true, fieldId };
});
```

### Usage Patterns

#### 1. Page Server Load Functions

```typescript
// +page.server.ts
import { fetchCustomFieldsDefinitions } from '$lib/remote/custom-fields.remote';

export const load: PageServerLoad = async ({ params, url }) => {
	// Paginated load for data tables
	const result = await fetchCustomFieldsDefinitions({
		organizationId: params.orgId,
		search: url.searchParams.get('search'),
		page: parseInt(url.searchParams.get('page') || '1'),
		pageSize: 50,
		includeCount: true // Triggers paginated response
	});

	return result; // { customFields: [...], total, page, pageSize, totalPages }
};
```

#### 2. Page Server Actions

```typescript
// +page.server.ts
import { createCustomFieldDefinition } from '$lib/remote/custom-fields.remote';

export const actions: Actions = {
	create: async ({ request, params }) => {
		const formData = await request.formData();

		// Form-specific validation
		if (!label?.trim()) {
			return fail(400, { error: 'Label required' });
		}

		try {
			// Delegate to remote function
			await createCustomFieldDefinition({
				organizationId: params.orgId,
				...formData
			});

			return { success: true };
		} catch (err) {
			return fail(500, { error: err.message });
		}
	}
};
```

#### 3. Direct Component Usage

```typescript
// component.svelte
import {
	fetchCustomFieldsDefinitions,
	createCustomFieldDefinition
} from '$lib/remote/custom-fields.remote';

// Simple fetch for dropdown
onMount(async () => {
	const fields = await fetchCustomFieldsDefinitions({
		organizationId: page.params.orgId,
		columns: ['field_key', 'label']
	});
	// Returns: LeadsCustomFieldDefinition[]
});

// Direct creation from component
async function handleCreate(data) {
	const newField = await createCustomFieldDefinition({
		organizationId: page.params.orgId,
		...data
	});

	// Update local state immediately
	fields = [...fields, newField];
}
```

## Benefits

### 1. **Code Reusability**

- Single function serves multiple use cases
- No code duplication between pages/components
- Consistent behavior across the application

### 2. **Type Safety**

- End-to-end TypeScript inference
- Return types automatically adapt to parameters
- Compile-time error detection

### 3. **Performance**

- Column selection for efficient queries
- Smart table selection (with/without count)
- Configurable pagination

### 4. **Developer Experience**

- Intuitive API design
- Flexible parameter handling
- Consistent error handling

### 5. **Maintainability**

- Central location for database logic
- Easy to test and modify
- Clear separation of concerns

## File Organization

```
src/lib/remote/
├── custom-fields.remote.ts     # Custom fields CRUD
├── leads.remote.ts             # Leads CRUD
├── conversions.remote.ts       # Conversions CRUD
└── segments.remote.ts          # Segments CRUD
```

## Naming Conventions

### Function Naming

- **Fetch**: `fetch{Entity}s` (plural - fetches multiple records)
- **Create**: `create{Entity}` (singular - creates one record)
- **Update**: `update{Entity}` (singular - updates one record)
- **Delete**: `delete{Entity}` (singular - deletes one record)

### Parameter Conventions

```typescript
// Required parameters first
organizationId: string

// Optional configuration
columns?: string[]           // Column selection
search?: string             // Search filter
page?: number              // Pagination
pageSize?: number          // Pagination
includeCount?: boolean     // For total count

// Entity-specific parameters
fieldId?: string           // For updates/deletes
```

## Validation Strategy

### 1. **Remote Function Validation**

- Use Valibot schemas for parameter validation
- Focus on data integrity and security
- Throw descriptive errors

### 2. **Page Action Validation**

- Form-specific validation (required fields, format)
- User-friendly error messages
- Preserve form state on errors

### 3. **Component Validation**

- Client-side validation for UX
- Pre-submission checks
- Real-time feedback

## Error Handling

### Remote Functions

```typescript
export const createCustomFieldDefinition = command(schema, async (data) => {
	try {
		// Database operations
		return result;
	} catch (err) {
		console.error('Error in createCustomFieldDefinition:', err);
		throw err instanceof Error ? err : new Error('Internal server error');
	}
});
```

### Page Actions

```typescript
export const actions: Actions = {
  create: async ({ request, params }) => {
    try {
      await createCustomFieldDefinition({ ... });
      return { success: true };
    } catch (err) {
      return fail(500, { error: err.message });
    }
  }
};
```

### Components

```typescript
async function handleSubmit() {
  try {
    await createCustomFieldDefinition({ ... });
    // Update UI
  } catch (error) {
    // Show error to user
    console.error('Failed to create field:', error);
  }
}
```

## Migration Strategy

### 1. **Identify Entities**

List all entities that need CRUD operations.

### 2. **Create Remote Functions**

For each entity, create a remote functions file with:

- Flexible fetch function
- CRUD operations
- Proper validation schemas

### 3. **Update Page Servers**

Replace direct database calls with remote function calls:

- Keep form-specific logic in actions
- Delegate database operations to remote functions

### 4. **Update Components**

Replace page action calls with direct remote function calls where appropriate.

### 5. **Test Thoroughly**

Ensure all functionality works across different usage patterns.

## Best Practices

### 1. **Parameter Design**

- Make common parameters easy to use
- Provide sensible defaults
- Support advanced use cases through optional parameters

### 2. **Return Type Design**

- Use type discriminated unions for different return types
- Make return types predictable based on parameters
- Leverage TypeScript's type inference

### 3. **Performance Optimization**

- Select only needed columns
- Use appropriate database views
- Implement efficient pagination

### 4. **Error Handling**

- Throw meaningful errors from remote functions
- Handle errors appropriately at each layer
- Log errors for debugging

### 5. **Testing**

- Test remote functions in isolation
- Test different parameter combinations
- Test error scenarios

## Example: Complete Custom Fields Implementation

```typescript
// $lib/remote/custom-fields.remote.ts
export const fetchCustomFieldsDefinitions = query(
	fetchSchema,
	async ({
		organizationId,
		columns = ['*'],
		search = '',
		page,
		pageSize,
		includeCount = false
	}) => {
		const tableName = includeCount ? 'with_count_view' : 'base_table';

		let query = supabase
			.from(tableName)
			.select(columns.join(','), includeCount ? { count: 'exact' } : undefined)
			.eq('organization_id', organizationId);

		if (search.trim()) {
			query = query.or(`field_key.ilike.%${search}%,label.ilike.%${search}%`);
		}

		if (page && pageSize) {
			const offset = (page - 1) * pageSize;
			query = query.range(offset, offset + pageSize - 1);
		}

		const { data, error, count } = await query;

		if (page && pageSize) {
			return {
				customFields: data,
				total: count || 0,
				page,
				pageSize,
				totalPages: Math.ceil((count || 0) / pageSize)
			} as const;
		}

		return data;
	}
);
```

This architecture provides a robust, scalable foundation for database operations while maintaining flexibility and type safety across your SvelteKit application.
