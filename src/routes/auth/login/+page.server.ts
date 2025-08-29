import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies, url, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		if (!email || typeof email !== 'string') {
			return fail(400, { error: 'Email é obrigatório' });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, { error: 'Email inválido' });
		}

		const supabase = locals.supabase;

		try {
			const { error } = await supabase.auth.signInWithOtp({
				email: email.toLowerCase(),
				options: {
					emailRedirectTo: `${url.origin}/auth/verify`
				}
			});

			if (error) {
				console.error('Login error:', error);
				return fail(500, { error: 'Erro ao enviar código de verificação' });
			}

			// Store email in cookie for verify page
			cookies.set('auth_email', email.toLowerCase(), {
				maxAge: 600, // 10 minutes
				path: '/auth/verify',
				httpOnly: true,
				secure: url.protocol === 'https:',
				sameSite: 'lax'
			});
		} catch (error) {
			console.error('Unexpected error:', error);
			return fail(500, { error: 'Erro interno do servidor' });
		}

		// Redirect after successful completion
		redirect(303, '/auth/verify');
	}
};
