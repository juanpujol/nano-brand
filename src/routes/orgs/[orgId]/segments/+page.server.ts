import type { PageServerLoad } from './$types';
import type { SegmentsPageData } from '$lib/types/segments';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const supabase = locals.supabase;

	// Get pagination and search parameters from URL
	const page = parseInt(url.searchParams.get('page') || '1');
	const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
	const searchTerm = url.searchParams.get('search')?.trim() || '';
	const offset = (page - 1) * pageSize;

	// Build single query with both data and count
	let query = supabase
		.from('segments_with_leads_count')
		.select('*', { count: 'exact' })
		.eq('organization_id', params.orgId);

	// Apply search filter if provided - search both name and description
	if (searchTerm) {
		const searchFilter = `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`;
		query = query.or(searchFilter);
	}

	// Fetch segments data with count in single query
	const {
		data: segments,
		error,
		count
	} = await query
		.order('updated_at', { ascending: false })
		.order('name', { ascending: true })
		.range(offset, offset + pageSize - 1);

	if (error) {
		console.error('Error loading segments:', error);
		return {
			segments: [],
			total: 0,
			page,
			pageSize,
			totalPages: 0
		};
	}

	const total = count || 0;
	const totalPages = Math.ceil(total / pageSize);

	const pageData: SegmentsPageData = {
		segments: segments || [],
		total,
		page,
		pageSize,
		totalPages
	};

	return pageData;
};
