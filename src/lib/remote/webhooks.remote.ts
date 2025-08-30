import { command, query, getRequestEvent } from '$app/server';
import { error as httpError } from '@sveltejs/kit';
import { nanoid } from '$lib/utils/id';
import {
	fetchWebhooksSchema,
	fetchWebhookByIdSchema,
	createWebhookRemoteSchema,
	updateWebhookRemoteSchema,
	deleteWebhookSchema,
	rotateSecretKeySchema,
	updateWebhookMappingsSchema,
	updateCaptureNextSchema,
	type Webhook
} from '$lib/schemas/webhook';

/**
 * Fetches webhooks with pagination, search, and sorting capabilities.
 * Supports both simple arrays and paginated results based on parameters.
 */
export const fetchWebhooks = query(
	fetchWebhooksSchema,
	async ({
		organizationId,
		columns = ['*'],
		search = '',
		page,
		pageSize,
		includeCount = false
	}) => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			// Build base query
			let countQuery = supabase
				.from('webhooks')
				.select('*', { count: 'exact', head: true })
				.eq('organization_id', organizationId);

			let dataQuery = supabase
				.from('webhooks')
				.select(columns.join(','))
				.eq('organization_id', organizationId);

			// Apply search filter if provided - search name and description
			if (search.trim()) {
				const searchFilter = `name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`;
				countQuery = countQuery.or(searchFilter);
				dataQuery = dataQuery.or(searchFilter);
			}

			// Get total count if needed
			let total = 0;
			if (includeCount) {
				const { count } = await countQuery;
				total = count || 0;
			}

			// Apply pagination if provided
			if (page && pageSize) {
				const offset = (page - 1) * pageSize;
				dataQuery = dataQuery
					.order('created_at', { ascending: false })
					.range(offset, offset + pageSize - 1);
			} else {
				dataQuery = dataQuery.order('created_at', { ascending: false });
			}

			const { data: webhooks, error } = await dataQuery;

			if (error) {
				console.error('Error fetching webhooks:', error);
				throw new Error('Erro ao carregar webhooks');
			}

			// Return paginated result if pagination was requested
			if (page && pageSize && includeCount) {
				const totalPages = Math.ceil(total / pageSize);
				return {
					webhooks: (webhooks || []) as unknown as Webhook[],
					total,
					page,
					pageSize,
					totalPages
				} as const;
			}

			// Return simple array
			return (webhooks || []) as unknown as Webhook[];
		} catch (err) {
			console.error('Unexpected error in fetchWebhooks:', err);
			throw err instanceof Error ? err : new Error('Erro interno do servidor');
		}
	}
);

/**
 * Fetches a single webhook by ID, ensuring it belongs to the organization.
 */
export const fetchWebhookById = query(
	fetchWebhookByIdSchema,
	async ({ webhookId, organizationId }) => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			const { data: webhook, error } = await supabase
				.from('webhooks')
				.select('*')
				.eq('id', webhookId)
				.eq('organization_id', organizationId)
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					throw new Error('Webhook não encontrado');
				}
				console.error('Error fetching webhook:', error);
				throw new Error('Erro ao carregar webhook');
			}

			return webhook as Webhook;
		} catch (err) {
			console.error('Unexpected error in fetchWebhookById:', err);
			throw err instanceof Error ? err : new Error('Erro interno do servidor');
		}
	}
);

/**
 * Creates a new webhook with a generated secret key.
 */
export const createWebhook = command(
	createWebhookRemoteSchema,
	async ({ organizationId, name, description, is_active = false }) => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			// Generate a secret key (24-character nanoid)
			const secretKey = nanoid(24);

			const { data, error } = await supabase
				.from('webhooks')
				.insert({
					organization_id: organizationId,
					name,
					description: description || null,
					is_active,
					secret_key: secretKey
				})
				.select()
				.single();

			if (error) {
				console.error('Error creating webhook:', error);
				throw new Error('Erro ao criar webhook');
			}

			return data as Webhook;
		} catch (err) {
			console.error('Unexpected error in createWebhook:', err);
			throw err instanceof Error ? err : new Error('Erro interno do servidor');
		}
	}
);

/**
 * Updates an existing webhook's details.
 */
