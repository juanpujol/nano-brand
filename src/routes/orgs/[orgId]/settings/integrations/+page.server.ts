import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	const orgId = params.orgId;

	// Fetch active webhooks count for the organization
	const { count: activeWebhooksCount, error } = await supabase
		.from('webhooks')
		.select('*', { count: 'exact', head: true })
		.eq('organization_id', orgId)
		.eq('is_active', true);

	if (error) {
		console.error('Error fetching active webhooks count:', error);
		return {
			activeWebhooksCount: 0
		};
	}

	return {
		activeWebhooksCount: activeWebhooksCount || 0
	};
};
