// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

// Extend TanStack Table types
declare module '@tanstack/table-core' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData, TValue> {
		align?: 'left' | 'center' | 'right';
	}
}


interface Organization {
	id: string;
	name: string;
	created_at: string;
	updated_at: string;
}

interface Membership {
	id: string;
	organization_id: string;
	profile_id: string;
	role: 'admin' | 'member';
	created_at: string;
	organizations?: Organization;
}

declare global {
	namespace App {
		interface Error {
			message: string;
			issues?: Array<{
				path: string;
				message: string;
				code: string;
			}>;
		}
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{
				session: Session | null;
				user: User | null;
				memberships: Membership[];
			}>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
