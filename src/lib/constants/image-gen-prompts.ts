/**
 * System prompts and templates for AI image generation
 * These prompts ensure brand consistency and professional quality
 */

export interface BrandContext {
	name: string;
	industry?: string;
	description?: string;
	brandVoice?: string[];
	logoPolicy?: string;
	colorPalette?: string[];
}

export interface ProductContext {
	name: string;
	description?: string;
	tags?: string[];
}

/**
 * Core system prompt for image generation
 * This provides foundational instructions for professional, on-brand image creation
 */
export const CORE_IMAGE_GENERATION_PROMPT = `
You are a professional brand designer and photographer creating high-quality marketing materials. 
Generate images that are:
- Professional and commercially viable
- Consistent with brand identity and visual language
- Suitable for marketing, advertising, and promotional use
- High resolution with excellent composition and lighting
- Modern and visually appealing

Always maintain brand consistency and create images that would be appropriate for commercial use.
`;

/**
 * Builds product context for atmosphere, environment, and vibe guidance
 * This helps inform the mood and setting without literally including product details
 */
export function buildProductContextPrompt(productContext: ProductContext): string {
	const sections: string[] = [];

	sections.push(`\n## PRODUCT CONTEXT FOR ATMOSPHERE & VIBE`);
	sections.push(`Product Name: ${productContext.name}`);
	sections.push(`This information is for creating appropriate atmosphere, environment, and mood - NOT for literal inclusion in the image.`);

	if (productContext.description) {
		sections.push(`\nProduct Context: ${productContext.description}`);
		sections.push(`Use this context to understand the appropriate mood, setting, and atmosphere for the image.`);
	}

	if (productContext.tags && productContext.tags.length > 0) {
		sections.push(`\nProduct Characteristics: ${productContext.tags.join(', ')}`);
		sections.push(`These characteristics should inform the visual style, mood, and environmental context of the image.`);
	}

	// Atmosphere and environment guidance
	sections.push(`\n## ATMOSPHERE GUIDELINES`);
	sections.push(`- Create an environment and mood that complements this product context`);
	sections.push(`- Choose lighting, colors, and composition that reflect the product's intended use and audience`);
	sections.push(`- Consider the lifestyle and environment where this product would naturally fit`);
	sections.push(`- The goal is to create imagery that evokes the right feeling and context, not to show the product itself`);

	return sections.join('\n');
}

/**
 * Builds a comprehensive brand context prompt based on organization information
 */
export function buildBrandSystemPrompt(brandContext: BrandContext): string {
	const sections: string[] = [CORE_IMAGE_GENERATION_PROMPT];

	// Brand identity section
	sections.push(`\n## BRAND IDENTITY`);
	sections.push(`Brand: ${brandContext.name}`);
	
	if (brandContext.industry) {
		sections.push(`Industry: ${brandContext.industry}`);
	}

	if (brandContext.description) {
		sections.push(`Brand Description: ${brandContext.description}`);
	}

	// Brand voice and tone
	if (brandContext.brandVoice && brandContext.brandVoice.length > 0) {
		sections.push(`\n## BRAND VOICE & PERSONALITY`);
		sections.push(`The brand embodies these qualities: ${brandContext.brandVoice.join(', ')}`);
		sections.push(`Ensure all visual elements reflect this brand personality and tone.`);
	}

	// Logo usage guidelines
	if (brandContext.logoPolicy) {
		sections.push(`\n## LOGO USAGE`);
		const logoInstructions = getLogoPolicyInstructions(brandContext.logoPolicy);
		sections.push(logoInstructions);
	}

	// Color palette guidelines
	if (brandContext.colorPalette && brandContext.colorPalette.length > 0) {
		sections.push(`\n## COLOR PALETTE`);
		sections.push(`Brand colors: ${brandContext.colorPalette.join(', ')}`);
		sections.push(`Use these colors as the primary palette. You can use variations and complementary colors, but ensure the brand colors are prominent and recognizable.`);
	}

	// Quality and consistency guidelines
	sections.push(`\n## VISUAL STANDARDS`);
	sections.push(`- Maintain consistent visual style across all generated images`);
	sections.push(`- Use professional photography techniques (proper lighting, composition, depth of field)`);
	sections.push(`- Ensure images work well for both digital and print applications`);
	sections.push(`- Create images that align with modern design trends while respecting brand identity`);

	return sections.join('\n');
}

/**
 * Gets logo policy instructions based on organization preferences
 */
function getLogoPolicyInstructions(logoPolicy: string): string {
	switch (logoPolicy) {
		case 'always':
			return `CRITICAL: The brand logo must be prominently featured in every generated image. The logo should be clearly visible and well-integrated into the design. Never generate images without the logo.`;
		
		case 'usually':
			return `IMPORTANT: Include the brand logo in most generated images when it makes sense visually. The logo should be tastefully integrated and enhance rather than distract from the overall design.`;
		
		case 'rarely':
			return `The brand logo should only be included when specifically requested or when it significantly enhances the image's purpose. Focus on conveying brand identity through colors, style, and visual elements rather than explicit logo placement.`;
		
		default:
			return `Include the brand logo when it enhances the image and maintains good composition.`;
	}
}

/**
 * Additional prompt modifiers for specific image types
 */
export const IMAGE_TYPE_MODIFIERS = {
	product: `Focus on showcasing the product clearly with professional product photography techniques. Use clean backgrounds, proper lighting, and angles that highlight the product's best features.`,
	
	lifestyle: `Create lifestyle imagery that shows the product in use or in natural environments. Include relevant context and atmosphere that resonates with the target audience.`,
	
	hero: `Create bold, attention-grabbing hero images suitable for websites, banners, or advertising. Use dramatic lighting, strong composition, and impactful visual elements.`,
	
	social: `Optimize for social media usage with engaging, shareable content. Consider platform-specific dimensions and visual trends while maintaining brand consistency.`,
	
	editorial: `Create editorial-style imagery with sophisticated composition and storytelling elements. Use professional photography techniques with artistic flair.`
};

/**
 * Quality enhancement instructions
 */
export const QUALITY_ENHANCEMENTS = `
TECHNICAL REQUIREMENTS:
- High resolution and sharp detail
- Professional color grading and balance
- Proper exposure and contrast
- Clean, polished final result
- Commercially viable quality

COMPOSITION GUIDELINES:
- Follow rule of thirds and other photographic principles
- Create visual hierarchy and focus points
- Use appropriate depth of field
- Consider negative space and balance
- Ensure text readability if overlay is needed
`;

/**
 * Builds a comprehensive system prompt combining brand and product context
 */
export function buildComprehensiveSystemPrompt(
	brandContext: BrandContext, 
	productContext?: ProductContext
): string {
	const brandPrompt = buildBrandSystemPrompt(brandContext);
	
	if (productContext) {
		const productPrompt = buildProductContextPrompt(productContext);
		return brandPrompt + productPrompt;
	}
	
	return brandPrompt;
}