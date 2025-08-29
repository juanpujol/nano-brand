import { createClient } from '$lib/supabase/client';
import { nanoid } from '$lib/utils/id';

export interface Organization {
	id: string;
	name: string;
	created_at: string;
	updated_at: string;
}

export interface Membership {
	id: string;
	organization_id: string;
	profile_id: string;
	role: 'admin' | 'member';
	created_at: string;
	organizations?: Organization;
}

export async function createOrganization(name: string): Promise<string> {
	const supabase = createClient();

	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) throw new Error('User not authenticated');

	// Create organization
	const { data: org, error: orgError } = await supabase
		.from('organizations')
		.insert({ id: nanoid(), name })
		.select()
		.single();

	if (orgError) throw orgError;

	// Add user as admin
	const { error: memberError } = await supabase.from('memberships').insert({
		organization_id: org.id,
		profile_id: user.id,
		role: 'admin'
	});

	if (memberError) throw memberError;

	return org.id;
}

export async function getUserMemberships(): Promise<Membership[]> {
	const supabase = createClient();

	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) throw new Error('User not authenticated');

	const { data: memberships, error } = await supabase
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

	if (error) throw error;

	return memberships || [];
}

export async function hasOrganization(): Promise<boolean> {
	try {
		const memberships = await getUserMemberships();
		return memberships.length > 0;
	} catch {
		return false;
	}
}
