# Error Handling in Remote Functions

This document outlines the patterns for handling errors in SvelteKit remote functions, specifically for business logic errors that should be displayed as field-level validation errors in the UI.

## Overview

SvelteKit remote functions handle two types of errors differently:

1. **Validation Errors** - Schema validation failures (handled by `handleValidationError` hook)
2. **Runtime Errors** - Business logic errors that occur during function execution

For business logic errors that should appear as field-level validation errors (like duplicate key constraints), we use a specific pattern with SvelteKit's `error()` function.

## Pattern: Field-Level Validation Errors

### Implementation

```typescript
import { error as httpError } from '@sveltejs/kit';
import { command } from '$app/server';

export const createSomething = command(schema, async (data) => {
	const { locals } = getRequestEvent();
	const supabase = locals.supabase;

	// Perform database operation
	const { data: result, error } = await supabase.from('table').insert(data);

	if (error) {
		console.error('Error creating record:', error);

		// Handle specific database errors
		if (error.code === '23505') {
			// PostgreSQL unique constraint violation
			httpError(400, {
				message: 'Validation failed',
				issues: [
					{
						path: 'fieldName', // Field to highlight in UI
						message: 'User-friendly error message',
						code: 'error_code'
					}
				]
			});
		}

		// Handle other database errors
		throw new Error('Generic error message');
	}

	return result;
});
```

### Key Points

1. **Import alias**: Use `import { error as httpError }` to avoid conflicts with Supabase's `error` variable
2. **No try-catch**: Don't wrap `httpError()` in try-catch blocks - let it throw naturally
3. **Error structure**: The `issues` array must match the structure expected by `handleValidationError` hook
4. **Database codes**: Common PostgreSQL error codes:
   - `23505`: Unique constraint violation
   - `23503`: Foreign key constraint violation
   - `23514`: Check constraint violation

### Error Response Structure

The `httpError()` call generates a 400 response with this structure:

```json
{
	"type": "error",
	"error": {
		"message": "Validation failed",
		"issues": [
			{
				"path": "fieldName",
				"message": "User-friendly error message",
				"code": "error_code"
			}
		]
	},
	"status": 400
}
```

## Frontend Integration

### Parsing Errors

The frontend uses `parseRemoteValidationErrors()` utility to extract field-level errors:

```typescript
import { parseRemoteValidationErrors } from '$lib/utils/validation-errors';

try {
	await createCustomFieldDefinition(data);
} catch (error) {
	const fieldErrors = parseRemoteValidationErrors(error);
	if (Object.keys(fieldErrors).length > 0) {
		// Display field-level errors
		fieldErrors = fieldErrors;
	} else {
		// Handle as general error
		throw error;
	}
}
```

### Displaying Errors

Field errors are displayed next to the relevant form fields:

```svelte
<Input bind:value={fieldValue} class={fieldErrors.fieldName ? 'border-destructive' : ''} />
{#if fieldErrors.fieldName}
	<p class="text-xs text-destructive">{fieldErrors.fieldName}</p>
{/if}
```

## Example: Custom Field Duplicate Key

Real-world example from `custom-fields.remote.ts`:

```typescript
export const createCustomFieldDefinition = command(
	createCustomFieldDefinitionSchema,
	async ({ organizationId, label, fieldKey, description, type, isRequired }) => {
		const { locals } = getRequestEvent();
		const supabase = locals.supabase;

		const { data, error } = await supabase
			.from('leads_custom_fields_definitions')
			.insert({
				organization_id: organizationId,
				field_key: fieldKey,
				label,
				description: description || null,
				type,
				is_required: isRequired
			})
			.select()
			.single();

		if (error) {
			console.error('Error creating custom field:', error);

			// Handle duplicate key constraint
			if (error.code === '23505') {
				httpError(400, {
					message: 'Validation failed',
					issues: [
						{
							path: 'fieldKey',
							message: 'Já existe um campo com esta chave',
							code: 'duplicate_field_key'
						}
					]
				});
			}

			throw new Error('Erro ao criar campo personalizado');
		}

		return data as LeadsCustomFieldDefinition;
	}
);
```

## Common Mistakes

1. **Wrapping in try-catch**: Don't catch the `httpError()` - it needs to propagate
2. **Wrong error structure**: The `issues` array format is strict
3. **Returning instead of throwing**: `httpError()` throws, don't return it
4. **Variable name conflicts**: Import as `httpError` to avoid conflicts

## Related Files

- `/src/lib/utils/validation-errors.ts` - Error parsing utilities
- `/src/hooks.server.ts` - `handleValidationError` hook
- `/src/lib/remote/*.remote.ts` - Remote function implementations
- `/src/lib/schemas/*.ts` - Validation schemas
