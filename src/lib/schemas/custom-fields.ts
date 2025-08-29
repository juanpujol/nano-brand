import {
	array,
	boolean,
	minLength,
	number,
	object,
	optional,
	pipe,
	regex,
	string,
	type InferInput
} from 'valibot';

// Remote function schemas (for database operations)
export const fetchCustomFieldsDefinitionsSchema = object({
	organizationId: string(),
	columns: optional(array(string())),
	search: optional(string()),
	page: optional(number()),
	pageSize: optional(number()),
	includeCount: optional(boolean())
});

export const createCustomFieldDefinitionSchema = object({
	organizationId: string(),
	label: pipe(string(), minLength(1, 'Título é obrigatório')),
	fieldKey: pipe(
		string(),
		minLength(1, 'Chave do campo é obrigatória'),
		regex(/^[a-z_][a-z0-9_]*$/, 'Chave deve conter apenas letras minúsculas, números e underscore')
	),
	description: optional(string()),
	type: pipe(
		string(),
		regex(/^(text|number|date|boolean)$/, 'Tipo deve ser text, number, date ou boolean')
	),
	isRequired: boolean()
});

export const updateCustomFieldDefinitionSchema = object({
	fieldId: string(),
	organizationId: string(),
	label: pipe(string(), minLength(1, 'Título é obrigatório')),
	description: optional(string()),
	isRequired: boolean()
});

export const deleteCustomFieldDefinitionSchema = object({
	fieldId: string(),
	organizationId: string()
});

// Export inferred types
export type FetchCustomFieldsParams = InferInput<typeof fetchCustomFieldsDefinitionsSchema>;
export type CreateCustomFieldParams = InferInput<typeof createCustomFieldDefinitionSchema>;
export type UpdateCustomFieldParams = InferInput<typeof updateCustomFieldDefinitionSchema>;
export type DeleteCustomFieldParams = InferInput<typeof deleteCustomFieldDefinitionSchema>;

// Database return types (not from schema - represents the actual table structure)
export interface LeadsCustomFieldDefinition {
	id: string;
	organization_id: string;
	field_key: string;
	label: string;
	description: string | null;
	type: 'text' | 'number' | 'date' | 'boolean';
	is_required: boolean;
	created_at: string;
	updated_at: string;
	usage_count: number;
}

export interface CustomFieldsPageData {
	customFields: LeadsCustomFieldDefinition[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}
