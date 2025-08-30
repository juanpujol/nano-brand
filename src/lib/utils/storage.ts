import { PUBLIC_STORAGE_URL } from '$env/static/public';

/**
 * Gets the full URL for a file stored in Supabase Storage
 * @param filePath The relative file path stored in the database
 * @returns Full URL to access the file
 */
export function getStorageUrl(filePath: string | null): string | null {
	if (!filePath) return null;
	return `${PUBLIC_STORAGE_URL}/${filePath}`;
}

/**
 * Gets the full URL for an organization's logo
 * @param logoPath The logo path stored in organization.logo column
 * @returns Full URL to the organization's logo, or null if no logo
 */
export function getOrganizationLogoUrl(logoPath: string | null): string | null {
	return getStorageUrl(logoPath);
}