import type { FieldDefinition } from '$lib/types/segment-forms';

// Lead table fields based on actual database schema
export const LEAD_FIELDS: FieldDefinition[] = [
	// Core Contact Info
	{
		id: 'name',
		key: 'name',
		label: 'Nome',
		type: 'string',
		operators: [
			'equals',
			'notEquals',
			'contains',
			'notContains',
			'startsWith',
			'endsWith',
			'isEmpty',
			'isNotEmpty'
		],
		fieldGroup: 'lead'
	},
	{
		id: 'email',
		key: 'email',
		label: 'Email',
		type: 'string',
		operators: [
			'equals',
			'notEquals',
			'contains',
			'notContains',
			'startsWith',
			'endsWith',
			'isEmpty',
			'isNotEmpty'
		],
		fieldGroup: 'lead'
	},
	{
		id: 'secondary_email',
		key: 'secondary_email',
		label: 'Email Secundário',
		type: 'string',
		operators: [
			'equals',
			'notEquals',
			'contains',
			'notContains',
			'startsWith',
			'endsWith',
			'isEmpty',
			'isNotEmpty'
		],
		fieldGroup: 'lead'
	},
	{
		id: 'phone',
		key: 'phone',
		label: 'Telefone',
		type: 'string',
		operators: [
			'equals',
			'notEquals',
			'contains',
			'notContains',
			'startsWith',
			'endsWith',
			'isEmpty',
			'isNotEmpty'
		],
		fieldGroup: 'lead'
	},
	{
		id: 'secondary_phone',
		key: 'secondary_phone',
		label: 'Telefone Secundário',
		type: 'string',
		operators: [
			'equals',
			'notEquals',
			'contains',
			'notContains',
			'startsWith',
			'endsWith',
			'isEmpty',
			'isNotEmpty'
		],
		fieldGroup: 'lead'
	},
	{
		id: 'company',
		key: 'company',
		label: 'Empresa',
		type: 'string',
		operators: [
			'equals',
			'notEquals',
			'contains',
			'notContains',
			'startsWith',
			'endsWith',
			'isEmpty',
			'isNotEmpty'
		],
		fieldGroup: 'lead'
	},
	{
		id: 'job_title',
		key: 'job_title',
		label: 'Cargo',
		type: 'string',
		operators: [
			'equals',
			'notEquals',
			'contains',
			'notContains',
			'startsWith',
			'endsWith',
			'isEmpty',
			'isNotEmpty'
		],
		fieldGroup: 'lead'
	},
	// Lead Source & Attribution
	{
		id: 'import_method',
		key: 'import_method',
		label: 'Método de Importação',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	{
		id: 'external_id',
		key: 'external_id',
		label: 'ID Externo',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	{
		id: 'external_source',
		key: 'external_source',
		label: 'Fonte Externa',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	// Simple Scoring
	{
		id: 'fit_score',
		key: 'fit_score',
		label: 'Fit Score',
		type: 'select',
		operators: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty'],
		options: ['A', 'B', 'C', 'D', 'F', 'a', 'b', 'c', 'd', 'f'],
		fieldGroup: 'lead'
	},
	{
		id: 'interest',
		key: 'interest',
		label: 'Interesse',
		type: 'number',
		operators: [
			'equals',
			'notEquals',
			'greaterThan',
			'lessThan',
			'greaterThanOrEqual',
			'lessThanOrEqual',
			'isEmpty',
			'isNotEmpty'
		],
		fieldGroup: 'lead'
	},
	// Conversion Summary
	{
		id: 'total_conversions',
		key: 'total_conversions',
		label: 'Total de Conversões',
		type: 'number',
		operators: [
			'equals',
			'notEquals',
			'greaterThan',
			'lessThan',
			'greaterThanOrEqual',
			'lessThanOrEqual'
		],
		fieldGroup: 'lead'
	},
	{
		id: 'first_conversion_date',
		key: 'first_conversion_date',
		label: 'Data da Primeira Conversão',
		type: 'date',
		operators: ['equals', 'notEquals', 'before', 'after', 'between', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	{
		id: 'last_conversion_date',
		key: 'last_conversion_date',
		label: 'Data da Última Conversão',
		type: 'date',
		operators: ['equals', 'notEquals', 'before', 'after', 'between', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	// First Conversion Attribution
	{
		id: 'first_conversion_utm_source',
		key: 'first_conversion_utm_source',
		label: 'Primeira Conversão - UTM Source',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	{
		id: 'first_conversion_utm_medium',
		key: 'first_conversion_utm_medium',
		label: 'Primeira Conversão - UTM Medium',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	{
		id: 'first_conversion_utm_campaign',
		key: 'first_conversion_utm_campaign',
		label: 'Primeira Conversão - UTM Campaign',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	{
		id: 'first_conversion_utm_content',
		key: 'first_conversion_utm_content',
		label: 'Primeira Conversão - UTM Content',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	{
		id: 'first_conversion_utm_term',
		key: 'first_conversion_utm_term',
		label: 'Primeira Conversão - UTM Term',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	// Last Conversion Attribution
	{
		id: 'last_conversion_utm_source',
		key: 'last_conversion_utm_source',
		label: 'Última Conversão - UTM Source',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	{
		id: 'last_conversion_utm_medium',
		key: 'last_conversion_utm_medium',
		label: 'Última Conversão - UTM Medium',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	{
		id: 'last_conversion_utm_campaign',
		key: 'last_conversion_utm_campaign',
		label: 'Última Conversão - UTM Campaign',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	{
		id: 'last_conversion_utm_content',
		key: 'last_conversion_utm_content',
		label: 'Última Conversão - UTM Content',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	{
		id: 'last_conversion_utm_term',
		key: 'last_conversion_utm_term',
		label: 'Última Conversão - UTM Term',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	// Metadata
	{
		id: 'tags',
		key: 'tags',
		label: 'Tags',
		type: 'string',
		operators: ['contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	{
		id: 'notes',
		key: 'notes',
		label: 'Observações',
		type: 'string',
		operators: ['contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'lead'
	},
	// Timestamps
	{
		id: 'created_at',
		key: 'created_at',
		label: 'Data de Criação',
		type: 'date',
		operators: ['equals', 'notEquals', 'before', 'after', 'between'],
		fieldGroup: 'lead'
	},
	{
		id: 'updated_at',
		key: 'updated_at',
		label: 'Data de Atualização',
		type: 'date',
		operators: ['equals', 'notEquals', 'before', 'after', 'between'],
		fieldGroup: 'lead'
	}
];

// Conversion table fields based on actual database schema
export const CONVERSION_FIELDS: FieldDefinition[] = [
	// Lead conversion check (special field type)
	{
		id: 'lead_conversion_check',
		key: 'conversion_name',
		label: 'Verificação de Conversão do Lead',
		type: 'lead_conversion',
		operators: ['leadHasConversion', 'leadNotHasConversion'],
		fieldGroup: 'conversion'
	},
	// Conversion Identity
	{
		id: 'conversion_name',
		key: 'name',
		label: 'Nome da Conversão',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'conversion'
	},
	{
		id: 'conversion_identifier',
		key: 'identifier',
		label: 'Identificador da Conversão',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'conversion'
	},
	{
		id: 'conversion_external_id',
		key: 'external_id',
		label: 'ID Externo da Conversão',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'conversion'
	},
	{
		id: 'conversion_external_source',
		key: 'external_source',
		label: 'Fonte Externa da Conversão',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'conversion'
	},
	// Conversion Details
	{
		id: 'conversion_date',
		key: 'date',
		label: 'Data da Conversão',
		type: 'date',
		operators: ['equals', 'notEquals', 'before', 'after', 'between'],
		fieldGroup: 'conversion'
	},
	{
		id: 'conversion_value',
		key: 'value',
		label: 'Valor da Conversão',
		type: 'number',
		operators: [
			'equals',
			'notEquals',
			'greaterThan',
			'lessThan',
			'greaterThanOrEqual',
			'lessThanOrEqual',
			'isEmpty',
			'isNotEmpty'
		],
		fieldGroup: 'conversion'
	},
	// Traffic Attribution
	{
		id: 'conversion_source',
		key: 'source',
		label: 'Fonte da Conversão',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'conversion'
	},
	{
		id: 'conversion_utm_source',
		key: 'utm_source',
		label: 'UTM Source da Conversão',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'conversion'
	},
	{
		id: 'conversion_utm_medium',
		key: 'utm_medium',
		label: 'UTM Medium da Conversão',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'conversion'
	},
	{
		id: 'conversion_utm_campaign',
		key: 'utm_campaign',
		label: 'UTM Campaign da Conversão',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'conversion'
	},
	{
		id: 'conversion_utm_content',
		key: 'utm_content',
		label: 'UTM Content da Conversão',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'conversion'
	},
	{
		id: 'conversion_utm_term',
		key: 'utm_term',
		label: 'UTM Term da Conversão',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'conversion'
	},
	{
		id: 'conversion_utm_channel',
		key: 'utm_channel',
		label: 'UTM Channel da Conversão',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'conversion'
	},
	// Technical Details
	{
		id: 'conversion_url',
		key: 'conversion_url',
		label: 'URL da Conversão',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'conversion'
	},
	{
		id: 'conversion_domain',
		key: 'conversion_domain',
		label: 'Domínio da Conversão',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'conversion'
	},
	{
		id: 'conversion_device',
		key: 'device',
		label: 'Dispositivo',
		type: 'string',
		operators: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
		fieldGroup: 'conversion'
	},
	{
		id: 'raw_payload',
		key: 'raw_payload',
		label: 'Payload JSON (Caminho Personalizado)',
		type: 'json_path',
		operators: ['jsonKeyEquals', 'jsonContains', 'jsonKeyExists'],
		fieldGroup: 'conversion'
	}
];

// Custom field template - these would be dynamically populated from the custom_fields table
export const CUSTOM_FIELD_TEMPLATE: FieldDefinition = {
	id: 'custom_field',
	key: 'custom_field',
	label: 'Campo Personalizado',
	type: 'string',
	operators: [
		'equals',
		'notEquals',
		'contains',
		'notContains',
		'startsWith',
		'endsWith',
		'isEmpty',
		'isNotEmpty'
	],
	fieldGroup: 'custom_field'
};

// Helper function to build leads custom field definitions from database
export function buildLeadsCustomFieldDefinition(field: {
	field_key: string;
	label: string;
	type: string;
}): FieldDefinition {
	const isNumericField = field.type === 'integer' || field.type === 'number';

	return {
		id: `custom_fields.${field.field_key}`,
		key: `custom_fields.${field.field_key}`,
		label: `${field.label} (Personalizado)`,
		type: isNumericField ? 'number' : 'string',
		operators: isNumericField
			? [
					'equals',
					'notEquals',
					'greaterThan',
					'lessThan',
					'greaterThanOrEqual',
					'lessThanOrEqual',
					'isEmpty',
					'isNotEmpty'
				]
			: [
					'equals',
					'notEquals',
					'contains',
					'notContains',
					'startsWith',
					'endsWith',
					'isEmpty',
					'isNotEmpty'
				],
		fieldGroup: 'custom_field',
		custom: true
	};
}

// Export all fields combined
export const ALL_FIELDS = [...LEAD_FIELDS, ...CONVERSION_FIELDS];
