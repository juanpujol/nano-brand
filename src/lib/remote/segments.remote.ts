import { command, form, getRequestEvent, query } from '$app/server';
import { object, string } from 'valibot';
import { error, redirect } from '@sveltejs/kit';
import type { PeriodFilter, RelativePeriodValue } from '$lib/types/segments';

// Validation schemas for query functions
const previewSegmentSchema = object({
	organizationId: string(),
	rules: string()
});

const fetchSegmentLeadsSchema = object({
	organizationId: string(),
	rules: string()
});

const deleteSegmentSchema = object({
	organizationId: string(),
	segmentId: string()
});

// Convert relative period values to date range
function convertRelativePeriodToDates(relativeValue: RelativePeriodValue): {
	start: Date;
	end: Date;
} {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	switch (relativeValue) {
		case 'today':
			return {
				start: new Date(today),
				end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
			};

		case 'yesterday': {
			const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
			return {
				start: yesterday,
				end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
			};
		}

		case 'thisWeek': {
			const startOfWeek = new Date(today);
			startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
			const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
			return { start: startOfWeek, end: endOfWeek };
		}

		case 'lastWeek': {
			const startOfLastWeek = new Date(today);
			startOfLastWeek.setDate(today.getDate() - today.getDay() - 7); // Last Sunday
			const endOfLastWeek = new Date(startOfLastWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
			return { start: startOfLastWeek, end: endOfLastWeek };
		}

		case 'thisMonth': {
			const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
			const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
			return { start: startOfMonth, end: endOfMonth };
		}

		case 'lastMonth': {
			const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
			const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
			return { start: startOfLastMonth, end: endOfLastMonth };
		}

		case 'automatic':
		case 'none': {
			// Return current day for automatic/none
			return {
				start: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
				end: today
			};
		}

		case 'absolute': {
			// For fixed dates, this should be handled elsewhere with absoluteStart/absoluteEnd
			return { start: today, end: today };
		}

		case 'thisQuarter': {
			const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
			const startOfQuarter = new Date(today.getFullYear(), quarterStartMonth, 1);
			const endOfQuarter = new Date(today.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999);
			return { start: startOfQuarter, end: endOfQuarter };
		}

		case 'lastQuarter': {
			const currentQuarterStart = Math.floor(today.getMonth() / 3) * 3;
			const lastQuarterStart = currentQuarterStart - 3;
			let year = today.getFullYear();
			let startMonth = lastQuarterStart;

			if (lastQuarterStart < 0) {
				year--;
				startMonth = 9; // Q4 of previous year
			}

			const startOfLastQuarter = new Date(year, startMonth, 1);
			const endOfLastQuarter = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
			return { start: startOfLastQuarter, end: endOfLastQuarter };
		}

		default:
			// Default to today
			return {
				start: new Date(today),
				end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
			};
	}
}

export const createSegment = form(async (data) => {
	try {
		// Manual validation
		const organizationId = data.get('organizationId') as string;
		const name = data.get('name') as string;
		const description = data.get('description') as string | null;
		const rules = data.get('rules') as string;

		// Validate required fields
		if (!organizationId) {
			error(400, 'Organization ID is required');
		}
		if (!name?.trim()) {
			error(400, 'Nome do segmento é obrigatório');
		}
		if (!rules) {
			error(400, 'Rules are required');
		}

		const { locals } = getRequestEvent();
		const supabase = locals.supabase;

		// Parse and validate rules JSON
		let ruleJson: Record<string, unknown>;
		try {
			ruleJson = JSON.parse(rules);
		} catch (err) {
			console.error('Error parsing rules:', err);
			error(400, 'Regras do segmento inválidas');
		}

		// Ensure ruleJson is not null and has required structure
		if (!ruleJson || typeof ruleJson !== 'object') {
			error(400, 'Regras do segmento inválidas');
		}

		// Basic rule validation - ensure we have combinator and rules array
		if (!ruleJson.combinator || !Array.isArray(ruleJson.rules)) {
			error(400, 'Estrutura das regras do segmento inválida');
		}

		// Check if there are actually rules defined
		if (ruleJson.rules.length === 0) {
			error(
				400,
				'Adicione pelo menos uma regra de segmentação antes de salvar. Use o botão "Adicionar Regra" para criar critérios de filtragem.'
			);
		}

		// Check for duplicate name in organization
		const { data: existing } = await supabase
			.from('segments')
			.select('id')
			.eq('organization_id', organizationId)
			.eq('name', name.trim())
			.single();

		if (existing) {
			error(400, 'Já existe um segmento com este nome');
		}

		// Create the segment
		const { error: insertError } = await supabase
			.from('segments')
			.insert({
				organization_id: organizationId,
				name: name.trim(),
				description: description ? description.trim() || null : null,
				rule_json: ruleJson
			})
			.select('id')
			.single();

		if (insertError) {
			console.error('Error creating segment:', insertError);
			error(500, `Erro ao criar segmento: ${insertError.message || 'Erro desconhecido'}`);
		}

		// Redirect to segments list
		redirect(303, `/orgs/${organizationId}/segments`);
	} catch (err) {
		console.error('Unexpected error creating segment:', err);
		// Don't catch redirects - let them pass through
		if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
			throw err;
		}
		error(500, 'Erro interno do servidor');
	}
});

