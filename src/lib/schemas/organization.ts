import {
	array,
	maxLength,
	minLength,
	object,
	optional,
	pipe,
	string,
	regex,
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

// Remote function schemas for organization operations
export const updateOrganizationLogoRemoteSchema = object({
	organizationId: string(),
	logoFile: string(), // Will be handled as File in the remote function
	colorPalette: array(
		pipe(
			string(),
			regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format')
		)
	)
});

export const fetchOrganizationByIdSchema = object({
	organizationId: string()
});

export type CreateOrganizationInput = InferInput<typeof createOrganizationSchema>;
export type UpdateOrganizationLogoParams = InferInput<typeof updateOrganizationLogoRemoteSchema>;
export type FetchOrganizationByIdParams = InferInput<typeof fetchOrganizationByIdSchema>;