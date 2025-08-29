export interface CustomFieldData {
	label: string;
	field_key: string;
	description: string;
	type: string;
	is_required: boolean;
}

export interface UpdateCustomFieldData {
	label: string;
	description: string | null;
	is_required: boolean;
}

// New simplified mapping structure: targetField -> webhookField
export type TargetFieldMappings = Record<string, string>;

// For field-mapping utils that need the type property
export interface TargetField {
	key: string;
	label: string;
	type: 'lead' | 'conversion' | 'custom_field';
	isRequired: boolean;
}

// For target field sections (simpler structure for UI)
export interface TargetFieldSection {
	key: string;
	label: string;
	isRequired: boolean;
}

export interface TargetFieldSections {
	lead: TargetFieldSection[];
	conversion: TargetFieldSection[];
	custom: TargetFieldSection[];
}

export interface CustomFieldDefinition {
	field_key: string;
	label: string;
	type: string;
}