export const updateWebhook = command(
	updateWebhookRemoteSchema,
	async ({ webhookId, organizationId, name, description, is_active }) => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			const { data, error } = await supabase
				.from('webhooks')
				.update({
					name,
					description: description || null,
					is_active,
					updated_at: new Date().toISOString()
				})
				.eq('id', webhookId)
				.eq('organization_id', organizationId)
				.select()
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					throw new Error('Webhook não encontrado');
				}
				console.error('Error updating webhook:', error);
				throw new Error('Erro ao atualizar webhook');
			}

			return data as Webhook;
		} catch (err) {
			console.error('Unexpected error in updateWebhook:', err);
			throw err instanceof Error ? err : new Error('Erro interno do servidor');
		}
	}
);

/**
 * Deletes a webhook.
 */
export const deleteWebhook = command(deleteWebhookSchema, async ({ webhookId, organizationId }) => {
	try {
		const { locals } = getRequestEvent();
		const supabase = locals.supabase;

		const { error } = await supabase
			.from('webhooks')
			.delete()
			.eq('id', webhookId)
			.eq('organization_id', organizationId);

		if (error) {
			console.error('Error deleting webhook:', error);
			throw new Error('Erro ao excluir webhook');
		}

		return { success: true };
	} catch (err) {
		console.error('Unexpected error in deleteWebhook:', err);
		throw err instanceof Error ? err : new Error('Erro interno do servidor');
	}
});

/**
 * Rotates the webhook's secret key by generating a new one.
 */
export const rotateWebhookSecretKey = command(
	rotateSecretKeySchema,
	async ({ webhookId, organizationId }) => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			// Generate a new secret key
			const newSecretKey = nanoid(24);

			const { data, error } = await supabase
				.from('webhooks')
				.update({
					secret_key: newSecretKey,
					updated_at: new Date().toISOString()
				})
				.eq('id', webhookId)
				.eq('organization_id', organizationId)
				.select('secret_key')
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					throw new Error('Webhook não encontrado');
				}
				console.error('Error rotating secret key:', error);
				throw new Error('Erro ao rotacionar chave secreta');
			}

			return { success: true, secret_key: data.secret_key };
		} catch (err) {
			console.error('Unexpected error in rotateWebhookSecretKey:', err);
			throw err instanceof Error ? err : new Error('Erro interno do servidor');
		}
	}
);

/**
 * Updates webhook field mappings and optionally saves a sample payload.
 */
export const updateWebhookMappings = command(
	updateWebhookMappingsSchema,
	async ({ webhookId, organizationId, mappings, samplePayload }) => {
		const { locals } = getRequestEvent();
		const supabase = locals.supabase;

		const updateData: { field_mappings: unknown; updated_at: string; sample_payload?: unknown } = {
			field_mappings: mappings,
			updated_at: new Date().toISOString()
		};

		// Include sample payload if provided
		if (samplePayload !== undefined) {
			updateData.sample_payload = samplePayload;
		}

		const { data, error } = await supabase
			.from('webhooks')
			.update(updateData)
			.eq('id', webhookId)
			.eq('organization_id', organizationId)
			.select('id')
			.single();

		if (error) {
			console.error('Error updating webhook mappings:', error);

			if (error.code === 'PGRST116') {
				httpError(404, {
					message: 'Webhook não encontrado'
				});
			}

			throw new Error('Erro ao salvar mapeamento de campos');
		}
		return { success: true, webhookId: data.id };
	}
);

/**
 * Updates the capture_next flag for a webhook.
 */
export const updateCaptureNext = command(
	updateCaptureNextSchema,
	async ({ webhookId, organizationId, captureNext }) => {
		const { locals } = getRequestEvent();
		const supabase = locals.supabase;

		const { data, error } = await supabase
			.from('webhooks')
			.update({
				capture_next: captureNext,
				updated_at: new Date().toISOString()
			})
			.eq('id', webhookId)
			.eq('organization_id', organizationId)
			.select('id')
			.single();

		if (error) {
			console.error('Error updating capture_next:', error);

			if (error.code === 'PGRST116') {
				httpError(404, {
					message: 'Webhook não encontrado'
				});
			}

			throw new Error('Erro ao atualizar captura automática');
		}
		return { success: true, webhookId: data.id };
	}
);
