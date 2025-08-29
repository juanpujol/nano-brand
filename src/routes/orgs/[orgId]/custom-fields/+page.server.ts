import type { PageServerLoad } from './$types';
import { fetchCustomFieldsDefinitions } from '$lib/remote/custom-fields.remote';

export const load: PageServerLoad = async ({ params, url }) => {
	// Get pagination and search parameters from URL
	const page = parseInt(url.searchParams.get('page') || '1');
	const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
	const searchTerm = url.searchParams.get('search')?.trim() || '';

	try {
		// Use remote function for data fetching with pagination
		const result = await fetchCustomFieldsDefinitions({
			organizationId: params.orgId as string,
			search: searchTerm,
			page,
			pageSize,
			includeCount: true
		});

		// Since we're using pagination, the result should have the paginated structure
		if (typeof result === 'object' && 'customFields' in result) {
			return result;
		}

		// Fallback in case something went wrong
		return {
			customFields: [],
			total: 0,
			page,
			pageSize,
			totalPages: 0
		};
	} catch (error) {
		console.error('Error in custom fields load function:', error);
		return {
			customFields: [],
			total: 0,
			page,
			pageSize,
			totalPages: 0
		};
	}
};
