import { baseOptions, getRequiredTargetFields, getTargetFieldKey } from './field-mapping';
import type { TargetFieldSections, CustomFieldDefinition } from '../types';

/**
 * Processes and organizes target fields into sections (lead, conversion, custom)
 * with optional search filtering
 */
export function processTargetFieldSections(
	customFieldsDefinitions: CustomFieldDefinition[],
	searchTerm: string = ''
): TargetFieldSections {
	// Build base sections with all available fields
	const sections: TargetFieldSections = {
		lead: Object.entries(baseOptions.lead).map(([key, label]) => ({
			key: getTargetFieldKey('lead', key),
			label,
			isRequired: getRequiredTargetFields().some((f) => f.key === getTargetFieldKey('lead', key))
		})),
		conversion: Object.entries(baseOptions.conversion).map(([key, label]) => ({
			key: getTargetFieldKey('conversion', key),
			label,
			isRequired: getRequiredTargetFields().some(
				(f) => f.key === getTargetFieldKey('conversion', key)
			)
		})),
		custom: customFieldsDefinitions.map((field) => ({
			key: getTargetFieldKey('custom_field', field.field_key),
			label: field.label,
			isRequired: false
		}))
	};

	// Apply search filter if there's a search term
	if (searchTerm.trim()) {
		const search = searchTerm.toLowerCase();
		return {
			lead: sections.lead.filter((field) => field.label.toLowerCase().includes(search)),
			conversion: sections.conversion.filter((field) => field.label.toLowerCase().includes(search)),
			custom: sections.custom.filter((field) => field.label.toLowerCase().includes(search))
		};
	}

	return sections;
}

/**
 * Checks if search results are empty across all field sections
 */
export function isEmptySearchResult(sections: TargetFieldSections): boolean {
	return (
		sections.lead.length === 0 && sections.conversion.length === 0 && sections.custom.length === 0
	);
}
