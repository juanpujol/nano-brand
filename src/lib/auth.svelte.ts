import { createClient } from '$lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
	user: User | null;
	session: Session | null;
	loading: boolean;
}

const authState = $state<AuthState>({
	user: null,
	session: null,
	loading: true
});

const supabase = createClient();

// Initialize auth state
export function initializeAuth() {
	// Suppress warnings on client-side too
	/** @ts-expect-error suppressGetSessionWarning is not officially supported */
	supabase.auth.suppressGetSessionWarning = true;

	// Get initial user (server-verified)
	supabase.auth.getUser().then(({ data: { user }, error }) => {
		if (error || !user) {
			authState.session = null;
			authState.user = null;
			authState.loading = false;
			return;
		}

		// Then get session after user is verified
		supabase.auth.getSession().then(({ data: { session } }) => {
			authState.session = session;
			authState.user = user;
			authState.loading = false;
		});
	});

	// Listen for auth changes
	supabase.auth.onAuthStateChange(async (_event, session) => {
		if (session) {
			// Verify user when session changes
			const {
				data: { user },
				error
			} = await supabase.auth.getUser();
			if (error || !user) {
				authState.session = null;
				authState.user = null;
			} else {
				authState.session = session;
				authState.user = user;
			}
		} else {
			authState.session = null;
			authState.user = null;
		}
		authState.loading = false;
	});
}

// Auth state getters
export function getAuthState() {
	return authState;
}

export function isAuthenticated() {
	return !!authState.user;
}

// Auth actions
export async function signInWithOtp(email: string) {
	const { error } = await supabase.auth.signInWithOtp({
		email,
		options: {
			emailRedirectTo: `${window.location.origin}/auth/verify`
		}
	});

	if (error) throw error;
}

export async function verifyOtp(email: string, token: string) {
	const { data, error } = await supabase.auth.verifyOtp({
		email,
		token,
		type: 'email'
	});

	if (error) throw error;
	return data;
}

export async function resendOtp(email: string) {
	const { error } = await supabase.auth.signInWithOtp({
		email,
		options: {
			emailRedirectTo: `${window.location.origin}/auth/verify`
		}
	});

	if (error) throw error;
}
