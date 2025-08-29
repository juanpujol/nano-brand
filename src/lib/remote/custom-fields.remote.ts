import { command, getRequestEvent, query } from '$app/server';
import { error as httpError } from '@sveltejs/kit';
import {
	createCustomFieldDefinitionSchema,
	deleteCustomFieldDefinitionSchema,
	fetchCustomFieldsDefinitionsSchema,
	type LeadsCustomFieldDefinition,
	updateCustomFieldDefinitionSchema
} from '$lib/schemas/custom-fields';

export const fetchCustomFieldsDefinitions = query(
	fetchCustomFieldsDefinitionsSchema,
	async ({
		organizationId,
		columns = ['*'],
		search = '',
		page,
		pageSize,
		includeCount = false
	}) => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			// Determine which table to use based on whether we need count
			const tableName = includeCount
				? 'leads_custom_fields_with_count'
				: 'leads_custom_fields_definitions';

			// Build base query
			let query = supabase
				.from(tableName)
				.select(columns.join(','), includeCount ? { count: 'exact' } : undefined)
				.eq('organization_id', organizationId);

			// Apply search filter if provided
			if (search.trim()) {
				const searchFilter = `field_key.ilike.%${search.trim()}%,label.ilike.%${search.trim()}%`;
				query = query.or(searchFilter);
			}

			// Apply pagination if provided
			if (page && pageSize) {
				const offset = (page - 1) * pageSize;
				query = query
					.order('usage_count', { ascending: false })
					.order('label', { ascending: true })
					.range(offset, offset + pageSize - 1);
			} else {
				query = query.order('label', { ascending: true });
			}

			const result = await query;
			const { data, error, count } = result;

			if (error) {
				console.error('Error fetching custom fields:', error);
				throw new Error('Erro ao carregar campos personalizados');
			}

			// Return paginated result if pagination was requested
			if (page && pageSize) {
				const total = count || 0;
				const totalPages = Math.ceil(total / pageSize);

				return {
					customFields: (data || []) as unknown as LeadsCustomFieldDefinition[],
					total,
					page,
					pageSize,
					totalPages
				} as const;
			}

			// Return simple array for non-paginated requests
			return (data || []) as unknown as LeadsCustomFieldDefinition[];
		} catch (err) {
			console.error('Unexpected error in fetchCustomFieldsDefinitions:', err);
			throw err instanceof Error ? err : new Error('Erro interno do servidor');
		}
	}
);

export const createCustomFieldDefinition = command(
	createCustomFieldDefinitionSchema,
	async ({ organizationId, label, fieldKey, description, type, isRequired }) => {
		const { locals } = getRequestEvent();
		const supabase = locals.supabase;

		// Create the custom field (database will handle duplicate key constraint)
		const { data, error } = await supabase
			.from('leads_custom_fields_definitions')
			.insert({
				organization_id: organizationId,
				field_key: fieldKey,
				label,
				description: description || null,
				type,
				is_required: isRequired
			})
			.select()
			.single();

		if (error) {
			console.error('Error creating custom field:', error);

			// Check for duplicate key constraint violation
			if (error.code === '23505') {
				httpError(400, {
					message: 'Validation failed',
					issues: [
						{
							path: 'fieldKey',
							message: 'Já existe um campo com esta chave',
							code: 'duplicate_field_key'
						}
					]
				});
			}

			// For other database errors, throw a generic error
			throw new Error('Erro ao criar campo personalizado');
		}

		return data as LeadsCustomFieldDefinition;
	}
);

export const updateCustomFieldDefinition = command(
	updateCustomFieldDefinitionSchema,
	async ({ fieldId, organizationId, label, description, isRequired }) => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			const { data: result, error } = await supabase
				.from('leads_custom_fields_definitions')
				.update({
					label,
					description: description || null,
					is_required: isRequired,
					updated_at: new Date().toISOString()
				})
				.eq('id', fieldId)
				.eq('organization_id', organizationId)
				.select()
				.single();

			if (error) {
				console.error('Error updating custom field:', error);
				throw new Error('Erro ao atualizar campo personalizado');
			}

			return result as LeadsCustomFieldDefinition;
		} catch (err) {
			console.error('Unexpected error in updateCustomFieldDefinition:', err);
			throw err instanceof Error ? err : new Error('Erro interno do servidor');
		}
	}
);

export const deleteCustomFieldDefinition = command(
	deleteCustomFieldDefinitionSchema,
	async ({ fieldId, organizationId }) => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			// First, check if the field exists and belongs to the organization
			const { data: existingField, error: checkError } = await supabase
				.from('leads_custom_fields_definitions')
				.select('id, field_key, label')
				.eq('id', fieldId)
				.eq('organization_id', organizationId)
				.single();

			if (checkError) {
				console.error('Error checking existing field:', checkError);
				throw new Error('Erro ao verificar campo personalizado');
			}

			if (!existingField) {
				throw new Error('Campo personalizado não encontrado');
			}

			// Delete the custom field
			const { error: deleteError } = await supabase
				.from('leads_custom_fields_definitions')
				.delete()
				.eq('id', fieldId)
				.eq('organization_id', organizationId);

			if (deleteError) {
				console.error('Error deleting custom field:', deleteError);
				throw new Error('Erro ao excluir campo personalizado');
			}

			return { success: true, fieldId };
		} catch (err) {
			console.error('Unexpected error in deleteCustomFieldDefinition:', err);
			throw err instanceof Error ? err : new Error('Erro interno do servidor');
		}
	}
);
