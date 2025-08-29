import type { PageServerLoad } from './$types';
import type { LeadsPageData } from '$lib/types/leads';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const supabase = locals.supabase;

	// Get pagination and search parameters from URL
	const page = parseInt(url.searchParams.get('page') || '1');
	const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
	const searchTerm = url.searchParams.get('search')?.trim() || '';
	const offset = (page - 1) * pageSize;

	// Build query with search filter
	let countQuery = supabase
		.from('leads')
		.select('*', { count: 'exact', head: true })
		.eq('organization_id', params.orgId);

	let dataQuery = supabase.from('leads').select('*').eq('organization_id', params.orgId);

	// Apply search filter if provided - search both name and email
	if (searchTerm) {
		const searchFilter = `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`;
		countQuery = countQuery.or(searchFilter);
		dataQuery = dataQuery.or(searchFilter);
	}

	// Get total count for pagination
	const { count } = await countQuery;

	// Fetch leads data
	const { data: leads, error } = await dataQuery
		.order('created_at', { ascending: false })
		.range(offset, offset + pageSize - 1);

	if (error) {
		console.error('Error loading leads:', error);
		return {
			leads: [],
			total: 0,
			page,
			pageSize,
			totalPages: 0
		};
	}

	const total = count || 0;
	const totalPages = Math.ceil(total / pageSize);

	const pageData: LeadsPageData = {
		leads: leads || [],
		total,
		page,
		pageSize,
		totalPages
	};

	return pageData;
};