export const updateSegment = form(async (data) => {
	try {
		// Manual validation
		const organizationId = data.get('organizationId') as string;
		const segmentId = data.get('segmentId') as string;
		const name = data.get('name') as string;
		const description = data.get('description') as string | null;
		const rules = data.get('rules') as string;

		// Validate required fields
		if (!organizationId) {
			error(400, 'Organization ID is required');
		}
		if (!segmentId) {
			error(400, 'Segment ID is required');
		}
		if (!name?.trim()) {
			error(400, 'Nome do segmento é obrigatório');
		}
		if (!rules) {
			error(400, 'Rules are required');
		}

		const { locals } = getRequestEvent();
		const supabase = locals.supabase;

		// Parse and validate rules JSON
		let ruleJson: Record<string, unknown>;
		try {
			ruleJson = JSON.parse(rules);
		} catch {
			error(400, 'Regras do segmento inválidas');
		}

		// Basic rule validation
		if (!ruleJson.combinator && !ruleJson.rules) {
			error(400, 'Pelo menos uma regra deve ser definida');
		}

		// Check for duplicate name in organization (exclude current segment)
		const { data: existing } = await supabase
			.from('segments')
			.select('id')
			.eq('organization_id', organizationId)
			.eq('name', name.trim())
			.neq('id', segmentId)
			.single();

		if (existing) {
			error(400, 'Já existe um segmento com este nome');
		}

		// Update the segment
		const { error: updateError } = await supabase
			.from('segments')
			.update({
				name: name.trim(),
				description: description ? description.trim() || null : null,
				rule_json: ruleJson,
				updated_at: new Date().toISOString()
			})
			.eq('id', segmentId)
			.eq('organization_id', organizationId);

		if (updateError) {
			console.error('Error updating segment:', updateError);
			error(500, 'Erro ao atualizar segmento. Tente novamente.');
		}

		// Redirect to segments list
		redirect(303, `/orgs/${organizationId}/segments`);
	} catch (err) {
		console.error('Unexpected error updating segment:', err);
		// Don't catch redirects - let them pass through
		if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
			throw err;
		}
		error(500, 'Erro interno do servidor');
	}
});

export const deleteSegment = command(deleteSegmentSchema, async ({ organizationId, segmentId }) => {
	try {
		const { locals } = getRequestEvent();
		const supabase = locals.supabase;

		// Delete the segment
		const { error: deleteError } = await supabase
			.from('segments')
			.delete()
			.eq('id', segmentId)
			.eq('organization_id', organizationId);

		if (deleteError) {
			console.error('Error deleting segment:', deleteError);
			throw new Error('Erro ao excluir segmento. Tente novamente.');
		}

		// Redirect to segments list
		redirect(303, `/orgs/${organizationId}/segments`);
	} catch (err) {
		console.error('Unexpected error deleting segment:', err);
		if (err instanceof Error && err.message.includes('redirect')) {
			throw err;
		}
		throw new Error('Erro interno do servidor');
	}
});

