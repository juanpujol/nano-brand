import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { safeParse } from 'valibot';
import { createOrganizationSchema } from '$lib/schemas/organization-onboarding';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { user, memberships } = await safeGetSession();

	// If not authenticated, redirect to login
	if (!user) {
		redirect(303, '/auth/login');
	}

	// If user already has an organization, redirect to orgs
	if (memberships && memberships.length > 0) {
		redirect(303, '/orgs');
	}

	return {
		user
	};
};

export const actions: Actions = {
	default: async ({ request, locals: { safeGetSession, supabase } }) => {
		const { user } = await safeGetSession();

		if (!user) {
			return fail(401, { error: 'Usuário não autenticado' });
		}

		const data = await request.formData();
		const formData = {
			organizationName: data.get('organizationName') as string,
			industry: data.get('industry') as string || undefined,
			description: data.get('description') as string || undefined,
			brandVoice: data.getAll('brandVoice') as string[] || undefined,
			logoPolicy: data.get('logoPolicy') as string || undefined
		};

		const result = safeParse(createOrganizationSchema, formData);
		
		if (!result.success) {
			const firstError = result.issues[0];
			return fail(400, { error: firstError.message });
		}

		let orgId: string;

		const { organizationName, industry, description, brandVoice, logoPolicy } = result.output;

		try {
			// Create organization with admin membership using database function
			const { data: orgResult, error: orgError } = await supabase.rpc('create_organization_with_admin', {
				org_name: organizationName.trim(),
				user_id: user.id
			});

			if (orgError) throw orgError;

			// Update organization with additional fields if provided
			if (industry || description || brandVoice || logoPolicy) {
				const updateData: Record<string, string | string[]> = {};
				if (industry) updateData.industry = industry;
				if (description) updateData.description = description;
				if (brandVoice && brandVoice.length > 0) updateData.brand_voice = brandVoice;
				if (logoPolicy) updateData.logo_policy = logoPolicy;

				const { error: updateError } = await supabase
					.from('organizations')
					.update(updateData)
					.eq('id', orgResult);

				if (updateError) throw updateError;
			}

			// Create default dashboard for the new organization
			const { error: dashboardError } = await supabase.from('dashboards').insert({
				name: 'Relatório geral',
				description: 'Seu primeiro relatório pronto para personalizar.',
				organization_id: orgResult,
				owner_id: user.id,
				is_private: false,
				period_filter: { type: 'relative', value: 'thisMonth' }
			});

			if (dashboardError) throw dashboardError;

			orgId = orgResult;
		} catch (error) {
			console.error('Error creating organization:', error);
			return fail(500, {
				error: 'Erro ao criar organização. Tente novamente.'
			});
		}

		// Redirect after successful completion
		redirect(303, `/orgs/${orgId}`);
	}
};
