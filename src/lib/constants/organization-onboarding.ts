export const INDUSTRY_OPTIONS = [
	{ value: 'technology', label: 'Tecnologia' },
	{ value: 'healthcare', label: 'Saúde' },
	{ value: 'finance', label: 'Finanças' },
	{ value: 'education', label: 'Educação' },
	{ value: 'retail', label: 'Varejo' },
	{ value: 'manufacturing', label: 'Manufatura' },
	{ value: 'construction', label: 'Construção' },
	{ value: 'professional_services', label: 'Serviços Profissionais' },
	{ value: 'marketing_advertising', label: 'Marketing e Publicidade' },
	{ value: 'food_beverage', label: 'Alimentação e Bebidas' },
	{ value: 'automotive', label: 'Automotivo' },
	{ value: 'real_estate', label: 'Imobiliário' },
	{ value: 'travel_hospitality', label: 'Turismo e Hospitalidade' },
	{ value: 'entertainment', label: 'Entretenimento' },
	{ value: 'fitness_wellness', label: 'Fitness e Bem-estar' },
	{ value: 'legal', label: 'Jurídico' },
	{ value: 'consulting', label: 'Consultoria' },
	{ value: 'ecommerce', label: 'E-commerce' },
	{ value: 'non_profit', label: 'Organização sem fins lucrativos' },
	{ value: 'other', label: 'Outro' }
] as const;

export const BRAND_VOICE_OPTIONS = [
	{ value: 'premium', label: 'Premium' },
	{ value: 'playful', label: 'Brincalhão' },
	{ value: 'bold', label: 'Ousado' },
	{ value: 'technical', label: 'Técnico' },
	{ value: 'friendly', label: 'Amigável' },
	{ value: 'professional', label: 'Profissional' },
	{ value: 'creative', label: 'Criativo' },
	{ value: 'minimalist', label: 'Minimalista' },
	{ value: 'energetic', label: 'Energético' },
	{ value: 'trustworthy', label: 'Confiável' },
	{ value: 'innovative', label: 'Inovador' },
	{ value: 'approachable', label: 'Acessível' }
] as const;

export const LOGO_POLICY_OPTIONS = [
	{ value: 'always', label: 'Sempre' },
	{ value: 'usually', label: 'Geralmente' },
	{ value: 'rarely', label: 'Raramente' }
] as const;

export type IndustryValue = typeof INDUSTRY_OPTIONS[number]['value'];
export type BrandVoiceValue = typeof BRAND_VOICE_OPTIONS[number]['value'];
export type LogoPolicyValue = typeof LOGO_POLICY_OPTIONS[number]['value'];