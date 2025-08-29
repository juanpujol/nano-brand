export const INDUSTRY_OPTIONS = [
	{ value: 'technology', label: 'Technology' },
	{ value: 'healthcare', label: 'Healthcare' },
	{ value: 'finance', label: 'Finance' },
	{ value: 'education', label: 'Education' },
	{ value: 'retail', label: 'Retail' },
	{ value: 'manufacturing', label: 'Manufacturing' },
	{ value: 'construction', label: 'Construction' },
	{ value: 'professional_services', label: 'Professional Services' },
	{ value: 'marketing_advertising', label: 'Marketing & Advertising' },
	{ value: 'food_beverage', label: 'Food & Beverage' },
	{ value: 'automotive', label: 'Automotive' },
	{ value: 'real_estate', label: 'Real Estate' },
	{ value: 'travel_hospitality', label: 'Travel & Hospitality' },
	{ value: 'entertainment', label: 'Entertainment' },
	{ value: 'fitness_wellness', label: 'Fitness & Wellness' },
	{ value: 'legal', label: 'Legal' },
	{ value: 'consulting', label: 'Consulting' },
	{ value: 'ecommerce', label: 'E-commerce' },
	{ value: 'non_profit', label: 'Non-profit Organization' },
	{ value: 'other', label: 'Other' }
] as const;

export const BRAND_VOICE_OPTIONS = [
	{ value: 'premium', label: 'Premium' },
	{ value: 'playful', label: 'Playful' },
	{ value: 'bold', label: 'Bold' },
	{ value: 'technical', label: 'Technical' },
	{ value: 'friendly', label: 'Friendly' },
	{ value: 'professional', label: 'Professional' },
	{ value: 'creative', label: 'Creative' },
	{ value: 'minimalist', label: 'Minimalist' },
	{ value: 'energetic', label: 'Energetic' },
	{ value: 'trustworthy', label: 'Trustworthy' },
	{ value: 'innovative', label: 'Innovative' },
	{ value: 'approachable', label: 'Approachable' }
] as const;

export const LOGO_POLICY_OPTIONS = [
	{ value: 'always', label: 'Always' },
	{ value: 'usually', label: 'Usually' },
	{ value: 'rarely', label: 'Rarely' }
] as const;

export type IndustryValue = typeof INDUSTRY_OPTIONS[number]['value'];
export type BrandVoiceValue = typeof BRAND_VOICE_OPTIONS[number]['value'];
export type LogoPolicyValue = typeof LOGO_POLICY_OPTIONS[number]['value'];