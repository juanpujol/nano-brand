import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { createWebhookFormSchema } from '$lib/schemas/webhook';
import { fetchWebhooks, createWebhook } from '$lib/remote/webhooks.remote';

export const load: PageServerLoad = async ({ params, url }) => {
	const orgId = params.orgId;

	// Get pagination parameters from URL
	const page = parseInt(url.searchParams.get('page') || '1');
	const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
	const searchTerm = url.searchParams.get('search')?.trim() || '';

	// Use remote function to fetch webhooks
	const result = await fetchWebhooks({
		organizationId: orgId,
		page,
		pageSize,
		search: searchTerm,
		includeCount: true
	});

	// Initialize create webhook form
	const createForm = await superValidate({ name: '' }, valibot(createWebhookFormSchema), {
		errors: false
	});

	return {
		...result,
		createForm
	};
};

export const actions: Actions = {
	create: async ({ request, params }) => {
		const orgId = params.orgId;

		// Validate form data with superforms
		const form = await superValidate(request, valibot(createWebhookFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// Use remote function to create webhook
			const webhook = await createWebhook({
				organizationId: orgId,
				name: form.data.name,
				description: form.data.description || undefined,
				is_active: false
			});

			// Redirect to the webhook edit page
			redirect(302, `/orgs/${orgId}/settings/integrations/webhooks/${webhook.id}`);
		} catch (error) {
			console.error('Error creating webhook:', error);
			return message(form, 'Erro ao criar webhook', { status: 500 });
		}
	}
};
