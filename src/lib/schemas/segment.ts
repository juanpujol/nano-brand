import {
	array,
	boolean,
	minLength,
	number,
	object,
	optional,
	pipe,
	string,
	unknown,
	type InferInput
} from 'valibot';

// Form schemas (for superforms - user-friendly messages)
export const createSegmentFormSchema = object({
	name: pipe(string('Nome deve ser um texto'), minLength(2, 'Nome é obrigatório')),
	description: optional(string(), ''),
	rules: unknown() // Complex rule structure
});

export const updateSegmentFormSchema = object({
	name: pipe(string('Nome deve ser um texto'), minLength(1, 'Nome é obrigatório')),
	description: optional(string(), ''),
	rules: unknown() // Complex rule structure
});

// Remote function schemas (for database operations)
export const fetchSegmentsSchema = object({
	organizationId: string(),
	page: optional(number()),
	pageSize: optional(number()),
	search: optional(string()),
	includeCount: optional(boolean()),
	columns: optional(array(string()))
});

export const fetchSegmentByIdSchema = object({
	segmentId: string(),
	organizationId: string()
});

export const createSegmentRemoteSchema = object({
	organizationId: string(),
	name: pipe(string(), minLength(1, 'Nome é obrigatório')),
	description: optional(string()),
	rules: unknown() // JSON rule structure with validation in function
});

export const updateSegmentRemoteSchema = object({
	segmentId: string(),
	organizationId: string(),
	name: pipe(string(), minLength(1, 'Nome é obrigatório')),
	description: optional(string()),
	rules: unknown() // JSON rule structure with validation in function
});

export const deleteSegmentSchema = object({
	segmentId: string(),
	organizationId: string()
});

// Preview and query schemas
export const previewSegmentCountSchema = object({
	organizationId: string(),
	rules: string() // JSON string of rules
});

export const fetchSegmentLeadsSchema = object({
	organizationId: string(),
	rules: string(), // JSON string of rules
	limit: optional(number()),
	offset: optional(number()),
	orderBy: optional(string())
});

// Export inferred types
export type CreateSegmentFormInput = InferInput<typeof createSegmentFormSchema>;
export type UpdateSegmentFormInput = InferInput<typeof updateSegmentFormSchema>;
export type FetchSegmentsParams = InferInput<typeof fetchSegmentsSchema>;
export type FetchSegmentByIdParams = InferInput<typeof fetchSegmentByIdSchema>;
export type CreateSegmentParams = InferInput<typeof createSegmentRemoteSchema>;
export type UpdateSegmentParams = InferInput<typeof updateSegmentRemoteSchema>;
export type DeleteSegmentParams = InferInput<typeof deleteSegmentSchema>;
export type PreviewSegmentCountParams = InferInput<typeof previewSegmentCountSchema>;
export type FetchSegmentLeadsParams = InferInput<typeof fetchSegmentLeadsSchema>;

// Database return type (not from schema - represents the actual table structure)
export interface Segment {
	id: string;
	organization_id: string;
	name: string;
	description: string | null;
	rule_json: unknown; // Complex rule structure
	created_at: string;
	updated_at: string;
}

export interface SegmentLead {
	id: string;
	email: string;
	name: string | null;
	phone: string | null;
	company: string | null;
	created_at: string;
	updated_at: string;
	// Additional fields from the leads table and custom fields
	[key: string]: unknown;
}

export interface SegmentLeadsResult {
	leads: SegmentLead[];
	pagination: {
		limit: number;
		offset: number;
		total: number;
		hasMore: boolean;
	};
}

export interface SegmentPreviewResult {
	previewCount: number;
}
