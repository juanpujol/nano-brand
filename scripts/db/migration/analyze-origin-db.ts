#!/usr/bin/env bun

/**
 * Origin Database Analysis Script
 *
 * This script:
 * 1. Starts a temporary PostgreSQL container
 * 2. Restores the origin database dump
 * 3. Analyzes the schema and data
 * 4. Generates a comprehensive report for migration planning
 * 5. Cleans up the temporary container
 *
 * Usage:
 *   bun run scripts/db/migration/analyze-origin-db.ts
 *   bun run scripts/db/migration/analyze-origin-db.ts path/to/specific/dump.dump
 */

import { $ } from 'bun';
import { SQL } from 'bun';
import { existsSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Configuration
const BACKUP_DIR = 'data/db-dumps';
const CONTAINER_NAME = 'laiki-migration-analysis-db';
const DB_PASSWORD = 'migration_password';
const DB_PORT = 5433; // Different port to avoid conflicts
const REPORT_FILE = 'scripts/db/migration/origin-db-analysis-report.md';

// Colors for console output
const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m'
};

function logInfo(message: string) {
	console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logSuccess(message: string) {
	console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logWarning(message: string) {
	console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logError(message: string) {
	console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logStep(message: string) {
	console.log(`${colors.cyan}🔄 ${message}${colors.reset}`);
}

/**
 * Detect PostgreSQL version from filename
 */
function detectPgVersion(filename: string): string {
	const match = filename.match(/pg(\d+)/);
	return match ? match[1] : '16';
}

/**
 * Find the latest backup file
 */
function findLatestBackup(): string {
	if (!existsSync(BACKUP_DIR)) {
		throw new Error(`Backup directory '${BACKUP_DIR}' does not exist!`);
	}

	// Get all .dump files in the backup directory
	const files = readdirSync(BACKUP_DIR)
		.filter((file: string) => file.endsWith('.dump'))
		.map((file: string) => {
			const fullPath = join(BACKUP_DIR, file);
			const stats = statSync(fullPath);
			return {
				name: file,
				path: fullPath,
				mtime: stats.mtime,
				// Extract date from filename for sorting (e.g., "2025-08-25T23-00-00")
				dateFromName: file.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/)?.[1] || ''
			};
		})
		.sort((a, b) => {
			// First try to sort by date extracted from filename
			if (a.dateFromName && b.dateFromName) {
				return b.dateFromName.localeCompare(a.dateFromName);
			}
			// Fallback to file modification time
			return b.mtime.getTime() - a.mtime.getTime();
		});

	if (files.length === 0) {
		throw new Error(`No .dump files found in '${BACKUP_DIR}' directory!`);
	}

	const latestFile = files[0];
	logInfo(`Found ${files.length} backup files, selected: ${latestFile.name}`);

	return latestFile.path;
}

/**
 * Start PostgreSQL container for analysis
 */
async function startAnalysisContainer(pgVersion: string): Promise<void> {
	logStep('Starting temporary PostgreSQL container for analysis...');

	// Stop and remove if exists
	try {
		await $`docker stop ${CONTAINER_NAME}`.quiet();
		await $`docker rm ${CONTAINER_NAME}`.quiet();
	} catch {
		// Container doesn't exist, that's fine
	}

	// Start new container
	const dockerImage = `postgres:${pgVersion}`;
	await $`docker run -d --name ${CONTAINER_NAME} -e POSTGRES_PASSWORD=${DB_PASSWORD} -p ${DB_PORT}:5432 ${dockerImage}`;

	// Wait for PostgreSQL to be ready
	logStep('Waiting for PostgreSQL to start...');
	await new Promise((resolve) => setTimeout(resolve, 10000));

	logSuccess(`PostgreSQL ${pgVersion} container started on port ${DB_PORT}`);
}

/**
 * Restore database dump
 */
async function restoreDatabase(backupFile: string): Promise<void> {
	logStep(`Restoring database from: ${backupFile}`);

	try {
		// Use docker exec to run pg_restore inside the container
		await $`docker cp ${backupFile} ${CONTAINER_NAME}:/backup.dump`;

		await $`docker exec -e PGPASSWORD=${DB_PASSWORD} ${CONTAINER_NAME} pg_restore --verbose --clean --no-acl --no-owner --if-exists -U postgres -d postgres /backup.dump`.quiet();

		logSuccess('Database restoration completed (errors are expected for Supabase extensions)');
	} catch {
		logWarning('Restoration completed with expected errors (Supabase extensions/roles missing)');
	}
}

/**
 * Analyze database schema and generate report
 */
async function analyzeDatabase(): Promise<string> {
	logStep('Connecting to database for analysis...');

	const db = new SQL({
		dialect: 'postgres',
		hostname: 'localhost',
		port: DB_PORT,
		database: 'postgres',
		username: 'postgres',
		password: DB_PASSWORD
	});

	let report = '# Origin Database Analysis Report\\n\\n';
	report += `Generated: ${new Date().toISOString()}\\n\\n`;

	try {
		// 1. Basic Schema Overview
		report += '## 📊 Schema Overview\\n\\n';

		const tables = await db`
      SELECT schemaname, tablename, tableowner
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schemaname, tablename
    `;

		report += `**Total Tables:** ${tables.length}\\n\\n`;

		const schemaGroups = tables.reduce(
			(acc: Record<string, string[]>, table: { schemaname: string; tablename: string }) => {
				if (!acc[table.schemaname]) acc[table.schemaname] = [];
				acc[table.schemaname].push(table.tablename);
				return acc;
			},
			{}
		);

		for (const [schema, tableList] of Object.entries(schemaGroups)) {
			report += `### ${schema} schema (${(tableList as string[]).length} tables)\\n`;
			report += (tableList as string[]).map((t) => `- ${t}`).join('\\n') + '\\n\\n';
		}

		// 2. Core Data Tables Analysis (Focus on public schema)
		report += '## 🎯 Core Data Analysis (Public Schema)\\n\\n';

		const publicTables = tables.filter(
			(t: { schemaname: string; tablename: string }) => t.schemaname === 'public'
		);

		for (const table of publicTables) {
			const tableName = table.tablename;

			// Get row count
			const rowCount = await db`SELECT COUNT(*) as count FROM ${db(tableName)}`;

			// Get column info
			const columns = await db`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = ${tableName}
        ORDER BY ordinal_position
      `;

			report += `### ${tableName}\\n`;
			report += `**Row Count:** ${rowCount[0].count}\\n\\n`;
			report += `**Columns:**\\n`;

			for (const col of columns) {
				report += `- \`${col.column_name}\` (${col.data_type})${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`;
				if (col.column_default) {
					report += ` DEFAULT ${col.column_default}`;
				}
				report += '\\n';
			}
			report += '\\n';

			// Sample data for key tables
			if (['companies', 'contacts', 'conversions', 'leads'].includes(tableName)) {
				try {
					const sampleData = await db`SELECT * FROM ${db(tableName)} LIMIT 3`;
					if (sampleData.length > 0) {
						report += `**Sample Data:**\\n\`\`\`json\\n`;
						report += JSON.stringify(sampleData, null, 2);
						report += '\\n```\\n\\n';
					}
				} catch {
					report += `**Sample Data:** Error retrieving sample data\\n\\n`;
				}
			}
		}

		// 3. Data Quality Analysis
		report += '## 🔍 Data Quality Analysis\\n\\n';

		// Check for tables that might correspond to our target schema
		const keyTables = ['companies', 'contacts', 'conversions', 'leads', 'segments'];

		for (const tableName of keyTables) {
			const tableExists = publicTables.find(
				(t: { schemaname: string; tablename: string }) => t.tablename === tableName
			);
			if (tableExists) {
				report += `### ${tableName} Quality Check\\n`;

				try {
					// Basic quality checks
					const totalRows = await db`SELECT COUNT(*) as count FROM ${db(tableName)}`;

					// Check for NULL values in key fields (this will vary by table)
					if (tableName === 'contacts' || tableName === 'leads') {
						const emailNulls = await db`
              SELECT COUNT(*) as count FROM ${db(tableName)} 
              WHERE email IS NULL OR email = ''
            `;
						const phoneNulls = await db`
              SELECT COUNT(*) as count FROM ${db(tableName)} 
              WHERE phone IS NULL OR phone = ''
            `;

						report += `- Total records: ${totalRows[0].count}\\n`;
						report += `- Records without email: ${emailNulls[0].count}\\n`;
						report += `- Records without phone: ${phoneNulls[0].count}\\n`;

						// Check contact requirement (email OR phone)
						const noContact = await db`
              SELECT COUNT(*) as count FROM ${db(tableName)}
              WHERE (email IS NULL OR email = '') AND (phone IS NULL OR phone = '')
            `;
						report += `- ⚠️ Records without email OR phone: ${noContact[0].count}\\n`;
					}

					if (tableName === 'conversions') {
						const noName = await db`
              SELECT COUNT(*) as count FROM ${db(tableName)}
              WHERE conversion_name IS NULL OR conversion_name = ''
            `;
						const noDate = await db`
              SELECT COUNT(*) as count FROM ${db(tableName)}
              WHERE conversion_date IS NULL
            `;

						report += `- Total conversions: ${totalRows[0].count}\\n`;
						report += `- Conversions without name: ${noName[0].count}\\n`;
						report += `- Conversions without date: ${noDate[0].count}\\n`;
					}
				} catch (error) {
					report += `- ❌ Error analyzing ${tableName}: ${error}\\n`;
				}

				report += '\\n';
			} else {
				report += `### ${tableName} ❌ NOT FOUND\\n\\n`;
			}
		}

		// 4. JSON/Complex Data Analysis
		report += '## 🧩 Complex Data Analysis\\n\\n';

		// Look for JSON fields, arrays, etc.
		const complexColumns = await db`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND (data_type LIKE '%json%' OR data_type = 'ARRAY' OR data_type LIKE '%[]')
      ORDER BY table_name, column_name
    `;

		if (complexColumns.length > 0) {
			report += '**Complex Data Types Found:**\\n';
			for (const col of complexColumns) {
				report += `- ${col.table_name}.${col.column_name} (${col.data_type})\\n`;
			}
			report += '\\n';
		} else {
			report += 'No complex data types (JSON, arrays) found.\\n\\n';
		}

		// 5. Relationship Analysis
		report += '## 🔗 Relationship Analysis\\n\\n';

		const foreignKeys = await db`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `;

		if (foreignKeys.length > 0) {
			report += '**Foreign Key Relationships:**\\n';
			for (const fk of foreignKeys) {
				report += `- ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}\\n`;
			}
			report += '\\n';
		} else {
			report += 'No foreign key constraints found.\\n\\n';
		}

		// 6. Migration Mapping Recommendations
		report += '## 🗺️ Migration Mapping Recommendations\\n\\n';
		report +=
			'Based on the analysis above and the target schema, here are the recommended mappings:\\n\\n';

		const mappingRecommendations = [
			'### companies → organizations',
			'- Preserve: `name`, `created_at`, `updated_at`',
			'- Generate: new `id` (nanoid)',
			'- Map: `active` filter for inclusion',
			'',
			'### contacts → leads',
			'- Preserve: `id` (UUID), `name`, `email`, `phone`, `company`, `job_title`',
			'- Transform: `tags` (JSON array to PostgreSQL array)',
			'- Map: `company_id` to `organization_id`',
			'- Validate: email OR phone required',
			'',
			'### conversions → conversions',
			'- Preserve: `id`, `conversion_name` → `name`',
			'- Map: `contact_id` → `lead_id`, `company_id` → `organization_id`',
			'- Transform: `payload_raw_json` (handle JSON escaping)',
			'- Handle: UTM field mapping',
			''
		];

		report += mappingRecommendations.join('\\n') + '\\n';

		// 7. Potential Issues & Recommendations
		report += '## ⚠️ Potential Migration Issues\\n\\n';

		const issues = [
			"1. **Supabase Extensions**: Original dump contains Supabase-specific extensions that won't restore to vanilla PostgreSQL",
			"2. **Role Dependencies**: Supabase roles (supabase_admin, authenticated, etc.) don't exist in target",
			'3. **JSON Escaping**: Complex JSON payloads in conversions may need special handling',
			'4. **Data Validation**: Some records may not meet target schema constraints',
			'5. **ID Mapping**: Need to maintain referential integrity during transformation'
		];

		report += issues.map((issue) => `${issue}\\n`).join('\\n') + '\\n';

		logSuccess('Database analysis completed');
		return report;
	} catch (error) {
		logError(`Analysis failed: ${error}`);
		report += `\\n## ❌ Analysis Error\\n\\n\`\`\`\\n${error}\\n\`\`\`\\n`;
		return report;
	}
}

/**
 * Cleanup temporary container
 */
async function cleanup(): Promise<void> {
	logStep('Cleaning up temporary container...');

	try {
		await $`docker stop ${CONTAINER_NAME}`.quiet();
		await $`docker rm ${CONTAINER_NAME}`.quiet();
		logSuccess('Cleanup completed');
	} catch (error) {
		logWarning(`Cleanup warning: ${error}`);
	}
}

/**
 * Main execution function
 */
async function main() {
	console.log('🔍 Origin Database Analysis Script');
	console.log('==================================\\n');

	let backupFile: string;

	try {
		// Determine backup file
		if (process.argv.length > 2) {
			backupFile = process.argv[2];
			if (!existsSync(backupFile)) {
				throw new Error(`Backup file not found: ${backupFile}`);
			}
			logInfo(`Using specified backup: ${backupFile}`);
		} else {
			backupFile = findLatestBackup();
			logInfo(`Using default backup: ${backupFile}`);
		}

		// Detect PostgreSQL version
		const pgVersion = detectPgVersion(backupFile);
		logInfo(`Detected PostgreSQL version: ${pgVersion}`);

		// Execute analysis
		await startAnalysisContainer(pgVersion);
		await restoreDatabase(backupFile);

		const report = await analyzeDatabase();

		// Write report to file
		writeFileSync(REPORT_FILE, report);
		logSuccess(`Analysis report written to: ${REPORT_FILE}`);

		// Display summary
		console.log('\\n' + '='.repeat(50));
		logSuccess('🎉 Analysis completed successfully!');
		logInfo(`Report available at: ${REPORT_FILE}`);
		logInfo('Next steps:');
		console.log('  1. Review the analysis report');
		console.log('  2. Create transformation SQL views');
		console.log('  3. Implement Bun migration runner');
		console.log('  4. Test migration with subset of data');
	} catch (error) {
		logError(`Script failed: ${error}`);
		process.exit(1);
	} finally {
		await cleanup();
	}
}

// Handle script interruption
process.on('SIGINT', async () => {
	logWarning('Script interrupted by user');
	await cleanup();
	process.exit(0);
});

// Run the script
main().catch((error) => {
	logError(`Unexpected error: ${error}`);
	process.exit(1);
});
