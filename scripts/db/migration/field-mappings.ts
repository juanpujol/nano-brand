/**
 * Field key mappings for database migration scripts only.
 * 
 * These mappings transform legacy field names to the new standardized format
 * expected by the application. This is only used during data migration and 
 * should not be imported by application code.
 * 
 * The application only knows the new structure - these mappings are purely
 * for migrating old data to the new format.
 */

/**
 * Maps legacy conversion field names to standard field names
 */
export const CONVERSION_FIELD_MAPPINGS: Record<string, string> = {
	conversion_name: 'name',
	conversion_identifier: 'identifier',
	conversion_date: 'date',
	conversion_url: 'url',
	conversion_domain: 'domain',
	conversion_value: 'value',
	// UTM field mappings
	traffic_source_source: 'utm_source',
	traffic_source_medium: 'utm_medium',
	traffic_source_campaign: 'utm_campaign',
	traffic_source_content: 'utm_content',
	traffic_source_term: 'utm_term',
	traffic_source_channel: 'utm_channel',
	// Lead-level UTM field mappings (for segments)
	last_traffic_source_campaign: 'last_conversion_utm_campaign',
	last_traffic_source_medium: 'last_conversion_utm_medium',
	last_traffic_source_source: 'last_conversion_utm_source',
	last_traffic_source_content: 'last_conversion_utm_content',
	last_traffic_source_term: 'last_conversion_utm_term',
	// Other conversion fields
	payload_raw_json: 'raw_payload'
};

/**
 * Maps legacy lead field names to standard field names
 */
export const LEAD_FIELD_MAPPINGS: Record<string, string> = {
	mobile_phone: 'phone',
	personal_phone: 'secondary_phone'
};

/**
 * Maps legacy custom field names to standard field names
 * (Currently none, but can be extended if needed)
 */
export const CUSTOM_FIELD_MAPPINGS: Record<string, string> = {
	// Add custom field mappings as needed
};

/**
 * Normalizes a field key based on its entity type (section)
 * 
 * @param fieldKey - The field key to normalize
 * @param entityType - The entity type ('leads', 'conversions', 'custom_fields')
 * @returns The normalized field key
 */
export function normalizeFieldKey(fieldKey: string, entityType: string): string {
	switch (entityType) {
		case 'conversions':
			return CONVERSION_FIELD_MAPPINGS[fieldKey] || fieldKey;
		case 'leads':
			return LEAD_FIELD_MAPPINGS[fieldKey] || fieldKey;
		case 'custom_fields':
			return CUSTOM_FIELD_MAPPINGS[fieldKey] || fieldKey;
		default:
			return fieldKey;
	}
}