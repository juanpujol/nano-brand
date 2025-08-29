import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ locals }) => {
		const { error } = await locals.supabase.auth.signOut();

		if (error) {
			console.error('Sign out error:', error);
		}

		// Redirect to login page after sign out
		redirect(303, '/auth/login');
	}
};
