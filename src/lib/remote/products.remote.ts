import { command, query, getRequestEvent } from '$app/server';
import {
	fetchProductsSchema,
	fetchProductByIdSchema,
	createProductRemoteSchema,
	updateProductRemoteSchema,
	deleteProductSchema,
	fetchProductImagesSchema,
	type Product,
	type ProductImage
} from '$lib/schemas/product';

/**
 * Fetches products with pagination, search, and sorting capabilities.
 * Supports both simple arrays and paginated results based on parameters.
 */
export const fetchProducts = query(
	fetchProductsSchema,
	async ({
		organizationId,
		search = '',
		page,
		pageSize,
		includeCount = false
	}) => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			// Build base query
			let countQuery = supabase
				.from('products')
				.select('*', { count: 'exact', head: true })
				.eq('organization_id', organizationId);

			let dataQuery = supabase
				.from('products')
				.select('*')
				.eq('organization_id', organizationId);

			// Apply search filter if provided - search name and description
			if (search.trim()) {
				const searchFilter = `name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`;
				countQuery = countQuery.or(searchFilter);
				dataQuery = dataQuery.or(searchFilter);
			}

			// Get total count if needed
			let total = 0;
			if (includeCount) {
				const { count } = await countQuery;
				total = count || 0;
			}

			// Apply pagination if provided
			if (page && pageSize) {
				const offset = (page - 1) * pageSize;
				dataQuery = dataQuery
					.order('created_at', { ascending: false })
					.range(offset, offset + pageSize - 1);
			} else {
				dataQuery = dataQuery.order('created_at', { ascending: false });
			}

			const { data: products, error } = await dataQuery;

			if (error) {
				console.error('Error fetching products:', error);
				throw new Error('Error loading products');
			}

			// Return paginated result if pagination was requested
			if (page && pageSize && includeCount) {
				const totalPages = Math.ceil(total / pageSize);
				return {
					products: (products || []) as unknown as Product[],
					total,
					page,
					pageSize,
					totalPages
				} as const;
			}

			// Return simple array
			return (products || []) as unknown as Product[];
		} catch (err) {
			console.error('Unexpected error in fetchProducts:', err);
			throw err instanceof Error ? err : new Error('Internal server error');
		}
	}
);

/**
 * Fetches a single product by ID, ensuring it belongs to the organization.
 */
export const fetchProductById = query(
	fetchProductByIdSchema,
	async ({ productId, organizationId }) => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			const { data: product, error } = await supabase
				.from('products')
				.select('*')
				.eq('id', productId)
				.eq('organization_id', organizationId)
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					throw new Error('Product not found');
				}
				console.error('Error fetching product:', error);
				throw new Error('Error loading product');
			}

			return product as Product;
		} catch (err) {
			console.error('Unexpected error in fetchProductById:', err);
			throw err instanceof Error ? err : new Error('Internal server error');
		}
	}
);

/**
 * Creates a new product.
 */
export const createProduct = command(
	createProductRemoteSchema,
	async ({ organizationId, name, description, tags, referenceImages }) => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;
			const { user } = await locals.safeGetSession();

			if (!user) {
				throw new Error('User not authenticated');
			}

			const { data, error } = await supabase
				.from('products')
				.insert({
					organization_id: organizationId,
					name,
					description: description || null,
					tags: tags && tags.length > 0 ? tags : null,
					reference_images: referenceImages && referenceImages.length > 0 ? referenceImages : null,
					created_by: user.id
				})
				.select()
				.single();

			if (error) {
				console.error('Error creating product:', error);
				throw new Error('Error creating product');
			}

			return data as Product;
		} catch (err) {
			console.error('Unexpected error in createProduct:', err);
			throw err instanceof Error ? err : new Error('Internal server error');
		}
	}
);

/**
 * Updates an existing product's details.
 */
export const updateProduct = command(
	updateProductRemoteSchema,
	async ({ productId, organizationId, name, description, tags, referenceImages }) => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			const { data, error } = await supabase
				.from('products')
				.update({
					name,
					description: description || null,
					tags: tags && tags.length > 0 ? tags : null,
					reference_images: referenceImages && referenceImages.length > 0 ? referenceImages : null,
					updated_at: new Date().toISOString()
				})
				.eq('id', productId)
				.eq('organization_id', organizationId)
				.select()
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					throw new Error('Product not found');
				}
				console.error('Error updating product:', error);
				throw new Error('Error updating product');
			}

			return data as Product;
		} catch (err) {
			console.error('Unexpected error in updateProduct:', err);
			throw err instanceof Error ? err : new Error('Internal server error');
		}
	}
);

/**
 * Deletes a product.
 */
export const deleteProduct = command(deleteProductSchema, async ({ productId, organizationId }) => {
	try {
		const { locals } = getRequestEvent();
		const supabase = locals.supabase;

		const { error } = await supabase
			.from('products')
			.delete()
			.eq('id', productId)
			.eq('organization_id', organizationId);

		if (error) {
			console.error('Error deleting product:', error);
			throw new Error('Error deleting product');
		}

		return { success: true };
	} catch (err) {
		console.error('Unexpected error in deleteProduct:', err);
		throw err instanceof Error ? err : new Error('Internal server error');
	}
});

/**
 * Fetches all generated images for a product.
 */
export const fetchProductImages = query(
	fetchProductImagesSchema,
	async ({ productId, organizationId }) => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			// First verify the product exists and belongs to the organization
			const { data: product, error: productError } = await supabase
				.from('products')
				.select('id')
				.eq('id', productId)
				.eq('organization_id', organizationId)
				.single();

			if (productError) {
				if (productError.code === 'PGRST116') {
					throw new Error('Product not found');
				}
				console.error('Error verifying product:', productError);
				throw new Error('Error loading product');
			}

			// Fetch product images ordered by display_order
			const { data: images, error } = await supabase
				.from('product_images')
				.select('*')
				.eq('product_id', productId)
				.order('display_order', { ascending: true });

			if (error) {
				console.error('Error fetching product images:', error);
				throw new Error('Error loading product images');
			}

			return (images || []) as ProductImage[];
		} catch (err) {
			console.error('Unexpected error in fetchProductImages:', err);
			throw err instanceof Error ? err : new Error('Internal server error');
		}
	}
);