import { command, getRequestEvent } from "$app/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "$env/static/private";
import {
	type EditImageResponse,
	editImageSchema,
	type GenerateImageResponse,
	generateImageSchema,
} from "$lib/schemas/gemini";
import {
	type BrandContext,
	buildComprehensiveSystemPrompt,
	type ProductContext,
} from "$lib/constants/image-gen-prompts";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Generate a new image from a text prompt using Gemini
 */
export const generateImage = command(
	generateImageSchema,
	async ({
		organizationId,
		productId,
		prompt,
		aspectRatio = "1:1",
		negativePrompt,
		includeLogo = false,
		includeReferenceImages = false,
	}): Promise<GenerateImageResponse> => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			console.log({
				organizationId,
				productId,
				prompt,
				aspectRatio: "1:1",
				negativePrompt,
				includeLogo: false,
				includeReferenceImages: false,
			});

			// Prepare content array for Gemini API
			const contentParts:
				(string | { inlineData: { data: string; mimeType: string } })[] = [];

			// Fetch organization data for brand context
			const { data: organization } = await supabase
				.from("organizations")
				.select(
					"name, industry, description, brand_voice, logo_policy, color_palette, logo",
				)
				.eq("id", organizationId)
				.single();

			if (!organization) {
				throw new Error("Organization not found");
			}

			// Build brand context for system prompt
			const brandContext: BrandContext = {
				name: organization.name,
				industry: organization.industry || undefined,
				description: organization.description || undefined,
				brandVoice: organization.brand_voice || undefined,
				logoPolicy: organization.logo_policy || undefined,
				colorPalette: organization.color_palette || undefined,
			};

			// Fetch product data for contextual atmosphere and vibe guidance
			const { data: product } = await supabase
				.from("products")
				.select("name, description, tags")
				.eq("id", productId)
				.eq("organization_id", organizationId)
				.single();

			// Build product context for atmosphere guidance
			const productContext: ProductContext | undefined = product
				? {
					name: product.name,
					description: product.description || undefined,
					tags: product.tags || undefined,
				}
				: undefined;

			// Generate comprehensive system prompt with brand and product context
			const systemPrompt = buildComprehensiveSystemPrompt(
				brandContext,
				productContext,
			);

			// Fetch organization logo if requested
			let logoBase64: string | null = null;
			if (includeLogo && organization.logo) {
				try {
					const { data: logoData } = await supabase.storage
						.from("storage")
						.download(organization.logo);

					if (logoData) {
						const logoBuffer = await logoData.arrayBuffer();
						logoBase64 = Buffer.from(logoBuffer).toString("base64");

						contentParts.push({
							inlineData: {
								data: logoBase64,
								mimeType: "image/png",
							},
						});
					}
				} catch (err) {
					console.error("Failed to load logo:", err);
				}
			}

			// Fetch product reference images if requested
			if (includeReferenceImages) {
				// Get reference images from the product data we already fetched
				const { data: productWithImages } = await supabase
					.from("products")
					.select("reference_images")
					.eq("id", productId)
					.eq("organization_id", organizationId)
					.single();

				if (
					productWithImages?.reference_images &&
					productWithImages.reference_images.length > 0
				) {
					// Limit to first 2 reference images (leaving room for logo + prompt)
					const maxReferenceImages = logoBase64 ? 2 : 3;
					const referenceImages = productWithImages.reference_images.slice(
						0,
						maxReferenceImages,
					);

					for (const imagePath of referenceImages) {
						try {
							const { data: imageData } = await supabase.storage
								.from("storage")
								.download(imagePath);

							if (imageData) {
								const imageBuffer = await imageData.arrayBuffer();
								const imageBase64 = Buffer.from(imageBuffer).toString("base64");

								contentParts.push({
									inlineData: {
										data: imageBase64,
										mimeType: "image/png",
									},
								});
							}
						} catch (err) {
							console.error(
								`Failed to load reference image ${imagePath}:`,
								err,
							);
						}
					}
				}
			}

			// Build the comprehensive prompt with system prompt and user request
			let fullPrompt = systemPrompt + "\n\n## USER REQUEST\n" + prompt;

			// Add context about included images
			if (logoBase64) {
				fullPrompt +=
					`\n\n## BRAND LOGO PROVIDED\nThe brand logo image has been provided. Use it according to the logo policy guidelines above.`;
			}

			if (
				includeReferenceImages && contentParts.length > (logoBase64 ? 1 : 0)
			) {
				const referenceCount = contentParts.length - (logoBase64 ? 1 : 0);
				fullPrompt +=
					`\n\n## REFERENCE IMAGES PROVIDED\n${referenceCount} reference image${
						referenceCount > 1 ? "s have" : " has"
					} been provided for product context and style guidance.`;
			}

			if (negativePrompt) {
				fullPrompt += `\n\n## AVOID\n${negativePrompt}`;
			}

			// Add aspect ratio instruction
			fullPrompt +=
				`\n\n## TECHNICAL REQUIREMENTS\nAspect ratio: ${aspectRatio}`;

			// Add the comprehensive prompt to content parts
			contentParts.push(fullPrompt);

			// Get the generative model
			const model = genAI.getGenerativeModel({
				model: "gemini-2.5-flash-image-preview",
			});

			// Generate the image with all content parts
			const result = await model.generateContent(contentParts);

			// Get the response (this will contain the generated image)
			const response = result.response;
			const imageData = response.candidates?.[0]?.content?.parts?.[0];

			if (!imageData || !("inlineData" in imageData) || !imageData.inlineData) {
				throw new Error("No image data received from Gemini API");
			}

			// Convert base64 to buffer
			const imageBuffer = Buffer.from(imageData.inlineData.data, "base64");

			// Generate unique filename
			const timestamp = Date.now();
			const fileName = `generated_${productId}_${timestamp}.png`;
			const filePath =
				`${organizationId}/products/${productId}/generated/${fileName}`;

			// Upload image to Supabase Storage
			const { error: uploadError } = await supabase.storage
				.from("storage")
				.upload(filePath, imageBuffer, {
					contentType: "image/png",
					cacheControl: "3600",
					upsert: false,
				});

			if (uploadError) {
				console.error("Supabase upload error:", uploadError);
				throw new Error(
					`Failed to upload generated image: ${uploadError.message}`,
				);
			}

			// Get the next display order
			const { data: existingImages } = await supabase
				.from("product_images")
				.select("display_order")
				.eq("product_id", productId)
				.order("display_order", { ascending: false })
				.limit(1);

			const nextDisplayOrder = existingImages && existingImages.length > 0
				? existingImages[0].display_order + 1
				: 1;

			// Save image record to database
			const { data: imageRecord, error: dbError } = await supabase
				.from("product_images")
				.insert({
					product_id: productId,
					path: filePath,
					display_order: nextDisplayOrder,
				})
				.select("id")
				.single();

			if (dbError) {
				console.error("Database error:", dbError);
				// Clean up uploaded file if database insert failed
				await supabase.storage.from("storage").remove([filePath]);
				throw new Error(`Failed to save image record: ${dbError.message}`);
			}

			return {
				success: true,
				imageId: imageRecord.id,
				imagePath: filePath,
			};
		} catch (err) {
			console.error("Error generating image:", err);
			return {
				success: false,
				error: err instanceof Error ? err.message : "Unknown error occurred",
			};
		}
	},
);

