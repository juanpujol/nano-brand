export interface Lead {
	id: string;
	name: string | null;
	email: string | null;
	phone: string | null;
	company: string | null;
	job_title: string | null;
}

export interface Conversion {
	id: string;
	organization_id: string;
	lead_id: string;
	name: string;
	identifier: string | null;
	external_id: string | null;
	external_source: string | null;
	date: string;
	value: number | null;
	utm_source: string | null;
	utm_medium: string | null;
	utm_campaign: string | null;
	utm_content: string | null;
	utm_term: string | null;
	conversion_url: string | null;
	conversion_domain: string | null;
	device: string | null;
	raw_payload: Record<string, unknown> | null;
	idempotency_hash: string;
	created_at: string;
	leads?: Lead;
}

export interface ConversionsPageData {
	conversions: Conversion[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}
