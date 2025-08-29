export interface Lead {
	id: string;
	organization_id: string;
	name: string | null;
	email: string | null;
	phone: string | null;
	company: string | null;
	job_title: string | null;
	import_method: string;
	source: string | null;
	external_id: string | null;
	external_source: string | null;
	fit_score: string | null; // 'A', 'B', 'C', 'D', 'F'
	interest: number;
	total_conversions: number;
	first_conversion_date: string | null;
	last_conversion_date: string | null;
	// First conversion UTM attribution
	first_conversion_utm_source: string | null;
	first_conversion_utm_medium: string | null;
	first_conversion_utm_campaign: string | null;
	first_conversion_utm_content: string | null;
	first_conversion_utm_term: string | null;
	// Last conversion UTM attribution
	last_conversion_utm_source: string | null;
	last_conversion_utm_medium: string | null;
	last_conversion_utm_campaign: string | null;
	last_conversion_utm_content: string | null;
	last_conversion_utm_term: string | null;
	tags: string[];
	notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface LeadsPageData {
	leads: Lead[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}
