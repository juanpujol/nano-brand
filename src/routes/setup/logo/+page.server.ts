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
			redirect(303, `/setup/product?org=${orgId}`);
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

		const logoFile = formData.get("logo") as File | null;
		const colorPalette = formData.getAll("colorPalette") as string[];

		// Skip upload if no logo file
		if (!logoFile || logoFile.size === 0) {
			redirect(303, `/setup/product?org=${orgId}`);
		}

		try {
			const { supabase } = locals;

			// Generate unique file path with secure naming convention
			const fileExt = logoFile.name.split('.').pop()?.toLowerCase() || 'png';
			const timestamp = Date.now();
			const fileName = `logo-${timestamp}-${nanoid(8)}.${fileExt}`;
			const filePath = `${orgId}/logos/${fileName}`;

			// Upload file to Supabase Storage
			const { error: uploadError } = await supabase.storage
				.from("storage")
				.upload(filePath, logoFile, {
					cacheControl: "3600",
					upsert: false,
				});

			if (uploadError) {
				console.error("Storage upload error:", uploadError);
				return fail(500, {
					error: `Failed to upload logo: ${uploadError.message}`,
				});
			}

			// Update organization with logo path (not full URL) and color palette
			const updateData: Record<string, string | string[]> = {
				logo: filePath,
			};

			if (colorPalette && colorPalette.length > 0) {
				updateData.color_palette = colorPalette;
			}

			const { error: updateError } = await supabase
				.from("organizations")
				.update(updateData)
				.eq("id", orgId);

			if (updateError) {
				console.error("Database update error:", updateError);
				return fail(500, { error: "Failed to save logo information" });
			}
		} catch (err) {
			console.error("Logo upload error:", err);
			return fail(500, { error: "An error occurred during logo upload" });
		}

		redirect(303, `/setup/product?org=${orgId}`);
	},
};
