import { createClient } from '$lib/supabase/server';
import { type Handle, type HandleValidationError, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { formatValidationErrors } from '$lib/utils/validation-errors';

const supabaseHandle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createClient(event);

	event.locals.safeGetSession = async () => {
		// Suppress the getSession warning (unofficial but widely used)
		/** @ts-expect-error suppressGetSessionWarning is not officially supported */
		event.locals.supabase.auth.suppressGetSessionWarning = true;

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error || !user) {
			return { session: null, user: null, memberships: [] };
		}

		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		// Get user memberships
		const { data: memberships } = await event.locals.supabase
			.from('memberships')
			.select(
				`
				*,
				organizations (
					id,
					name,
					created_at,
					updated_at
				)
			`
			)
			.eq('profile_id', user.id);

		return { session, user, memberships: memberships || [] };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, memberships } = await event.locals.safeGetSession();
	const isAuthPage = event.url.pathname.startsWith('/auth');
	const isSetupOrgPage = event.url.pathname === '/new-org';

	// Redirect unauthenticated users to login, except for auth pages
	if (!session && !isAuthPage && event.url.pathname !== '/') {
		redirect(303, '/auth/login');
	}

	// For authenticated users
	if (session) {
		const hasOrg = memberships && memberships.length > 0;

		// If user has no organization and not on setup page, redirect to setup
		if (!hasOrg && !isSetupOrgPage && !event.url.pathname.startsWith('/auth/')) {
			redirect(303, '/new-org');
		}

		// If user has organization and on login/setup page, redirect to app
		if (hasOrg && (event.url.pathname === '/auth/login' || isSetupOrgPage)) {
			redirect(303, '/');
		}

		// If user has no organization and on login page, redirect to setup
		if (!hasOrg && event.url.pathname === '/auth/login') {
			redirect(303, '/new-org');
		}
	}

	return resolve(event);
};

export const handle = sequence(supabaseHandle, authGuard);

export const handleValidationError: HandleValidationError = ({ issues }) => {
	console.log('Validation error occurred:', issues);

	// Return structured validation errors that include field-level details
	return {
		message: 'Validation failed',
		issues: formatValidationErrors(issues)
	};
};
