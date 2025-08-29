import { getRequestEvent, query } from '$app/server';
import { object, string } from 'valibot';
import type { Conversion } from '$lib/types/conversions';

// Validation schema for the parameters
const getConversionsSchema = object({
	leadId: string()
});

export const getConversionsForLead = query(getConversionsSchema, async ({ leadId }) => {
	try {
		const { locals } = getRequestEvent();
		const supabase = locals.supabase;

		const { data, error } = await supabase
			.from('conversions')
			.select('*')
			.eq('lead_id', leadId)
			.order('date', { ascending: false });

		if (error) {
			console.error('Error fetching conversions:', error);
			throw new Error('Erro ao carregar conversões');
		}

		return (data || []) as Conversion[];
	} catch (err) {
		console.error('Unexpected error in getConversionsForLead:', err);
		throw err instanceof Error ? err : new Error('Erro interno do servidor');
	}
});
