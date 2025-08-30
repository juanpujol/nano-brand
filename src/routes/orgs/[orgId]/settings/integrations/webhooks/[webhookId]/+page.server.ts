import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { updateWebhookFormSchema } from '$lib/schemas/webhook';
import { fetchWebhookById, updateWebhook, deleteWebhook } from '$lib/remote/webhooks.remote';

export const load: PageServerLoad = async ({ params }) => {
	try {
		// Use remote function to fetch webhook
		const webhook = await fetchWebhookById({
			webhookId: params.webhookId,
			organizationId: params.orgId
		});

		// Initialize form with webhook data
		const form = await superValidate(
			{
				name: webhook.name,
				description: webhook.description || undefined,
				isActive: webhook.is_active
			},
			valibot(updateWebhookFormSchema)
		);

		return {
			webhook,
			form
		};
	} catch (err) {
		console.error('Error loading webhook:', err);
		error(404, 'Webhook não encontrado');
	}
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const orgId = params.orgId;
		const webhookId = params.webhookId;

		// Validate form data with superforms
		const form = await superValidate(request, valibot(updateWebhookFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// Use remote function to update webhook
			await updateWebhook({
				webhookId,
				organizationId: orgId,
				name: form.data.name,
				description: form.data.description || undefined,
				is_active: form.data.isActive
			});

			return message(form, 'Webhook atualizado com sucesso');
		} catch (error) {
			console.error('Error updating webhook:', error);
			return message(form, 'Erro ao atualizar webhook', { status: 500 });
		}
	},

	delete: async ({ params }) => {
		const orgId = params.orgId;
		const webhookId = params.webhookId;

		try {
			// Use remote function to delete webhook
			await deleteWebhook({
				webhookId,
				organizationId: orgId
			});

			// Redirect back to webhooks list
			throw redirect(302, `/orgs/${orgId}/settings/integrations/webhooks`);
		} catch (error) {
			console.error('Error deleting webhook:', error);
			return fail(500, { message: 'Erro ao excluir webhook' });
		}
	}
};
