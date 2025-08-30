import type { Actions, PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { nanoid } from "$lib/utils/id";

export const load: PageServerLoad = async (
	{ url, locals: { safeGetSession } },
) => {
	const { user } = await safeGetSession();

	// If not authenticated, redirect to login
	if (!user) {
		redirect(303, "/auth/login");
	}

	// Get organization ID from URL params
	const orgId = url.searchParams.get("org");

	if (!orgId) {
		redirect(303, "/setup");
	}

	return {
		orgId,
	};
};

export const actions: Actions = {
	skip: async ({ url }) => {
		const orgId = url.searchParams.get("org");
		if (orgId) {
			redirect(303, `/orgs/${orgId}`);
		} else {
			redirect(303, "/orgs");
		}
	},

	continue: async ({ request, url, locals }) => {
		const formData = await request.formData();
		const orgId = formData.get("orgId") as string ||
			url.searchParams.get("org");

		if (!orgId) {
			return fail(400, { error: "Organization ID is required" });
		}

		const { user } = await locals.safeGetSession();
		if (!user) {
			return fail(401, { error: "User not authenticated" });
		}

		const productName = formData.get("productName") as string;
		const description = formData.get("description") as string || null;
		const tags = formData.getAll("tags") as string[];
		const referenceImages = formData.getAll("referenceImages") as File[];

		// Validate required fields
		if (!productName?.trim()) {
			return fail(400, { error: "Product name is required" });
		}

		// Validate at least one reference image is provided
		const validReferenceImages = referenceImages?.filter(file => file && file.size > 0) || [];
		if (validReferenceImages.length === 0) {
			return fail(400, { error: "At least one reference image is required" });
		}

		try {
			const { supabase } = locals;
			const productId = nanoid(12);
			const imagePaths: string[] = [];

			// Upload reference images if provided
			if (referenceImages && referenceImages.length > 0) {
				// Filter out empty files and limit to 6
				const validFiles = referenceImages
					.filter(file => file && file.size > 0)
					.slice(0, 6);

				for (let i = 0; i < validFiles.length; i++) {
					const file = validFiles[i];
					
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
							error: `Failed to upload image ${i + 1}: ${uploadError.message}`,
						});
					}

					imagePaths.push(filePath);
				}
			}

			// Create product record
			const { error: createError } = await supabase
				.from("products")
				.insert({
					id: productId,
					organization_id: orgId,
					name: productName.trim(),
					description: description?.trim() || null,
					tags: tags.length > 0 ? tags : null,
					reference_images: imagePaths.length > 0 ? imagePaths : null,
					created_by: user.id,
				});

			if (createError) {
				console.error("Database insert error:", createError);
				return fail(500, { error: "Failed to create product" });
			}

		} catch (err) {
			console.error("Product creation error:", err);
			return fail(500, { error: "An error occurred while creating the product" });
		}

		redirect(303, `/orgs/${orgId}`);
	},
};