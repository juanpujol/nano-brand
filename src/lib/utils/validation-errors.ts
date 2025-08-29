/**
 * Utility functions for handling validation errors from valibot and SvelteKit remote functions
 */

interface ValidationIssue {
	path?: readonly (string | PropertyKey | { key: PropertyKey })[];
	message?: string;
	kind?: string;
}

interface StructuredValidationError {
	path: string;
	message: string;
	code: string;
}

/**
 * Converts valibot validation issues to structured error format
 * for use in SvelteKit's handleValidationError hook
 */
export function formatValidationErrors(issues: ValidationIssue[]): StructuredValidationError[] {
	return issues.map((issue) => {
		// Extract field path - for valibot issues, path contains objects with 'key' property
		let fieldPath = '';
		if (issue.path && issue.path.length > 0) {
			const pathSegment = issue.path[0];
			if (typeof pathSegment === 'object' && pathSegment !== null && 'key' in pathSegment) {
				fieldPath = String(pathSegment.key);
			} else {
				fieldPath = String(pathSegment);
			}
		}

		return {
			path: fieldPath,
			message: issue.message || 'Validation error',
			code: 'kind' in issue ? String(issue.kind) : 'validation_error'
		};
	});
}

/**
 * Parses validation errors from remote function responses
 * and converts them to a field-to-message mapping for form display
 */
export function parseRemoteValidationErrors(error: unknown): Record<string, string> {
	const errors: Record<string, string> = {};

	// Check if it's a structured validation error with issues array
	if (
		error &&
		typeof error === 'object' &&
		'body' in error &&
		error.body &&
		typeof error.body === 'object' &&
		'issues' in error.body &&
		Array.isArray(error.body.issues)
	) {
		error.body.issues.forEach((issue: unknown) => {
			if (
				issue &&
				typeof issue === 'object' &&
				'path' in issue &&
				'message' in issue &&
				typeof issue.path === 'string' &&
				typeof issue.message === 'string'
			) {
				errors[issue.path] = issue.message;
			}
		});
	}
	// Fallback for other error formats
	else if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string' &&
		error.message.includes('validation')
	) {
		console.log('Fallback error parsing for:', error);
	}

	return errors;
}