/**
 * Edit an existing image using Gemini
 */
export const editImage = command(
	editImageSchema,
	async ({
		organizationId,
		productId,
		imageId,
		prompt,
		maskCoordinates,
		negativePrompt,
	}): Promise<EditImageResponse> => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			// Get the existing image record
			const { data: existingImage, error: fetchError } = await supabase
				.from("product_images")
				.select("*")
				.eq("id", imageId)
				.eq("product_id", productId)
				.single();

			if (fetchError || !existingImage) {
				throw new Error("Image not found or access denied");
			}

			// Download the existing image from storage
			const { data: imageData, error: downloadError } = await supabase.storage
				.from("storage")
				.download(existingImage.path);

			if (downloadError || !imageData) {
				throw new Error("Failed to download existing image");
			}

			// Convert image to base64
			const imageBuffer = await imageData.arrayBuffer();
			const base64Image = Buffer.from(imageBuffer).toString("base64");

			// Get the generative model
			const model = genAI.getGenerativeModel({
				model: "gemini-2.5-flash-image-preview",
			});

			// Build the edit prompt
			let editPrompt = `Edit this image: ${prompt}`;

			if (negativePrompt) {
				editPrompt += ` [Avoid: ${negativePrompt}]`;
			}

			if (maskCoordinates && maskCoordinates.length > 0) {
				const maskDescription = maskCoordinates
					.map((coord) =>
						`area at (${coord.x}, ${coord.y}) with size ${coord.width}x${coord.height}`
					)
					.join(", ");
				editPrompt += ` [Focus editing on: ${maskDescription}]`;
			}

			// Generate the edited image
			const result = await model.generateContent([
				editPrompt,
				{
					inlineData: {
						data: base64Image,
						mimeType: "image/png",
					},
				},
			]);

			const response = result.response;
			const editedImageData = response.candidates?.[0]?.content?.parts?.[0];

			if (
				!editedImageData || !("inlineData" in editedImageData) ||
				!editedImageData.inlineData
			) {
				throw new Error("No edited image data received from Gemini API");
			}

			// Convert base64 to buffer
			const editedImageBuffer = Buffer.from(
				editedImageData.inlineData.data,
				"base64",
			);

			// Generate unique filename for edited version
			const timestamp = Date.now();
			const fileName = `edited_${productId}_${timestamp}.png`;
			const filePath =
				`${organizationId}/products/${productId}/generated/${fileName}`;

			// Upload edited image to Supabase Storage
			const { error: uploadError } = await supabase.storage
				.from("storage")
				.upload(filePath, editedImageBuffer, {
					contentType: "image/png",
					cacheControl: "3600",
					upsert: false,
				});

			if (uploadError) {
				console.error("Supabase upload error:", uploadError);
				throw new Error(
					`Failed to upload edited image: ${uploadError.message}`,
				);
			}

			// Get the next display order
			const { data: existingImages } = await supabase
				.from("product_images")
				.select("display_order")
				.eq("product_id", productId)
				.order("display_order", { ascending: false })
				.limit(1);

			const nextDisplayOrder = existingImages && existingImages.length > 0
				? existingImages[0].display_order + 1
				: 1;

			// Save edited image record to database
			const { data: newImageRecord, error: dbError } = await supabase
				.from("product_images")
				.insert({
					product_id: productId,
					path: filePath,
					display_order: nextDisplayOrder,
				})
				.select("id")
				.single();

			if (dbError) {
				console.error("Database error:", dbError);
				// Clean up uploaded file if database insert failed
				await supabase.storage.from("storage").remove([filePath]);
				throw new Error(
					`Failed to save edited image record: ${dbError.message}`,
				);
			}

			return {
				success: true,
				imageId: newImageRecord.id,
				imagePath: filePath,
				originalImageId: imageId,
			};
		} catch (err) {
			console.error("Error editing image:", err);
			return {
				success: false,
				error: err instanceof Error ? err.message : "Unknown error occurred",
			};
		}
	},
);
