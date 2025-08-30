import {
	object,
	string,
	optional,
	array,
	union,
	literal,
	type InferInput
} from 'valibot';

// Generate Image schema
export const generateImageSchema = object({
	organizationId: string(),
	productId: string(),
	prompt: string(),
	// Optional parameters for more control
	aspectRatio: optional(union([
		literal('1:1'),
		literal('9:16'),
		literal('16:9'),
		literal('3:4'),
		literal('4:3')
	]), '1:1'),
	negativePrompt: optional(string())
});

// Edit Image schema
export const editImageSchema = object({
	organizationId: string(),
	productId: string(),
	imageId: string(),
	prompt: string(),
	// Optional mask for targeted editing
	maskCoordinates: optional(array(object({
		x: string(),
		y: string(),
		width: string(),
		height: string()
	}))),
	negativePrompt: optional(string())
});

// Response types
export interface GenerateImageResponse {
	success: boolean;
	imageId?: string;
	imagePath?: string;
	error?: string;
}

export interface EditImageResponse {
	success: boolean;
	imageId?: string;
	imagePath?: string;
	originalImageId?: string;
	error?: string;
}

// Export inferred types
export type GenerateImageParams = InferInput<typeof generateImageSchema>;
export type EditImageParams = InferInput<typeof editImageSchema>;