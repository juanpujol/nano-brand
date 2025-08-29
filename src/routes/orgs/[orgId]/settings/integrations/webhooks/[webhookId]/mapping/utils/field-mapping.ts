import type { TargetField } from '../types.js';

/**
 * Available target fields for webhook mapping organized by entity type.
 * Maps field keys to their Portuguese display labels.
 */
export const baseOptions: Record<string, Record<string, string>> = {
	lead: {
		name: 'Nome',
		email: 'Email',
		secondary_email: 'Email secundário',
		phone: 'Telefone',
		secondary_phone: 'Telefone pessoal',
		company: 'Empresa',
		job_title: 'Cargo do lead',
		fit_score: 'Fit Score',
		interest: 'Interesse',
		tags: 'Tags',
		notes: 'Notas',
		created_at: 'Data de criação',
		first_conversion_date: 'Data da primeira conversão',
		first_conversion_utm_source: 'Fonte da primeira conversão',
		first_conversion_utm_medium: 'Meio da primeira conversão',
		first_conversion_utm_campaign: 'Campanha da primeira conversão',
		first_conversion_utm_content: 'Conteúdo da primeira conversão',
		first_conversion_utm_term: 'Termo da primeira conversão',
		last_conversion_date: 'Data da última conversão',
		last_conversion_utm_source: 'Fonte da última conversão',
		last_conversion_utm_medium: 'Meio da última conversão',
		last_conversion_utm_campaign: 'Campanha da última conversão',
		last_conversion_utm_content: 'Conteúdo da última conversão',
		external_source: 'Provedor',
		external_id: 'ID do lead no provedor'
	},
	conversion: {
		name: 'Nome da conversão',
		identifier: 'Identificador da conversão',
		date: 'Data da conversão',
		source: 'Origem',
		utm_medium: 'Meio',
		utm_term: 'Termo',
		utm_source: 'Fonte',
		utm_content: 'Conteúdo',
		utm_campaign: 'Campanha',
		utm_channel: 'Canal',
		domain: 'Domínio',
		url: 'URL',
		device: 'Dispositivo',
		value: 'Valor',
		external_source: 'Provedor',
		external_id: 'ID da conversão no provedor'
	}
};

/**
 * Defines which fields are mandatory for each entity type.
 * These fields must be mapped for the webhook integration to work correctly.
 */
export const requiredMappings: Record<string, string[]> = {
	lead: ['email'],
	conversion: ['name', 'identifier', 'date']
};

export const entityTypeLabels: Record<string, string> = {
	lead: 'Lead',
	conversion: 'Conversão',
	custom_field: 'Campos personalizados'
};

/**
 * Creates a unique target field key by combining entity type and field key.
 *
 * @param type - The entity type (lead, conversion, custom_field)
 * @param fieldKey - The field identifier
 * @returns A dot-notation key like "lead.email" or "conversion.name"
 */
export function getTargetFieldKey(type: string, fieldKey: string): string {
	return `${type}.${fieldKey}`;
}

/**
 * Parses a target field key back into its components.
 *
 * @param targetKey - A dot-notation key like "lead.email"
 * @returns An object with type and fieldKey properties
 */
export function parseTargetFieldKey(targetKey: string): { type: string; fieldKey: string } {
	const [type, fieldKey] = targetKey.split('.');
	return { type, fieldKey };
}

/**
 * Gets all required target fields across all entity types.
 * These are the fields that must be mapped for the webhook to function properly.
 *
 * @returns Array of TargetField objects marked as required
 */
export function getRequiredTargetFields(): TargetField[] {
	const required: TargetField[] = [];

	// Add required lead fields
	requiredMappings.lead.forEach((fieldKey) => {
		if (baseOptions.lead[fieldKey]) {
			required.push({
				key: getTargetFieldKey('lead', fieldKey),
				label: baseOptions.lead[fieldKey],
				type: 'lead',
				isRequired: true
			});
		}
	});

	// Add required conversion fields
	requiredMappings.conversion.forEach((fieldKey) => {
		if (baseOptions.conversion[fieldKey]) {
			required.push({
				key: getTargetFieldKey('conversion', fieldKey),
				label: baseOptions.conversion[fieldKey],
				type: 'conversion',
				isRequired: true
			});
		}
	});

	return required;
}

/**
 * Gets the Portuguese display label for an entity type.
 *
 * @param type - The entity type key
 * @returns The Portuguese label or fallback text
 */
export function getEntityTypeLabel(type: string): string {
	return entityTypeLabels[type] || 'Selecione um tipo';
}

/**
 * Gets the display label for a specific target field within an entity type.
 *
 * @param type - The entity type (lead, conversion, etc.)
 * @param target - The field key within that type
 * @param targetOptions - The options object containing field mappings
 * @returns The Portuguese field label or error message
 */
export function getTargetFieldLabel(
	type: string,
	target: string,
	targetOptions: Record<string, Record<string, string>>
): string {
	const targetFields = targetOptions[type];
	return targetFields?.[target] || 'Campo inválido';
}

/**
 * Converts grouped field mappings (database format) back to flattened format (UI format).
 * This is the inverse of the transformation done when saving mappings.
 *
 * @param groupedMappings - The grouped mappings from the database
 * @returns Flattened mappings in the format expected by the UI
 */
export function flattenGroupedMappings(groupedMappings: unknown): Record<string, string> {
	if (!groupedMappings || typeof groupedMappings !== 'object') {
		return {};
	}

	const grouped = groupedMappings as Record<string, Record<string, string>>;
	const flattened: Record<string, string> = {};

	// Convert leads mappings
	if (grouped.leads && typeof grouped.leads === 'object') {
		for (const [fieldKey, webhookField] of Object.entries(grouped.leads)) {
			flattened[getTargetFieldKey('lead', fieldKey)] = webhookField;
		}
	}

	// Convert conversions mappings
	if (grouped.conversions && typeof grouped.conversions === 'object') {
		for (const [fieldKey, webhookField] of Object.entries(grouped.conversions)) {
			flattened[getTargetFieldKey('conversion', fieldKey)] = webhookField;
		}
	}

	// Convert custom_fields mappings
	if (grouped.custom_fields && typeof grouped.custom_fields === 'object') {
		for (const [fieldKey, webhookField] of Object.entries(grouped.custom_fields)) {
			flattened[getTargetFieldKey('custom_field', fieldKey)] = webhookField;
		}
	}

	return flattened;
}
