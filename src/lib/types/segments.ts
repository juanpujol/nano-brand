// Base types for individual rule conditions
export type FieldType = 'lead' | 'conversion' | 'custom_field';

export type RuleOperator =
	| 'equals'
	| 'notEquals'
	| 'contains'
	| 'notContains'
	| 'startsWith'
	| 'endsWith'
	| 'lessThan'
	| 'greaterThan'
	| 'greaterThanOrEqual'
	| 'lessThanOrEqual'
	| 'between'
	| 'before'
	| 'after'
	| 'onDate'
	| 'notOnDate'
	| 'isEmpty'
	| 'isNotEmpty'
	| 'jsonKeyEquals'
	| 'jsonContains'
	| 'jsonKeyExists'
	| 'leadHasConversion'
	| 'leadNotHasConversion'
	// Legacy operators for backward compatibility
	| 'not_equals'
	| 'not_contains'
	| 'starts_with'
	| 'ends_with'
	| 'greater_than'
	| 'less_than'
	| 'greater_than_or_equal'
	| 'less_than_or_equal'
	| 'in'
	| 'not_in'
	| 'is_null'
	| 'is_not_null'
	| 'older_than'
	| 'newer_than'
	| 'regex_match';

export type Combinator = 'and' | 'or';

export type TimeFilterType =
	| 'lead.createdAt'
	| 'conversion.first'
	| 'conversion.last'
	| 'conversion.any'
	| 'conversion.first_strict'
	| 'conversion.last_strict';

export type RelativePeriodValue =
	| 'automatic'
	| 'today'
	| 'yesterday'
	| 'thisWeek'
	| 'lastWeek'
	| 'thisMonth'
	| 'lastMonth'
	| 'thisQuarter'
	| 'lastQuarter'
	| 'none'
	| 'absolute';

// Individual rule definition
export interface SegmentRule {
	id?: string; // Unique identifier for the rule
	field: string; // e.g., "fit_score", "custom_fields.uf", "interest"
	fieldGroup?: FieldType; // Optional: helps determine JOINs needed
	operator: RuleOperator; // How to compare the field
	value: unknown; // The comparison value(s) - can be any type
}

// Date range for absolute periods
export interface DateRange {
	from: string | Date; // Start date
	to?: string | Date; // End date (optional)
}

// Period configuration
export interface PeriodValue {
	type: 'relative' | 'absolute' | 'none' | 'automatic';

	// For relative periods
	relativeValue?: RelativePeriodValue;

	// For absolute periods
	dateRange?: DateRange;
	absoluteStart?: string;
	absoluteEnd?: string;
}

// Temporal filter configuration
export interface PeriodFilter {
	timeFilterType: TimeFilterType; // What date field to filter on
	periodValue: PeriodValue; // The actual period definition
}

// Individual rule or nested group - recursive type definition
export type RuleOrGroup = SegmentRule | RuleGroup;

// Recursive rule group structure
export interface RuleGroup {
	id?: string; // Unique identifier for the group
	combinator: Combinator; // How to combine rules/groups (AND/OR)
	rules: RuleOrGroup[]; // Individual rule conditions or nested groups
	groups?: RuleGroup[]; // Legacy: nested rule groups for complex logic
	not?: boolean; // Optional: negate the entire group
	periodFilter?: PeriodFilter; // Optional temporal filtering
}

// Complete segment rule JSON (what goes in segments.rule_json)
export type SegmentRuleJson = RuleGroup;

// Extended types for processing
export interface ProcessedRuleGroup extends RuleGroup {
	// Calculated during processing
	needsConversionJoin?: boolean;
	needsCustomFieldsJoin?: boolean;
}

// For database function responses
export interface RuleProcessingResult {
	sql_conditions: string;
	needs_conversion_join: boolean;
	needs_custom_fields_join: boolean;
}

// Type guards
export const isRelativePeriod = (periodValue: PeriodValue): boolean => {
	return periodValue.type === 'relative' && !!periodValue.relativeValue;
};

export const isAbsolutePeriod = (periodValue: PeriodValue): boolean => {
	return periodValue.type === 'absolute' && !!periodValue.dateRange;
};

export const hasTemporalFilter = (ruleGroup: RuleGroup): boolean => {
	return !!ruleGroup.periodFilter;
};

// Type guard to check if an item is a Rule or RuleGroup
export const isRule = (item: RuleOrGroup): item is SegmentRule => {
	return 'field' in item && typeof item.field === 'string';
};

export const isRuleGroup = (item: RuleOrGroup): item is RuleGroup => {
	return 'combinator' in item && !('field' in item);
};

// Field group configuration for visual display
export interface FieldGroupConfig {
	label: string;
	color: string;
	textColor: string;
}

export const FIELD_GROUPS: Record<FieldType, FieldGroupConfig> = {
	lead: {
		label: 'Lead',
		color: 'rgba(59, 130, 246, 0.1)',
		textColor: '#3b82f6'
	},
	conversion: {
		label: 'Conversão',
		color: 'rgba(16, 185, 129, 0.1)',
		textColor: '#10b981'
	},
	custom_field: {
		label: 'Campo Personalizado',
		color: 'rgba(249, 115, 22, 0.1)',
		textColor: '#f97316'
	}
};

// Operator labels for display
export const OPERATOR_LABELS: Record<string, string> = {
	equals: 'Igual a',
	notEquals: 'Diferente de',
	contains: 'Contém',
	notContains: 'Não contém',
	startsWith: 'Começa com',
	endsWith: 'Termina com',
	lessThan: 'Menor que',
	greaterThan: 'Maior que',
	greaterThanOrEqual: 'Maior ou igual a',
	lessThanOrEqual: 'Menor ou igual a',
	between: 'Entre',
	before: 'Antes de',
	after: 'Depois de',
	onDate: 'Na data',
	notOnDate: 'Não na data',
	isEmpty: 'Está vazio',
	isNotEmpty: 'Não está vazio',
	jsonKeyEquals: 'Chave JSON igual a',
	jsonContains: 'JSON contém valor',
	jsonKeyExists: 'Chave JSON existe',
	leadHasConversion: 'Lead tem conversão',
	leadNotHasConversion: 'Lead não tem conversão'
};

// Utility types for specific use cases
export type BusinessRulesOnly = Omit<RuleGroup, 'periodFilter'>;
export type TemporalFilterOnly = Pick<RuleGroup, 'periodFilter'>;

export interface Segment {
	id: string;
	organization_id: string;
	name: string;
	description: string | null;
	rule_json: SegmentRuleJson; // Properly typed JSONB field for rule engine configuration
	created_at: string;
	updated_at: string;
	lead_count: number; // From segments_with_leads_count view
}

export interface SegmentsPageData {
	segments: Segment[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}
