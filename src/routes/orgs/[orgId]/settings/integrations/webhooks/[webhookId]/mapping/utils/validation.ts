import type { TargetFieldMappings } from '../types.js';
import { getRequiredTargetFields, requiredMappings } from './field-mapping.js';

/**
 * Validates that all required target fields have been mapped to webhook fields.
 *
 * @param mappings - The current field mappings (targetField -> webhookField)
 * @returns Validation result with status and list of missing field labels
 *
 * @example
 * ```typescript
 * const mappings = { "lead.email": "user.email" };
 * const result = validateMappings(mappings);
 * // result.isValid = true if all required fields are mapped
 * // result.missingFields = ["Nome da conversão", ...] if fields are missing
 * ```
 */
export function validateMappings(mappings: TargetFieldMappings): {
	isValid: boolean;
	missingFields: string[];
} {
	const required = getRequiredTargetFields();
	const missingFields = required
		.filter((field) => !mappings[field.key] || mappings[field.key].trim() === '')
		.map((field) => field.label);

	return {
		isValid: missingFields.length === 0,
		missingFields
	};
}

/**
 * Validates required mappings for a legacy mapping structure grouped by type.
 * This function checks that each entity type has all its required fields mapped.
 *
 * @param mappings - Legacy mapping structure with type/target objects
 * @returns Validation result with missing fields detailed by type and field key
 *
 * @deprecated This function supports a legacy mapping format. Use validateMappings() for new code.
 *
 * @example
 * ```typescript
 * const mappings = {
 *   "webhook1": { type: "lead", target: "email" },
 *   "webhook2": { type: "conversion", target: "name" }
 * };
 * const result = validateRequiredMappings(mappings);
 * // result.missingFields = [{ type: "conversion", field: "identifier" }, ...]
 * ```
 */
export function validateRequiredMappings(
	mappings: Record<string, { type: string; target: string }>
): { isValid: boolean; missingFields: Array<{ type: string; field: string }> } {
	const missingFields: Array<{ type: string; field: string }> = [];

	// Group mappings by type
	const mappingsByType: Record<string, Set<string>> = {};

	Object.values(mappings).forEach((mapping) => {
		if (mapping.type && mapping.target) {
			if (!mappingsByType[mapping.type]) {
				mappingsByType[mapping.type] = new Set();
			}
			mappingsByType[mapping.type].add(mapping.target);
		}
	});

	// Check required fields for each type that has mappings
	Object.keys(mappingsByType).forEach((type) => {
		const required = requiredMappings[type] || [];
		const mapped = mappingsByType[type];

		required.forEach((field) => {
			if (!mapped.has(field)) {
				missingFields.push({ type, field });
			}
		});
	});

	return {
		isValid: missingFields.length === 0,
		missingFields
	};
}
