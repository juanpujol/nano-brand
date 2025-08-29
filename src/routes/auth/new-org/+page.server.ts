import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

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
		const organizationName = data.get('organizationName') as string;

		if (!organizationName || !organizationName.trim()) {
			return fail(400, { error: 'Nome da organização é obrigatório' });
		}

		if (organizationName.trim().length > 50) {
			return fail(400, {
				error: 'Nome da organização deve ter no máximo 50 caracteres'
			});
		}

		let orgId: string;

		try {
			// Create organization with admin membership using database function
			const { data: orgResult, error: orgError } = await supabase.rpc('create_organization_with_admin', {
				org_name: organizationName.trim(),
				user_id: user.id
			});

			if (orgError) throw orgError;

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
