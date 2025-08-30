import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { fetchProducts, createProduct } from '$lib/remote/products.remote';
import { nanoid } from '$lib/utils/id';

export const load: PageServerLoad = async ({ params, url }) => {
	const orgId = params.orgId;

	// Get pagination parameters from URL
	const page = parseInt(url.searchParams.get('page') || '1');
	const pageSize = parseInt(url.searchParams.get('pageSize') || '12');
	const searchTerm = url.searchParams.get('search')?.trim() || '';

	// Use remote function to fetch products
	const result = await fetchProducts({
		organizationId: orgId,
		page,
		pageSize,
		search: searchTerm,
		includeCount: true
	});

	return {
		...result
	};
};

export const actions: Actions = {
	create: async ({ request, params, locals }) => {
		const orgId = params.orgId;

		// Get form data
		const data = await request.formData();
		const name = data.get('name') as string;
		const description = data.get('description') as string;
		const tags = data.getAll('tags') as string[];
		const referenceImages = data.getAll('referenceImages') as File[];

		// Basic validation
		if (!name || typeof name !== 'string' || name.trim().length === 0) {
			return fail(400, { form: { message: 'Product name is required' } });
		}

		if (name.length > 100) {
			return fail(400, { form: { message: 'Product name must be 100 characters or less' } });
		}

		const imagePaths: string[] = [];

		try {
			// Handle image uploads if provided
			if (referenceImages && referenceImages.length > 0) {
				// Filter out empty files and limit to 5
				const validFiles = referenceImages
					.filter(file => file && file.size > 0)
					.slice(0, 5);

				const { supabase } = locals;
				const productId = nanoid(12);

				for (let i = 0; i < validFiles.length; i++) {
					const file = validFiles[i];
					
					// Validate file type
					if (!file.type.startsWith('image/')) {
						return fail(400, { form: { message: `File ${file.name} is not a valid image` } });
					}

					// Validate file size (5MB limit)
					if (file.size > 5 * 1024 * 1024) {
						return fail(400, { form: { message: `File ${file.name} is too large. Maximum size is 5MB` } });
					}
					
					// Generate unique file path in _references directory
					const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
					const timestamp = Date.now();
					const fileName = `ref-${timestamp}-${nanoid(8)}.${fileExt}`;
					const filePath = `${orgId}/products/${productId}/_references/${fileName}`;

					// Upload file to Supabase Storage
					const { error: uploadError } = await supabase.storage
						.from("storage")
						.upload(filePath, file, {
							cacheControl: "3600",
							upsert: false,
						});

					if (uploadError) {
						console.error("Storage upload error:", uploadError);
						return fail(500, {
							form: { message: `Failed to upload image ${i + 1}: ${uploadError.message}` }
						});
					}

					imagePaths.push(filePath);
				}
			}

			// Use remote function to create product
			await createProduct({
				organizationId: orgId,
				name: name.trim(),
				description: description && description.trim() ? description.trim() : undefined,
				tags: tags && tags.length > 0 ? tags : undefined,
				referenceImages: imagePaths.length > 0 ? imagePaths : undefined
			});

			// Return success
			return { success: true };
		} catch (error) {
			console.error('Error creating product:', error);
			return fail(500, { form: { message: 'Error creating product' } });
		}
	}
};
