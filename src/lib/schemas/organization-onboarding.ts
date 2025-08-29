import {
	array,
	maxLength,
	minLength,
	object,
	optional,
	pipe,
	string,
	type InferInput
} from 'valibot';

export const createOrganizationSchema = object({
	organizationName: pipe(
		string(),
		minLength(1, 'Nome da organização é obrigatório'),
		maxLength(50, 'Nome da organização deve ter no máximo 50 caracteres')
	),
	industry: pipe(string(), minLength(1, 'Setor é obrigatório')),
	description: pipe(
		string(),
		minLength(1, 'Descrição é obrigatória'),
		maxLength(140, 'Descrição deve ter no máximo 140 caracteres')
	),
	brandVoice: pipe(array(string()), minLength(1, 'Selecione pelo menos um tom da marca')),
	logoPolicy: pipe(string(), minLength(1, 'Política de logo é obrigatória'))
});

export type CreateOrganizationInput = InferInput<typeof createOrganizationSchema>;