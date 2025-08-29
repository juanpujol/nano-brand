import type { LayoutServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, params }) => {
	const { session, user, memberships } = await safeGetSession();

	if (!user) {
		redirect(303, '/auth/login');
	}

	// Ensure user has organization membership
	if (!memberships || memberships.length === 0) {
		redirect(303, '/auth/new-org');
	}

	// Find the organization and verify user has access
	const membership = memberships.find((m) => m.organizations?.id === params.orgId);

	if (!membership) {
		error(404, 'Organization not found or access denied');
	}

	return {
		session,
		user,
		memberships,
		currentOrganization: membership.organizations,
		currentMembership: membership
	};
};
