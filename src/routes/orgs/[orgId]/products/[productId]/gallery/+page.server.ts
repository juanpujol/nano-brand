import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { fetchProductById, fetchProductImages } from '$lib/remote/products.remote';

export const load: PageServerLoad = async ({ params }) => {
	const { orgId, productId } = params;

	try {
		// Load product details and images in parallel
		const [product, images] = await Promise.all([
			fetchProductById({ productId, organizationId: orgId }),
			fetchProductImages({ productId, organizationId: orgId })
		]);

		return {
			product,
			images
		};
	} catch (err) {
		console.error('Error loading product gallery:', err);
		
		if (err instanceof Error && err.message === 'Product not found') {
			error(404, 'Product not found');
		}
		
		error(500, 'Failed to load product gallery');
	}
};