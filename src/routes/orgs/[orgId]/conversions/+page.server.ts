import type { PageServerLoad } from './$types';
import type { ConversionsPageData } from '$lib/types/conversions';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const supabase = locals.supabase;

	// Get pagination and search parameters from URL
	const page = parseInt(url.searchParams.get('page') || '1');
	const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
	const searchTerm = url.searchParams.get('search')?.trim() || '';
	const offset = (page - 1) * pageSize;

	// Build query with search filter
	let countQuery = supabase
		.from('conversions')
		.select('*', { count: 'exact', head: true })
		.eq('organization_id', params.orgId);

	let dataQuery = supabase
		.from('conversions')
		.select(
			`
			*,
			leads (
				id,
				name,
				email,
				phone,
				company,
				job_title
			)
		`
		)
		.eq('organization_id', params.orgId);

	// Apply search filter if provided
	if (searchTerm) {
		countQuery = countQuery.ilike('name', `%${searchTerm}%`);
		dataQuery = dataQuery.ilike('name', `%${searchTerm}%`);
	}

	// Get total count for pagination
	const { count } = await countQuery;

	// Fetch conversions with lead data
	const { data: conversions, error } = await dataQuery
		.order('date', { ascending: false })
		.range(offset, offset + pageSize - 1);

	if (error) {
		console.error('Error loading conversions:', error);
		return {
			conversions: [],
			total: 0,
			page,
			pageSize,
			totalPages: 0
		};
	}

	const total = count || 0;
	const totalPages = Math.ceil(total / pageSize);

	const pageData: ConversionsPageData = {
		conversions: conversions || [],
		total,
		page,
		pageSize,
		totalPages
	};

	return pageData;
};
