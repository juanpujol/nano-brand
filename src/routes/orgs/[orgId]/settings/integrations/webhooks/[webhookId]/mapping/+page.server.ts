import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { fetchWebhookById } from '$lib/remote/webhooks.remote';
import { fetchCustomFieldsDefinitions } from '$lib/remote/custom-fields.remote';
import type { LeadsCustomFieldDefinition } from '$lib/schemas/custom-fields';

export const load: PageServerLoad = async ({ params }) => {
	try {
		// Use remote functions to fetch webhook and custom fields in parallel
		const [webhookResult, customFieldsResult] = await Promise.allSettled([
			fetchWebhookById({
				webhookId: params.webhookId,
				organizationId: params.orgId
			}),
			fetchCustomFieldsDefinitions({
				organizationId: params.orgId,
				columns: ['field_key', 'label']
			})
		]);

		// Handle webhook result - this is required
		if (webhookResult.status === 'rejected') {
			console.error('Error loading webhook for mapping:', webhookResult.reason);
			error(404, 'Webhook não encontrado');
		}

		// Handle custom fields result - this is optional, fallback to empty array
		let customFields: LeadsCustomFieldDefinition[] = [];
		if (customFieldsResult.status === 'fulfilled') {
			// Since we're not providing pagination params, this will be an array
			customFields = Array.isArray(customFieldsResult.value) ? customFieldsResult.value : [];
		} else {
			console.error('Error loading custom fields for mapping:', customFieldsResult.reason);
			// Don't fail the page load, just use empty array
		}

		return {
			webhook: webhookResult.value,
			customFields
		};
	} catch (err) {
		console.error('Unexpected error in webhook mapping load:', err);
		error(500, 'Erro interno do servidor');
	}
};
