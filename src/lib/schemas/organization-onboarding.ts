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
		minLength(1, 'Organization name is required'),
		maxLength(50, 'Organization name must be at most 50 characters')
	),
	industry: pipe(string(), minLength(1, 'Industry is required')),
	description: pipe(
		string(),
		minLength(1, 'Description is required'),
		maxLength(140, 'Description must be at most 140 characters')
	),
	brandVoice: pipe(array(string()), minLength(1, 'Please select at least one brand voice')),
	logoPolicy: pipe(string(), minLength(1, 'Logo policy is required'))
});

export type CreateOrganizationInput = InferInput<typeof createOrganizationSchema>;