import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	const supabase = locals.supabase;

	// Get the segment data
	const { data: segment, error: segmentError } = await supabase
		.from('segments')
		.select('*')
		.eq('id', params.segmentId)
		.eq('organization_id', params.orgId)
		.single();

	if (segmentError || !segment) {
		error(404, 'Segmento não encontrado');
	}

	// Get custom fields for this organization
	const { data: customFields, error: customFieldsError } = await supabase
		.from('leads_custom_fields_definitions')
		.select('field_key, label, type')
		.eq('organization_id', params.orgId)
		.order('label');

	if (customFieldsError) {
		console.error('Error loading custom fields:', customFieldsError);
		return {
			segment,
			customFields: []
		};
	}

	return {
		segment,
		customFields: customFields || []
	};
};
