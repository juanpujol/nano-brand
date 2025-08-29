import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	// Get email from cookie
	const email = cookies.get('auth_email');

	// If email is not found in cookies, redirect to login
	if (!email) {
		redirect(303, '/auth/login');
	}

	return {
		email
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, locals }) => {
		const formData = await request.formData();
		const token = formData.get('token') as string;
		const email = formData.get('email') as string;

		if (!token || typeof token !== 'string') {
			return fail(400, { error: 'Código é obrigatório' });
		}

		if (token.length !== 6) {
			return fail(400, { error: 'Código deve ter 6 dígitos' });
		}

		if (!email || typeof email !== 'string') {
			return fail(400, { error: 'Email não encontrado' });
		}

		const supabase = locals.supabase;

		try {
			const { error } = await supabase.auth.verifyOtp({
				email,
				token,
				type: 'email'
			});

			if (error) {
				console.error('OTP verification error:', error);

				if (error.message.includes('invalid') || error.message.includes('expired')) {
					return fail(400, { error: 'Código inválido ou expirado' });
				}

				return fail(500, { error: 'Erro ao verificar código' });
			}

			// Clear the auth email cookie
			cookies.set('auth_email', '', {
				maxAge: 0,
				path: '/auth/verify'
			});
		} catch (error) {
			console.error('Unexpected error:', error);
			return fail(500, { error: 'Erro interno do servidor' });
		}

		// Redirect to new organization page for new users
		redirect(303, '/auth/new-org');
	}
};
