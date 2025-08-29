import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals: { safeGetSession } }) => {
	const { user } = await safeGetSession();

	// If not authenticated, redirect to login
	if (!user) {
		redirect(303, '/auth/login');
	}

	// Get organization ID from URL params
	const orgId = url.searchParams.get('org');
	
	if (!orgId) {
		redirect(303, '/new-org');
	}

	return {
		orgId
	};
};

export const actions: Actions = {
	skip: async ({ url }) => {
		const orgId = url.searchParams.get('org');
		if (orgId) {
			redirect(303, `/orgs/${orgId}`);
		} else {
			redirect(303, '/orgs');
		}
	},

	continue: async ({ url }) => {
		const orgId = url.searchParams.get('org');
		// For now, just redirect to the org - later we'll save logo and colors
		if (orgId) {
			redirect(303, `/orgs/${orgId}`);
		} else {
			redirect(303, '/orgs');
		}
	}
};