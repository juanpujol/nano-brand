#!/usr/bin/env bun
/**
 * Create Memberships Script
 *
 * Creates admin memberships for jp2@laiki.co on all organizations or specific ones.
 * This is useful after running migrations to ensure jp2@laiki.co has access to all organizations.
 */

import { SQL } from 'bun';

// Constants
const JP2_USER_ID = '5ea389fd-b35d-4a40-803a-b2b009e80b99';
const JP2_EMAIL = 'jp2@laiki.co';

// Database connection - Supabase target database
const targetUrl = process.env.DATABASE_URL;
if (!targetUrl) {
	throw new Error('DATABASE_URL environment variable is required');
}
const sql = new SQL(targetUrl);

// Logging utilities
const logSuccess = (message: string) => console.log(`✅ ${message}`);
const logWarning = (message: string) => console.log(`⚠️  ${message}`);
const logError = (message: string) => console.log(`❌ ${message}`);
const logStep = (message: string) => console.log(`🔄 ${message}`);

interface Organization {
	id: string;
	name: string;
	created_at: string;
}

interface MembershipResult {
	organization_id: string;
	organization_name: string;
	status: 'created' | 'already_exists' | 'error';
	error?: string;
}

/**
 * Get all organizations or specific organization by ID
 */
async function getOrganizations(orgId?: string): Promise<Organization[]> {
	try {
		const whereClause = orgId ? sql`WHERE id = ${orgId}` : sql``;
		const organizations = await sql<Organization[]>`
      SELECT id, name, created_at 
      FROM organizations 
      ${whereClause}
      ORDER BY created_at DESC
    `;

		return organizations;
	} catch (error) {
		logError(`Failed to fetch organizations: ${error}`);
		throw error;
	}
}

/**
 * Check if jp2@laiki.co profile exists
 */
async function validateUser(): Promise<boolean> {
	try {
		const profiles = await sql`
      SELECT id, email FROM profiles 
      WHERE id = ${JP2_USER_ID} AND email = ${JP2_EMAIL}
    `;

		if (profiles.length === 0) {
			logError(`User ${JP2_EMAIL} (${JP2_USER_ID}) not found in profiles table`);
			return false;
		}

		logSuccess(`Found user: ${JP2_EMAIL}`);
		return true;
	} catch (error) {
		logError(`Failed to validate user: ${error}`);
		return false;
	}
}

/**
 * Create membership for jp2@laiki.co on a specific organization
 */
async function createMembership(orgId: string, orgName: string): Promise<MembershipResult> {
	try {
		// Check if membership already exists
		const existingMembership = await sql`
      SELECT id FROM memberships 
      WHERE organization_id = ${orgId} 
      AND profile_id = ${JP2_USER_ID}
    `;

		if (existingMembership.length > 0) {
			return {
				organization_id: orgId,
				organization_name: orgName,
				status: 'already_exists'
			};
		}

		// Create new membership
		await sql`
      INSERT INTO memberships (organization_id, profile_id, role, created_at)
      VALUES (${orgId}, ${JP2_USER_ID}, 'admin', NOW())
    `;

		return {
			organization_id: orgId,
			organization_name: orgName,
			status: 'created'
		};
	} catch (error) {
		return {
			organization_id: orgId,
			organization_name: orgName,
			status: 'error',
			error: String(error)
		};
	}
}

/**
 * Create memberships for multiple organizations
 */
async function createMemberships(organizations: Organization[]): Promise<MembershipResult[]> {
	const results: MembershipResult[] = [];

	logStep(`Creating memberships for ${organizations.length} organizations...`);

	for (const org of organizations) {
		logStep(`Processing organization: ${org.name} (${org.id})`);
		const result = await createMembership(org.id, org.name);
		results.push(result);

		switch (result.status) {
			case 'created':
				logSuccess(`✓ Created admin membership for ${org.name}`);
				break;
			case 'already_exists':
				logWarning(`◦ Membership already exists for ${org.name}`);
				break;
			case 'error':
				logError(`✗ Failed to create membership for ${org.name}: ${result.error}`);
				break;
		}
	}

	return results;
}

