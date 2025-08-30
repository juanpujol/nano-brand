import { command, getRequestEvent } from "$app/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "$env/static/private";
import {
	type EditImageResponse,
	editImageSchema,
	type GenerateImageResponse,
	generateImageSchema,
} from "$lib/schemas/gemini";

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
	}): Promise<GenerateImageResponse> => {
		try {
			const { locals } = getRequestEvent();
			const supabase = locals.supabase;

			// Get the generative model
			const model = genAI.getGenerativeModel({
				model: "gemini-2.5-flash-image-preview",
			});

			// Build the full prompt with aspect ratio and negative prompt
			let fullPrompt = prompt;

			if (negativePrompt) {
				fullPrompt += ` [Avoid: ${negativePrompt}]`;
			}

			// Add aspect ratio instruction
			fullPrompt += ` [Aspect ratio: ${aspectRatio}]`;

			// Generate the image
			const result = await model.generateContent([fullPrompt]);

			// Get the response (this will contain the generated image)
			const response = result.response;
			const imageData = response.candidates?.[0]?.content?.parts?.[0];

			if (!imageData || !("inlineData" in imageData)) {
				throw new Error("No image data received from Gemini API");
			}

			// Convert base64 to buffer
			const imageBuffer = Buffer.from(imageData.inlineData.data, "base64");

			// Generate unique filename
			const timestamp = Date.now();
			const fileName = `generated_${productId}_${timestamp}.png`;
			const filePath =
				`products/${organizationId}/${productId}/generated/${fileName}`;

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

			if (!editedImageData || !("inlineData" in editedImageData)) {
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
				`products/${organizationId}/${productId}/generated/${fileName}`;

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
