// Re-export types from segments.ts for backward compatibility
export type { FieldType, RuleGroup, SegmentRule } from '$lib/types/segments';
import type { RuleGroup } from '$lib/types/segments';

export interface SegmentFormData {
	name: string;
	description: string | null;
	timeFilter?: {
		enabled: boolean;
		type: 'lead.created_at' | 'any_conversion' | 'last_conversion_date';
		period: string | null;
	};
	rules: RuleGroup;
}

export interface SegmentCreateData extends SegmentFormData {
	organization_id: string;
}

export interface SegmentUpdateData extends SegmentFormData {
	id: string;
}

// Available fields for segment rules
export interface FieldDefinition {
	id: string;
	key?: string;
	label: string;
	type: 'string' | 'number' | 'date' | 'boolean' | 'select' | 'json_path' | 'lead_conversion';
	operators: string[];
	options?: string[];
	fieldGroup: 'lead' | 'conversion' | 'custom_field';
	custom?: boolean;
}

// Available operators for different field types
export interface OperatorDefinition {
	key: string;
	label: string;
	valueType: 'text' | 'number' | 'select' | 'multi-select' | 'date' | 'none';
	supportedFieldTypes: string[];
}

// Mapping of field types to compatible operators
export const FIELD_TYPE_OPERATORS: Record<string, string[]> = {
	string: [
		'equals',
		'notEquals',
		'contains',
		'notContains',
		'startsWith',
		'endsWith',
		'isEmpty',
		'isNotEmpty'
	],
	number: [
		'equals',
		'notEquals',
		'lessThan',
		'greaterThan',
		'greaterThanOrEqual',
		'lessThanOrEqual',
		'isEmpty',
		'isNotEmpty'
	],
	date: ['equals', 'notEquals', 'before', 'after', 'between', 'isEmpty', 'isNotEmpty'],
	select: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty'],
	boolean: ['equals', 'notEquals'],
	json_path: ['jsonKeyEquals', 'jsonContains', 'jsonKeyExists'],
	lead_conversion: ['leadHasConversion', 'leadNotHasConversion']
};

// Predefined operators
export const OPERATORS: OperatorDefinition[] = [
	{
		key: 'equals',
		label: 'Igual a',
		valueType: 'text',
		supportedFieldTypes: ['string', 'number', 'select', 'boolean']
	},
	{
		key: 'notEquals',
		label: 'Diferente de',
		valueType: 'text',
		supportedFieldTypes: ['string', 'number', 'select', 'boolean']
	},
	{
		key: 'contains',
		label: 'Contém',
		valueType: 'text',
		supportedFieldTypes: ['string']
	},
	{
		key: 'notContains',
		label: 'Não contém',
		valueType: 'text',
		supportedFieldTypes: ['string']
	},
	{
		key: 'startsWith',
		label: 'Começa com',
		valueType: 'text',
		supportedFieldTypes: ['string']
	},
	{
		key: 'endsWith',
		label: 'Termina com',
		valueType: 'text',
		supportedFieldTypes: ['string']
	},
	{
		key: 'lessThan',
		label: 'Menor que',
		valueType: 'number',
		supportedFieldTypes: ['number']
	},
	{
		key: 'greaterThan',
		label: 'Maior que',
		valueType: 'number',
		supportedFieldTypes: ['number']
	},
	{
		key: 'greaterThanOrEqual',
		label: 'Maior ou igual a',
		valueType: 'number',
		supportedFieldTypes: ['number']
	},
	{
		key: 'lessThanOrEqual',
		label: 'Menor ou igual a',
		valueType: 'number',
		supportedFieldTypes: ['number']
	},
	{
		key: 'before',
		label: 'Antes de',
		valueType: 'date',
		supportedFieldTypes: ['date']
	},
	{
		key: 'after',
		label: 'Depois de',
		valueType: 'date',
		supportedFieldTypes: ['date']
	},
	{
		key: 'between',
		label: 'Entre',
		valueType: 'text',
		supportedFieldTypes: ['number', 'date']
	},
	{
		key: 'isEmpty',
		label: 'Está vazio',
		valueType: 'none',
		supportedFieldTypes: ['string', 'number', 'date', 'select']
	},
	{
		key: 'isNotEmpty',
		label: 'Não está vazio',
		valueType: 'none',
		supportedFieldTypes: ['string', 'number', 'date', 'select']
	},
	{
		key: 'jsonKeyEquals',
		label: 'Chave JSON igual a',
		valueType: 'text',
		supportedFieldTypes: ['json_path']
	},
	{
		key: 'jsonContains',
		label: 'JSON contém valor',
		valueType: 'text',
		supportedFieldTypes: ['json_path']
	},
	{
		key: 'jsonKeyExists',
		label: 'Chave JSON existe',
		valueType: 'text',
		supportedFieldTypes: ['json_path']
	},
	{
		key: 'leadHasConversion',
		label: 'Lead tem conversão',
		valueType: 'text',
		supportedFieldTypes: ['lead_conversion']
	},
	{
		key: 'leadNotHasConversion',
		label: 'Lead não tem conversão',
		valueType: 'text',
		supportedFieldTypes: ['lead_conversion']
	}
];

// Predefined time periods for date operators
export const TIME_PERIODS = [
	{ value: '1_day', label: '1 dia' },
	{ value: '7_days', label: '7 dias' },
	{ value: '15_days', label: '15 dias' },
	{ value: '30_days', label: '30 dias' },
	{ value: '60_days', label: '60 dias' },
	{ value: '90_days', label: '90 dias' },
	{ value: '6_months', label: '6 meses' },
	{ value: '1_year', label: '1 ano' }
];

// Temporal filter options
export const TIME_FILTER_OPTIONS = [
	{ value: 'lead.createdAt', label: 'Data de criação do lead' },
	{ value: 'conversion.first', label: 'Primeira conversão' },
	{ value: 'conversion.last', label: 'Última conversão' },
	{ value: 'conversion.any', label: 'Qualquer conversão no período' },
	{ value: 'conversion.first_strict', label: 'Primeira conversão (estrita)' },
	{ value: 'conversion.last_strict', label: 'Última conversão (estrita)' }
];

// Relative period options
export const RELATIVE_PERIOD_OPTIONS = [
	{ value: 'automatic', label: 'Automático' },
	{ value: 'today', label: 'Hoje' },
	{ value: 'yesterday', label: 'Ontem' },
	{ value: 'thisWeek', label: 'Esta semana' },
	{ value: 'lastWeek', label: 'Semana passada' },
	{ value: 'thisMonth', label: 'Este mês' },
	{ value: 'lastMonth', label: 'Mês passado' },
	{ value: 'thisQuarter', label: 'Este trimestre' },
	{ value: 'lastQuarter', label: 'Trimestre passado' },
	{ value: 'none', label: 'Nenhum' },
	{ value: 'absolute', label: 'Fixo' }
];

// Import field definitions from the dedicated file
export {
	buildLeadsCustomFieldDefinition,
	CONVERSION_FIELDS,
	LEAD_FIELDS
} from '../components/segment/rule-builder/field-definitions';

// Function to build dynamic field options
export const buildDynamicFieldOptions = (
	customFieldOptions: FieldDefinition[] = [],
	hasCustomFieldsFeature: boolean = false
): FieldDefinition[] => {
	let allFields: FieldDefinition[] = [];

	if (hasCustomFieldsFeature && customFieldOptions.length > 0) {
		allFields = [...allFields, ...customFieldOptions];
	}

	return allFields;
};