/**
 * Display summary of results
 */
function displaySummary(results: MembershipResult[]) {
	const created = results.filter((r) => r.status === 'created').length;
	const existing = results.filter((r) => r.status === 'already_exists').length;
	const errors = results.filter((r) => r.status === 'error').length;

	console.log('');
	console.log('📊 Summary:');
	console.log(`   Created: ${created}`);
	console.log(`   Already existed: ${existing}`);
	console.log(`   Errors: ${errors}`);
	console.log(`   Total organizations: ${results.length}`);

	if (errors > 0) {
		console.log('');
		console.log('❌ Errors:');
		results
			.filter((r) => r.status === 'error')
			.forEach((r) => {
				console.log(`   ${r.organization_name} (${r.organization_id}): ${r.error}`);
			});
	}
}

/**
 * Parse command line arguments
 */
function parseArgs() {
	const args = process.argv.slice(2);
	let orgId: string | undefined;
	let dryRun = false;

	for (const arg of args) {
		if (arg.startsWith('--org=')) {
			orgId = arg.split('=')[1];
		} else if (arg === '--dry-run') {
			dryRun = true;
		} else if (arg === '--help' || arg === '-h') {
			showHelp();
			process.exit(0);
		}
	}

	return { orgId, dryRun };
}

/**
 * Show help message
 */
function showHelp() {
	console.log('Create Memberships Script');
	console.log('');
	console.log('Creates admin memberships for jp2@laiki.co on organizations.');
	console.log('');
	console.log('Usage:');
	console.log('  bun run scripts/db/migration/create-memberships.ts [options]');
	console.log('');
	console.log('Options:');
	console.log('  --org=ORG_ID    Create membership for specific organization ID');
	console.log('  --dry-run       Preview what would be created without making changes');
	console.log('  --help, -h      Show this help message');
	console.log('');
	console.log('Examples:');
	console.log('  # Create memberships for all organizations');
	console.log('  bun run scripts/db/migration/create-memberships.ts');
	console.log('');
	console.log('  # Create membership for specific organization');
	console.log('  bun run scripts/db/migration/create-memberships.ts --org=abc123def456');
	console.log('');
	console.log('  # Preview without making changes');
	console.log('  bun run scripts/db/migration/create-memberships.ts --dry-run');
}

/**
 * Main execution function
 */
async function main() {
	const { orgId, dryRun } = parseArgs();

	try {
		console.log('🚀 Starting membership creation script...');
		console.log(`Target user: ${JP2_EMAIL} (${JP2_USER_ID})`);
		console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
		if (orgId) {
			console.log(`Target organization: ${orgId}`);
		} else {
			console.log('Target: All organizations');
		}
		console.log('');

		// 1. Validate user exists
		logStep('Validating user...');
		const userValid = await validateUser();
		if (!userValid) {
			logError('User validation failed. Exiting.');
			process.exit(1);
		}

		// 2. Get organizations
		logStep('Fetching organizations...');
		const organizations = await getOrganizations(orgId);

		if (organizations.length === 0) {
			logWarning(orgId ? `Organization ${orgId} not found` : 'No organizations found');
			process.exit(0);
		}

		logSuccess(`Found ${organizations.length} organization(s)`);
		organizations.forEach((org) => {
			console.log(`   - ${org.name} (${org.id})`);
		});
		console.log('');

		if (dryRun) {
			logWarning('DRY RUN MODE - No memberships will be created');
			return;
		}

		// 3. Create memberships
		const results = await createMemberships(organizations);

		// 4. Display summary
		displaySummary(results);

		const hasErrors = results.some((r) => r.status === 'error');
		if (hasErrors) {
			process.exit(1);
		}

		logSuccess('🎉 Membership creation completed successfully!');
	} catch (error) {
		logError(`Script failed: ${error}`);
		process.exit(1);
	}
}

// Handle script interruption
process.on('SIGINT', async () => {
	logWarning('Script interrupted by user');
	process.exit(0);
});

// Run the script
main().catch((error) => {
	logError(`Unexpected error: ${error}`);
	process.exit(1);
});
