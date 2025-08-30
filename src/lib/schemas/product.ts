import {
	array,
	object,
	string,
	optional,
	boolean,
	number,
	pipe,
	minLength,
	maxLength,
	type InferInput
} from 'valibot';

// Form schemas (for superforms - user-friendly messages)
export const createProductFormSchema = object({
	name: pipe(string('Name must be text'), minLength(1, 'Name is required'), maxLength(100, 'Name too long')),
	description: optional(string(), ''),
	tags: optional(array(string()), [])
});

export const updateProductFormSchema = object({
	name: pipe(string('Name must be text'), minLength(1, 'Name is required'), maxLength(100, 'Name too long')),
	description: optional(string(), ''),
	tags: optional(array(string()), [])
});

// Remote function schemas (for database operations)
export const fetchProductsSchema = object({
	organizationId: string(),
	page: optional(number()),
	pageSize: optional(number()),
	search: optional(string()),
	includeCount: optional(boolean())
});

export const fetchProductByIdSchema = object({
	productId: string(),
	organizationId: string()
});

export const createProductRemoteSchema = object({
	organizationId: string(),
	name: string(),
	description: optional(string()),
	tags: optional(array(string())),
	referenceImages: optional(array(string()))
});

export const updateProductRemoteSchema = object({
	productId: string(),
	organizationId: string(),
	name: string(),
	description: optional(string()),
	tags: optional(array(string())),
	referenceImages: optional(array(string()))
});

export const deleteProductSchema = object({
	productId: string(),
	organizationId: string()
});

// Export inferred types
export type CreateProductFormInput = InferInput<typeof createProductFormSchema>;
export type UpdateProductFormInput = InferInput<typeof updateProductFormSchema>;
export type FetchProductsParams = InferInput<typeof fetchProductsSchema>;
export type FetchProductByIdParams = InferInput<typeof fetchProductByIdSchema>;
export type CreateProductParams = InferInput<typeof createProductRemoteSchema>;
export type UpdateProductParams = InferInput<typeof updateProductRemoteSchema>;
export type DeleteProductParams = InferInput<typeof deleteProductSchema>;

// Database return type (represents the actual table structure)
export interface Product {
	id: string;
	organization_id: string;
	name: string;
	description: string | null;
	tags: string[] | null;
	reference_images: string[] | null;
	created_by: string;
	created_at: string;
	updated_at: string;
}