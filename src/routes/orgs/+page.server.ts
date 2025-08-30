import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { user, memberships } = await safeGetSession();

	if (!user) {
		redirect(303, '/auth/login');
	}

	// No organizations - go to setup
	if (!memberships || memberships.length === 0) {
		redirect(303, '/setup');
	}

	// Only one organization - auto-redirect to organization
	if (memberships.length === 1) {
		const org = memberships[0].organizations;
		if (org) {
			redirect(303, `/orgs/${org.id}`);
		}
	}

	// Multiple organizations - show selection
	return {
		memberships
	};
};
