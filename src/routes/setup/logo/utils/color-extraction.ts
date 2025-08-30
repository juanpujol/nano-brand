import type ColorThief from 'colorthief';

/**
 * Convert RGB array to hex string
 */
export function rgbToHex(rgb: number[]): string {
	return '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert RGB to HSL for better color similarity comparison
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h, s;
	const l = (max + min) / 2;

	if (max === min) {
		h = s = 0; // achromatic
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
			default: h = 0;
		}
		h /= 6;
	}

	return [h * 360, s * 100, l * 100];
}

/**
 * Check if two colors are too similar
 */
export function areColorsSimilar(rgb1: number[], rgb2: number[]): boolean {
	const [h1, s1, l1] = rgbToHsl(rgb1[0], rgb1[1], rgb1[2]);
	const [h2, s2, l2] = rgbToHsl(rgb2[0], rgb2[1], rgb2[2]);

	// Calculate hue difference (considering circular nature of hue)
	let hueDiff = Math.abs(h1 - h2);
	if (hueDiff > 180) hueDiff = 360 - hueDiff;

	// Calculate saturation and lightness differences
	const satDiff = Math.abs(s1 - s2);
	const lightDiff = Math.abs(l1 - l2);

	// Colors are similar if they are very close in hue AND saturation AND lightness
	// More restrictive criteria to allow more diverse color selections
	return (hueDiff < 20 && satDiff < 15 && lightDiff < 10);
}

/**
 * Extract colors from image with similarity detection and fallback
 */
export function extractColorsFromImage(
	colorThief: ColorThief,
	img: HTMLImageElement
): string[] {
	try {
		// Get more colors to have better selection options
		const palette = colorThief.getPalette(img, 6);
		if (palette && palette.length >= 3) {
			const colors = [rgbToHex(palette[0])]; // Always keep the dominant color
			const selectedColors = [palette[0]];
			
			// Find up to 2 more colors that are sufficiently different
			for (let i = 1; i < palette.length && selectedColors.length < 3; i++) {
				const candidate = palette[i];
				let isDifferent = true;
				
				// Check if this color is too similar to any already selected color
				for (const selected of selectedColors) {
					if (areColorsSimilar(candidate, selected)) {
						isDifferent = false;
						break;
					}
				}
				
				if (isDifferent) {
					selectedColors.push(candidate);
					colors.push(rgbToHex(candidate));
				}
			}
			
			// Fill remaining slots with fallback colors if we don't have enough diverse colors
			while (colors.length < 3) {
				if (colors.length === 1) {
					colors.push('#DDDDDD');
				} else {
					colors.push('#333333');
				}
			}
			
			return colors;
		}
	} catch (err) {
		console.error('Error extracting colors:', err);
	}
	
	// Fallback colors if extraction fails
	return ['#3B82F6', '#8B5CF6', '#EC4899'];
}