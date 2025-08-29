import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const supabase = locals.supabase;

	// Get custom fields for this organization to include in field options
	const { data: customFields, error: customFieldsError } = await supabase
		.from('leads_custom_fields_definitions')
		.select('field_key, label, type')
		.eq('organization_id', params.orgId)
		.order('label');

	if (customFieldsError) {
		console.error('Error loading custom fields:', customFieldsError);
		return {
			customFields: []
		};
	}

	return {
		customFields: customFields || []
	};
};