export const previewSegmentCount = query(
	previewSegmentSchema,
	async ({ organizationId, rules }) => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			// Parse rules JSON
			let ruleJson: Record<string, unknown>;
			try {
				ruleJson = JSON.parse(rules);
			} catch {
				throw new Error('Regras inválidas');
			}

			// Extract periodFilter if it exists
			const periodFilter = ruleJson.periodFilter as PeriodFilter | undefined;
			let timeFilterType = 'lead.createdAt';
			let periodStart: string | null = null;
			let periodEnd: string | null = null;

			if (periodFilter) {
				timeFilterType = periodFilter.timeFilterType;

				// Convert relative periods to dates
				if (
					periodFilter.periodValue.type === 'relative' &&
					periodFilter.periodValue.relativeValue
				) {
					const dateRange = convertRelativePeriodToDates(periodFilter.periodValue.relativeValue);
					// Convert to YYYY-MM-DD format for PostgreSQL
					periodStart = dateRange.start.toISOString().split('T')[0];
					periodEnd = dateRange.end.toISOString().split('T')[0];
				} else if (
					periodFilter.periodValue.type === 'absolute' &&
					periodFilter.periodValue.dateRange
				) {
					// Handle absolute date ranges
					const from = periodFilter.periodValue.dateRange.from;
					const to = periodFilter.periodValue.dateRange.to;

					if (from) {
						periodStart =
							typeof from === 'string' ? from.split('T')[0] : from.toISOString().split('T')[0];
					}
					if (to) {
						periodEnd = typeof to === 'string' ? to.split('T')[0] : to.toISOString().split('T')[0];
					}
				}
			}

			// Call the database function with time filter parameters
			const dbParams: Record<string, unknown> = {
				p_organization_id: organizationId,
				p_rule_json: ruleJson,
				p_time_filter_type: timeFilterType
			};

			if (periodStart && periodEnd) {
				dbParams.p_period_start = periodStart;
				dbParams.p_period_end = periodEnd;
			}

			const { data, error } = await supabase.rpc('count_leads_by_segment_rules', dbParams);

			if (error) {
				console.error('Error counting leads:', error);
				throw new Error('Erro ao contar leads');
			}

			return {
				previewCount: data || 0
			};
		} catch (err) {
			console.error('Unexpected error in preview:', err);
			throw err instanceof Error ? err : new Error('Erro interno');
		}
	}
);

export const fetchSegmentLeads = query(
	fetchSegmentLeadsSchema,
	async ({ organizationId, rules }) => {
		try {
			const { locals, url } = getRequestEvent();
			const supabase = locals.supabase;

			// Parse rules JSON
			let ruleJson: Record<string, unknown>;
			try {
				ruleJson = JSON.parse(rules);
			} catch {
				throw new Error('Regras inválidas');
			}

			// Extract periodFilter if it exists
			const periodFilter = ruleJson.periodFilter as PeriodFilter | undefined;
			let timeFilterType = 'lead.createdAt';
			let periodStart: string | null = null;
			let periodEnd: string | null = null;

			if (periodFilter) {
				timeFilterType = periodFilter.timeFilterType;

				// Convert relative periods to dates
				if (
					periodFilter.periodValue.type === 'relative' &&
					periodFilter.periodValue.relativeValue
				) {
					const dateRange = convertRelativePeriodToDates(periodFilter.periodValue.relativeValue);
					// Convert to YYYY-MM-DD format for PostgreSQL
					periodStart = dateRange.start.toISOString().split('T')[0];
					periodEnd = dateRange.end.toISOString().split('T')[0];
				} else if (
					periodFilter.periodValue.type === 'absolute' &&
					periodFilter.periodValue.dateRange
				) {
					// Handle absolute date ranges
					const from = periodFilter.periodValue.dateRange.from;
					const to = periodFilter.periodValue.dateRange.to;

					if (from) {
						periodStart =
							typeof from === 'string' ? from.split('T')[0] : from.toISOString().split('T')[0];
					}
					if (to) {
						periodEnd = typeof to === 'string' ? to.split('T')[0] : to.toISOString().split('T')[0];
					}
				}
			}

			// Get pagination and sorting from URL searchParams
			const searchParams = url.searchParams;
			const limit = parseInt(searchParams.get('limit') || '100');
			const offset = parseInt(searchParams.get('offset') || '0');
			const orderBy = searchParams.get('orderBy') || 'created_at DESC';

			// Call the database function with all parameters
			const dbParams: Record<string, unknown> = {
				p_organization_id: organizationId,
				p_rule_json: ruleJson,
				p_time_filter_type: timeFilterType,
				p_limit: limit,
				p_offset: offset,
				p_order_by: orderBy
			};

			if (periodStart && periodEnd) {
				dbParams.p_period_start = periodStart;
				dbParams.p_period_end = periodEnd;
			}

			const { data, error } = await supabase.rpc('get_leads_by_segment_rules', dbParams);

			if (error) {
				console.error('Error fetching leads:', error);
				throw new Error('Erro ao buscar leads');
			}

			return {
				leads: data || [],
				pagination: {
					limit,
					offset,
					total: data?.length || 0,
					hasMore: (data?.length || 0) === limit
				}
			};
		} catch (err) {
			console.error('Unexpected error fetching leads:', err);
			throw err instanceof Error ? err : new Error('Erro interno');
		}
	}
);
