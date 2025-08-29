import { getRequestEvent, query } from '$app/server';
import { object, string } from 'valibot';
import type { Lead } from '$lib/types/leads';

interface LeadWithCustomField extends Lead {
	field_value: string;
}

// Validation schema for the parameters
const getLeadSchema = object({
	leadId: string()
});

const getLeadsSchema = object({
	fieldKey: string(),
	organizationId: string(),
	offset: string(),
	limit: string(),
	totalCount: string()
});

const getCustomFieldsSchema = object({
	leadId: string()
});

export const getLeadForConversion = query(getLeadSchema, async ({ leadId }) => {
	try {
		const { locals } = getRequestEvent();
		const supabase = locals.supabase;

		const { data, error } = await supabase.from('leads').select('*').eq('id', leadId).single();

		if (error) {
			console.error('Error fetching lead data:', error);
			throw new Error('Erro ao carregar dados do lead');
		}

		return data as Lead;
	} catch (err) {
		console.error('Unexpected error in getLeadForConversion:', err);
		throw err instanceof Error ? err : new Error('Erro interno do servidor');
	}
});

export const getLeadsWithCustomField = query(
	getLeadsSchema,
	async ({ fieldKey, organizationId, offset, limit, totalCount }) => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			const offsetNum = parseInt(offset);
			const limitNum = parseInt(limit);
			const totalCountNum = parseInt(totalCount);

			// Get paginated data
			const { data, error } = await supabase
				.from('leads')
				.select(
					`
				*,
				field_value:leads_custom_fields!inner(field_value)
			`
				)
				.eq('leads_custom_fields.field_key', fieldKey)
				.eq('leads_custom_fields.organization_id', organizationId)
				.order('name')
				.range(offsetNum, offsetNum + limitNum - 1);

			if (error) {
				console.error('Error fetching leads with custom field:', error);
				throw new Error('Erro ao carregar leads');
			}

			// Transform the data to flatten the field_value
			const leads: LeadWithCustomField[] = (data || []).map(
				(lead: Lead & { field_value: { field_value: string }[] }) => ({
					...lead,
					field_value: lead.field_value?.[0]?.field_value || ''
				})
			);

			return { leads, totalCount: totalCountNum };
		} catch (err) {
			console.error('Unexpected error in getLeadsWithCustomField:', err);
			throw err instanceof Error ? err : new Error('Erro interno do servidor');
		}
	}
);

export const getCustomFieldsForLead = query(getCustomFieldsSchema, async ({ leadId }) => {
	try {
		const { locals } = getRequestEvent();
		const supabase = locals.supabase;

		const { data, error } = await supabase
			.from('leads_custom_fields')
			.select('field_key, field_value')
			.eq('lead_id', leadId);

		if (error) {
			console.error('Error fetching custom fields:', error);
			throw new Error('Erro ao carregar campos personalizados');
		}

		return (data || []) as Array<{ field_key: string; field_value: string }>;
	} catch (err) {
		console.error('Unexpected error in getCustomFieldsForLead:', err);
		throw err instanceof Error ? err : new Error('Erro interno do servidor');
	}
});
