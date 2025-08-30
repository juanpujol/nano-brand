import {
	array,
	object,
	string,
	optional,
	boolean,
	number,
	pipe,
	minLength,
	unknown,
	type InferInput
} from 'valibot';

// Form schemas (for superforms - user-friendly messages)
export const createWebhookFormSchema = object({
	name: pipe(string('Nome deve ser um texto'), minLength(2, 'Nome é obrigatório')),
	description: optional(string(), '')
});

export const updateWebhookFormSchema = object({
	name: pipe(string('Nome deve ser um texto'), minLength(1, 'Nome é obrigatório')),
	description: optional(string(), ''),
	isActive: optional(boolean('Estado ativo deve ser verdadeiro ou falso'), false)
});

// Remote function schemas (for database operations)
export const fetchWebhooksSchema = object({
	organizationId: string(),
	page: optional(number()),
	pageSize: optional(number()),
	search: optional(string()),
	includeCount: optional(boolean()),
	columns: optional(array(string()))
});

export const fetchWebhookByIdSchema = object({
	webhookId: string(),
	organizationId: string()
});

export const createWebhookRemoteSchema = object({
	organizationId: string(),
	name: string(),
	description: optional(string()),
	is_active: optional(boolean(), false)
});

export const updateWebhookRemoteSchema = object({
	webhookId: string(),
	organizationId: string(),
	name: string(),
	description: optional(string()),
	is_active: boolean()
});

export const deleteWebhookSchema = object({
	webhookId: string(),
	organizationId: string()
});

export const rotateSecretKeySchema = object({
	webhookId: string(),
	organizationId: string()
});

export const updateWebhookMappingsSchema = object({
	webhookId: string(),
	organizationId: string(),
	mappings: unknown(), // Will contain the field mappings object
	samplePayload: optional(unknown()) // Optional sample payload to save
});

export const updateCaptureNextSchema = object({
	webhookId: string(),
	organizationId: string(),
	captureNext: boolean()
});

// Export inferred types
export type CreateWebhookFormInput = InferInput<typeof createWebhookFormSchema>;
export type UpdateWebhookFormInput = InferInput<typeof updateWebhookFormSchema>;
export type FetchWebhooksParams = InferInput<typeof fetchWebhooksSchema>;
export type FetchWebhookByIdParams = InferInput<typeof fetchWebhookByIdSchema>;
export type CreateWebhookParams = InferInput<typeof createWebhookRemoteSchema>;
export type UpdateWebhookParams = InferInput<typeof updateWebhookRemoteSchema>;
export type DeleteWebhookParams = InferInput<typeof deleteWebhookSchema>;
export type RotateSecretKeyParams = InferInput<typeof rotateSecretKeySchema>;
export type UpdateMappingsParams = InferInput<typeof updateWebhookMappingsSchema>;
export type UpdateCaptureNextParams = InferInput<typeof updateCaptureNextSchema>;

// Database return type (not from schema - represents the actual table structure)
export interface Webhook {
	id: string;
	organization_id: string;
	name: string;
	description: string | null;
	is_active: boolean;
	capture_next: boolean;
	secret_key: string;
	sample_payload: unknown;
	field_mappings: unknown;
	created_at: string;
	updated_at: string;
}
