#!/usr/bin/env bun

/**
 * Selective Migration Runner
 *
 * Migrates data from source database by company and table selection
 * Each source company becomes a new organization with fresh nanoid
 *
 * Usage:
 *   bun run scripts/db/migration/run-migration.ts --source-company "4ee89595-e724-46a2-9585-e57be79581fb"
 *   bun run scripts/db/migration/run-migration.ts --source-company "697c28f3..." --tables "leads,conversions"
 *   bun run scripts/db/migration/run-migration.ts --source-company "355d17f4..." --tables "leads" --dry-run
 */

import { SQL } from 'bun';
import { nanoid } from '../../../src/lib/utils/id.ts';
import { normalizeFieldKey } from './field-mappings.ts';

// Configuration
const SOURCE_DB_CONFIG = {
	dialect: 'postgres',
	hostname: 'localhost',
	port: 5432,
	database: 'postgres',
	username: 'postgres',
	password: 'password'
} as const;

// Available tables for migration (in dependency order)
const AVAILABLE_TABLES = [
	'organizations',
	'leads_custom_fields_definitions',
	'leads',
	'leads_custom_fields',
	'conversions',
	'segments',
	'webhooks'
] as const;

type MigrationTable = (typeof AVAILABLE_TABLES)[number];

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

interface MigrationOptions {
	sourceCompanyId: string;
	tables: MigrationTable[];
	dryRun: boolean;
}

class SelectiveMigrationRunner {
	private sourceDb: SQL;
	private targetDb: SQL;
	private currentOrgId?: string;

	constructor() {
		this.sourceDb = new SQL(SOURCE_DB_CONFIG);

		// Target Supabase database
		const targetUrl = process.env.DATABASE_URL;
		if (!targetUrl) {
			throw new Error('DATABASE_URL environment variable is required');
		}
		this.targetDb = new SQL(targetUrl);
	}

	/**
	 * Main migration orchestrator
	 */
	async runMigration(options: MigrationOptions): Promise<void> {
		const { sourceCompanyId, tables, dryRun } = options;

		try {
			console.log('🚀 Starting selective Bun-powered migration...');
			logInfo(`Source company: ${sourceCompanyId}`);
			logInfo(`Tables: ${tables.join(', ')}`);
			logInfo(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
			console.log('');

			// 1. Validate source company exists and get info
			const companyInfo = await this.validateSourceCompany(sourceCompanyId);
			logSuccess(`Found source company: "${companyInfo.name}"`);

			// 2. Generate new organization ID
			this.currentOrgId = nanoid(12);
			logInfo(`Generated new organization ID: ${this.currentOrgId}`);

			// 3. Setup transformation views with parameters
			await this.setupTransformationViews(sourceCompanyId, this.currentOrgId);
			logSuccess('Transformation views created');

			// 4. Validate source data quality
			await this.validateSourceData();

			// 5. Get migration statistics
			const stats = await this.getMigrationStats();
			this.displayMigrationStats(stats);

			if (dryRun) {
				logWarning('DRY RUN MODE - No data will be migrated');
				return;
			}

			// 6. Confirm before proceeding
			const proceed = await this.confirmMigration(companyInfo.name, stats);
			if (!proceed) {
				logInfo('Migration cancelled by user');
				return;
			}

			// 7. Execute migration in dependency order
			await this.executeMigration(tables);

			// 8. Validate target data
			await this.validateTargetData();

			logSuccess('🎉 Migration completed successfully!');
			console.log(`📊 New organization ID: ${this.currentOrgId}`);
		} catch (error) {
			logError(`Migration failed: ${error}`);
			throw error;
		} finally {
			await this.cleanup();
		}
	}

	/**
	 * Validate that source company exists and get basic info
	 */
	private async validateSourceCompany(companyId: string): Promise<{ name: string }> {
		logStep('Validating source company...');

		const companies = await this.sourceDb`
      SELECT id, name, active 
      FROM companies 
      WHERE id = ${companyId}
    `;

		if (companies.length === 0) {
			throw new Error(`Source company ${companyId} not found`);
		}

		const company = companies[0];
		if (!company.active) {
			logWarning(`Company "${company.name}" is marked as inactive`);
		}

		return { name: company.name };
	}

	/**
	 * Setup transformation views with parameter substitution
	 */
	private async setupTransformationViews(
		sourceCompanyId: string,
		targetOrgId: string
	): Promise<void> {
		logStep('Setting up transformation views...');

		// Clean up any existing views
		await this.sourceDb.file('./scripts/db/migration/sql/cleanup-views.sql');

		// Read and parameterize the main transformation SQL
		const transformationSql = await Bun.file(
			'./scripts/db/migration/sql/transformation-views.sql'
		).text();
		const parameterizedSql = transformationSql
			.replace(/\$source_company_id/g, `'${sourceCompanyId}'`)
			.replace(/\$target_org_id/g, `'${targetOrgId}'`);

		// Use unsafe to execute raw SQL with parameter substitution
		await this.sourceDb.unsafe(parameterizedSql);

		// Also setup custom fields views if needed
		const customFieldsSql = await Bun.file(
			'./scripts/db/migration/sql/custom-fields-transformation.sql'
		).text();
		const parameterizedCustomFieldsSql = customFieldsSql
			.replace(/\$source_company_id/g, `'${sourceCompanyId}'`)
			.replace(/\$target_org_id/g, `'${targetOrgId}'`);

		await this.sourceDb.unsafe(parameterizedCustomFieldsSql);
	}

	/**
	 * Validate source data quality
	 */
	private async validateSourceData(): Promise<void> {
		logStep('Validating source data quality...');

		const validationResults = await this.sourceDb`
      SELECT issue, count 
      FROM migration_validation
    `;

		// Separate positive validations from actual issues
		const positiveValidations = validationResults.filter(
			(r: { issue: string; count: number }) => r.issue === 'source_company_exists' && r.count > 0
		);

		const actualIssues = validationResults.filter(
			(r: { issue: string; count: number }) => r.issue !== 'source_company_exists' && r.count > 0
		);

		const criticalIssues = validationResults.filter(
			(r: { issue: string; count: number }) => r.issue === 'source_company_exists' && r.count === 0
		);

		// Show positive validations as success
		if (positiveValidations.length > 0) {
			positiveValidations.forEach((row: { issue: string; count: number }) => {
				if (row.issue === 'source_company_exists') {
					logSuccess(`✅ Source company found and validated`);
				}
			});
		}

		// Show actual data quality issues
		if (actualIssues.length > 0) {
			logWarning('Data quality issues found:');
			actualIssues.forEach((row: { issue: string; count: number }) => {
				console.log(`  - ${row.issue}: ${row.count} records`);
			});
		}

		// Check for critical issues
		if (criticalIssues.length > 0) {
			logError('❌ Source company not found or inactive');
			throw new Error('Critical validation issues found - cannot proceed');
		}

		if (actualIssues.length === 0 && positiveValidations.length > 0) {
			logSuccess('✅ Data validation passed');
		}
	}

	/**
	 * Get statistics about what will be migrated
	 */
	private async getMigrationStats(): Promise<Record<string, number>> {
		const stats: Record<string, number> = {};

		// Get counts from transformation views
		const tableViews = [
			'organizations_transformed',
			'leads_transformed',
			'conversions_transformed',
			'segments_transformed',
			'leads_custom_fields_definitions_transformed',
			'webhooks_transformed'
		];

		for (const view of tableViews) {
			try {
				const result = await this.sourceDb`SELECT COUNT(*) as count FROM ${this.sourceDb(view)}`;
				stats[view.replace('_transformed', '')] = result[0].count;
			} catch {
				stats[view.replace('_transformed', '')] = 0;
			}
		}

		// Get custom fields stats
		try {
			const customFieldsResult = await this
				.sourceDb`SELECT COUNT(*) as count FROM leads_custom_fields_transformed`;
			stats.custom_fields = customFieldsResult[0].count;
		} catch {
			stats.custom_fields = 0;
		}

		return stats;
	}

	/**
	 * Transform webhook field mappings from old to new format
	 * Old format: webhook_field -> target_field (relative to dataPath)
	 * New format: target_field -> full_webhook_path
	 */
	private transformFieldMappings(oldMappings: any): any {
		if (!oldMappings || typeof oldMappings !== 'object') {
			return oldMappings;
		}

		// Extract the base data path from _structure, default to "data.leads[0]"
		const baseDataPath = oldMappings._structure?.dataPath || "data.leads[0]";
		
		const transformed = {
			leads: {},
			conversions: {},
			custom_fields: {},
			_structure: oldMappings._structure || {
				dataPath: baseDataPath,
				structureInfo: "Migrated from old format"
			}
		};

		// Transform each section - FLIP the key-value pairs
		Object.keys(oldMappings).forEach(section => {
			if (section === '_structure') return;
			
			if (section === 'leads' || section === 'conversions' || section === 'custom_fields') {
				const sectionData = oldMappings[section];
				
				Object.keys(sectionData).forEach(webhookField => {
					const targetField = sectionData[webhookField];
					
					// Skip metadata in custom_fields
					if (section === 'custom_fields' && (webhookField === 'dataPath' || webhookField === 'structureInfo')) {
						return;
					}
					
					// Build full webhook path
					const fullWebhookPath = this.buildFullWebhookPath(webhookField, baseDataPath);
					
					// Normalize target field key for consistency with UI expectations
					const normalizedTargetField = this.normalizeTargetFieldKey(targetField, section);
					
					// Flip: target_field -> full_webhook_path
					transformed[section][normalizedTargetField] = fullWebhookPath;
				});
			}
		});

		return transformed;
	}

	/**
	 * Build full webhook path from relative webhook field
	 */
	private buildFullWebhookPath(webhookField: string, baseDataPath: string): string {
		if (!webhookField || typeof webhookField !== 'string') {
			return webhookField;
		}

		// If it already includes dots (complex path), prepend baseDataPath
		if (webhookField.includes('.')) {
			return `${baseDataPath}.${webhookField}`;
		}

		// Simple field name gets baseDataPath prepended
		return `${baseDataPath}.${webhookField}`;
	}

	/**
	 * Normalize target field keys to match UI expectations
	 * Uses centralized field key mappings for consistency
	 */
	private normalizeTargetFieldKey(targetField: string, section: string): string {
		return normalizeFieldKey(targetField, section);
	}

	/**
	 * Transform rule JSON field references to match new schema
	 */
	private transformRuleJsonFields(ruleJsonString: string): string {
		if (!ruleJsonString) {
			return '{}';
		}

		try {
			const parsed = JSON.parse(ruleJsonString);

			// Transform field names recursively
			const transformFields = (obj: unknown): unknown => {
				if (Array.isArray(obj)) {
					return obj.map(transformFields);
				} else if (obj && typeof obj === 'object') {
					const transformed = { ...obj };

					// Transform field names in rules using centralized mappings
					if (transformed.field) {
						// Try conversion fields first (includes lead-level UTM fields)
						let normalizedField = normalizeFieldKey(transformed.field, 'conversions');
						
						// If no conversion mapping found, try leads
						if (normalizedField === transformed.field) {
							normalizedField = normalizeFieldKey(transformed.field, 'leads');
						}
						
						transformed.field = normalizedField;
					}

					// Recursively transform nested objects and arrays
					Object.keys(transformed).forEach((key) => {
						transformed[key] = transformFields(transformed[key]);
					});

					return transformed;
				}
				return obj;
			};

			const transformedRule = transformFields(parsed);
			return JSON.stringify(transformedRule);
		} catch (error) {
			console.warn(`Failed to parse rule JSON, using empty object:`, error);
			return '{}';
		}
	}

	/**
	 * Display migration statistics
	 */
	private displayMigrationStats(stats: Record<string, number>): void {
		console.log('\n📊 Migration Statistics:');
		Object.entries(stats).forEach(([table, count]) => {
			console.log(`  ${table}: ${count.toLocaleString()} records`);
		});
		console.log('');
	}

	/**
	 * Confirm migration with user
	 */
	private async confirmMigration(
		companyName: string,
		stats: Record<string, number>
	): Promise<boolean> {
		const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0);

		console.log(
			`⚠️  About to migrate ${totalRecords.toLocaleString()} records from "${companyName}"`
		);
		console.log(`🎯 This will create a new organization with ID: ${this.currentOrgId}`);

		// In a real CLI, you'd use a proper prompt library
		// For now, we'll assume confirmation (can be enhanced later)
		return true;
	}

	/**
	 * Execute the actual migration
	 */
	private async executeMigration(tables: MigrationTable[]): Promise<void> {
		// Filter requested tables to maintain dependency order
		const orderedTables = AVAILABLE_TABLES.filter(
			(table) => tables.includes(table) || tables.includes('all')
		);

		for (const table of orderedTables) {
			await this.migrateTable(table);
		}

		// Custom fields are now handled as a regular table in AVAILABLE_TABLES
	}

	/**
	 * Migrate a single table
	 */
	private async migrateTable(table: MigrationTable): Promise<void> {
		logStep(`Migrating ${table}...`);

		try {
			// Get data from transformation view using unsafe for dynamic table names
			const viewName = `${table}_transformed`;
			const transformedData = await this.sourceDb.unsafe(`SELECT * FROM ${viewName}`);

			if (transformedData.length === 0) {
				logWarning(`No data found for ${table}`);
				return;
			}

			logInfo(`📦 Found ${transformedData.length} ${table} records to migrate`);

			// Handle conversions with pure batch processing (duplicates pre-filtered)
			if (table === 'conversions') {
				// Process in batches for better performance and memory usage
				const batchSize = 200; // Larger batches since no duplicates to handle
				for (let i = 0; i < transformedData.length; i += batchSize) {
					const batch = transformedData.slice(i, i + batchSize);

					// Build values array for batch insert
					const values = batch
						.map(
							(record) => `(
            '${record.id}', '${record.organization_id}', '${record.lead_id}', 
            ${record.name ? `'${record.name.replace(/'/g, "''")}'` : 'NULL'},
            ${record.identifier ? `'${record.identifier.replace(/'/g, "''")}'` : 'NULL'},
            ${record.external_id ? `'${record.external_id.replace(/'/g, "''")}'` : 'NULL'},
            ${record.external_source ? `'${record.external_source.replace(/'/g, "''")}'` : 'NULL'},
            '${record.date.toISOString()}',
            ${record.value || 'NULL'},
            ${record.source ? `'${record.source.replace(/'/g, "''")}'` : 'NULL'},
            ${record.utm_source ? `'${record.utm_source.replace(/'/g, "''")}'` : 'NULL'},
            ${record.utm_medium ? `'${record.utm_medium.replace(/'/g, "''")}'` : 'NULL'},
            ${record.utm_campaign ? `'${record.utm_campaign.replace(/'/g, "''")}'` : 'NULL'},
            ${record.utm_content ? `'${record.utm_content.replace(/'/g, "''")}'` : 'NULL'},
            ${record.utm_term ? `'${record.utm_term.replace(/'/g, "''")}'` : 'NULL'},
            ${record.utm_channel ? `'${record.utm_channel.replace(/'/g, "''")}'` : 'NULL'},
            ${record.conversion_url ? `'${record.conversion_url.replace(/'/g, "''")}'` : 'NULL'},
            ${record.conversion_domain ? `'${record.conversion_domain.replace(/'/g, "''")}'` : 'NULL'},
            ${record.device ? `'${record.device.replace(/'/g, "''")}'` : 'NULL'},
            '${JSON.stringify(record.raw_payload).replace(/'/g, "''")}',
            '${record.idempotency_hash}',
            '${record.created_at.toISOString()}'
          )`
						)
						.join(',');

					await this.targetDb.unsafe(`
            INSERT INTO conversions (
              id, organization_id, lead_id, name, identifier, external_id, external_source, 
              date, value, source, utm_source, utm_medium, utm_campaign, utm_content, 
              utm_term, utm_channel, conversion_url, conversion_domain, device, 
              raw_payload, idempotency_hash, created_at
            ) VALUES ${values}
            ON CONFLICT (id) DO NOTHING
          `);

					logInfo(
						`📦 Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(transformedData.length / batchSize)}`
					);
				}
				return; // Exit early since we did batch insert
			}

			// Insert records one by one for other tables
			for (const [, record] of transformedData.entries()) {
				if (table === 'organizations') {
					await this.targetDb`
            INSERT INTO organizations (id, name, website, logo, email, is_active, created_at, updated_at)
            VALUES (${record.id}, ${record.name}, ${record.website}, ${record.logo}, ${record.email}, ${record.is_active}, ${record.created_at}, ${record.updated_at})
          `;
				} else if (table === 'leads') {
					// Convert tags_json back to PostgreSQL array format
					const tagsArray = record.tags_json ? JSON.parse(record.tags_json) : [];

					// Build PostgreSQL array literal
					const tagsArrayLiteral =
						tagsArray.length === 0
							? 'ARRAY[]::text[]'
							: `ARRAY[${tagsArray.map((tag) => `'${tag.replace(/'/g, "''")}'`).join(',')}]::text[]`;

					await this.targetDb.unsafe(`
            INSERT INTO leads (
              id, organization_id, name, email, secondary_email, phone, secondary_phone, 
              company, job_title, import_method, external_id, external_source, 
              fit_score, interest, total_conversions, first_conversion_date, last_conversion_date,
              first_conversion_utm_source, first_conversion_utm_medium, first_conversion_utm_campaign,
              first_conversion_utm_content, first_conversion_utm_term,
              last_conversion_utm_source, last_conversion_utm_medium, last_conversion_utm_campaign,
              last_conversion_utm_content, last_conversion_utm_term,
              tags, notes, created_at, updated_at
            ) VALUES (
              '${record.id}', '${record.organization_id}', ${record.name ? `'${record.name.replace(/'/g, "''")}'` : 'NULL'}, 
              ${record.email ? `'${record.email.replace(/'/g, "''")}'` : 'NULL'}, ${record.secondary_email ? `'${record.secondary_email.replace(/'/g, "''")}'` : 'NULL'},
              ${record.phone ? `'${record.phone.replace(/'/g, "''")}'` : 'NULL'}, ${record.secondary_phone ? `'${record.secondary_phone.replace(/'/g, "''")}'` : 'NULL'}, 
              ${record.company ? `'${record.company.replace(/'/g, "''")}'` : 'NULL'}, ${record.job_title ? `'${record.job_title.replace(/'/g, "''")}'` : 'NULL'}, 
              ${record.import_method ? `'${record.import_method.replace(/'/g, "''")}'` : 'NULL'}, '${record.external_id}', '${record.external_source}',
              ${record.fit_score ? `'${record.fit_score}'` : 'NULL'}, ${record.interest || 0}, ${record.total_conversions || 0}, 
              ${record.first_conversion_date ? `'${record.first_conversion_date.toISOString()}'` : 'NULL'}, 
              ${record.last_conversion_date ? `'${record.last_conversion_date.toISOString()}'` : 'NULL'},
              ${record.first_conversion_utm_source ? `'${record.first_conversion_utm_source.replace(/'/g, "''")}'` : 'NULL'}, 
              ${record.first_conversion_utm_medium ? `'${record.first_conversion_utm_medium.replace(/'/g, "''")}'` : 'NULL'}, 
              ${record.first_conversion_utm_campaign ? `'${record.first_conversion_utm_campaign.replace(/'/g, "''")}'` : 'NULL'}, 
              ${record.first_conversion_utm_content ? `'${record.first_conversion_utm_content.replace(/'/g, "''")}'` : 'NULL'}, 
              ${record.first_conversion_utm_term ? `'${record.first_conversion_utm_term.replace(/'/g, "''")}'` : 'NULL'}, 
              ${record.last_conversion_utm_source ? `'${record.last_conversion_utm_source.replace(/'/g, "''")}'` : 'NULL'}, 
              ${record.last_conversion_utm_medium ? `'${record.last_conversion_utm_medium.replace(/'/g, "''")}'` : 'NULL'}, 
              ${record.last_conversion_utm_campaign ? `'${record.last_conversion_utm_campaign.replace(/'/g, "''")}'` : 'NULL'}, 
              ${record.last_conversion_utm_content ? `'${record.last_conversion_utm_content.replace(/'/g, "''")}'` : 'NULL'}, 
              ${record.last_conversion_utm_term ? `'${record.last_conversion_utm_term.replace(/'/g, "''")}'` : 'NULL'},
              ${tagsArrayLiteral}, ${record.notes ? `'${record.notes.replace(/'/g, "''")}'` : 'NULL'}, 
              '${record.created_at.toISOString()}', '${record.updated_at.toISOString()}'
            )
            ON CONFLICT (id) DO UPDATE SET updated_at = EXCLUDED.updated_at
          `);
				} else if (table === 'leads_custom_fields_definitions') {
					await this.targetDb`
            INSERT INTO leads_custom_fields_definitions (
              id, organization_id, field_key, label, type, description, is_required, created_at, updated_at
            ) VALUES (
              ${record.id}, ${record.organization_id}, ${record.field_key}, ${record.label}, 
              ${record.type}, ${record.description}, ${record.is_required}, 
              ${record.created_at}, ${record.updated_at}
            )
            ON CONFLICT (organization_id, field_key) DO UPDATE SET 
              label = EXCLUDED.label,
              type = EXCLUDED.type,
              description = EXCLUDED.description,
              is_required = EXCLUDED.is_required,
              updated_at = EXCLUDED.updated_at
          `;
				} else if (table === 'leads_custom_fields') {
					await this.targetDb`
            INSERT INTO leads_custom_fields (
              lead_id, organization_id, field_key, field_value, created_at
            ) VALUES (
              ${record.lead_id}, ${record.organization_id}, ${record.field_key}, 
              ${record.field_value}, ${record.created_at}
            )
            ON CONFLICT (lead_id, organization_id, field_key) DO UPDATE SET 
              field_value = EXCLUDED.field_value,
              created_at = EXCLUDED.created_at
          `;
				} else if (table === 'segments') {
					// Transform rule_json field references to match new schema
					const transformedRuleJson = this.transformRuleJsonFields(
						JSON.stringify(record.rule_json)
					);

					await this.targetDb`
            INSERT INTO segments (
              id, organization_id, name, description, rule_json, created_at, updated_at
            ) VALUES (
              ${record.id}, ${record.organization_id}, ${record.name}, ${record.description}, 
              ${JSON.parse(transformedRuleJson)}, ${record.created_at}, ${record.updated_at}
            )
            ON CONFLICT (id) DO UPDATE SET 
              name = EXCLUDED.name,
              description = EXCLUDED.description,
              rule_json = EXCLUDED.rule_json,
              updated_at = EXCLUDED.updated_at
          `;
				} else if (table === 'webhooks') {
					// Generate new nanoid for each webhook (not preserving original UUID)
					const newWebhookId = nanoid(12);

					// Transform field mappings from old to new format
					const transformedMappings = this.transformFieldMappings(record.field_mapping);

					await this.targetDb`
            INSERT INTO webhooks (
              id, organization_id, name, description, field_mappings, sample_payload, 
              is_active, created_at, updated_at
            ) VALUES (
              ${newWebhookId}, ${record.organization_id}, ${record.name}, ${record.description},
              ${transformedMappings}, ${record.sample_payload}, ${record.is_active},
              ${record.created_at}, ${record.updated_at}
            )
            ON CONFLICT (id) DO UPDATE SET 
              name = EXCLUDED.name,
              description = EXCLUDED.description,
              field_mappings = EXCLUDED.field_mappings,
              sample_payload = EXCLUDED.sample_payload,
              is_active = EXCLUDED.is_active,
              updated_at = EXCLUDED.updated_at
          `;
				}
			}

			logSuccess(`✅ Successfully migrated ${transformedData.length} ${table} records`);
		} catch (error) {
			throw new Error(`Failed to migrate ${table}: ${error}`);
		}
	}

	/**
	 * Handle custom fields migration with batching for performance
	 */
	private async migrateCustomFields(): Promise<void> {
		logStep('Migrating custom fields (large dataset - using batches)...');

		const batchSize = 1000;
		let offset = 0;
		let totalMigrated = 0;

		while (true) {
			const batch = await this.sourceDb`
        SELECT * FROM leads_custom_fields_transformed
        ORDER BY id
        LIMIT ${batchSize}
        OFFSET ${offset}
      `;

			if (batch.length === 0) break;

			const transaction = await this.targetDb.begin();
			try {
				await transaction`
          INSERT INTO leads_custom_fields ${transaction.values(batch)}
          ON CONFLICT (id) DO UPDATE SET
            field_value = EXCLUDED.field_value,
            created_at = EXCLUDED.created_at
        `;
				await transaction.commit();

				totalMigrated += batch.length;
				offset += batchSize;

				logInfo(`📦 Migrated ${totalMigrated} custom field records so far...`);
			} catch (error) {
				await transaction.rollback();
				throw new Error(`Failed to migrate custom fields batch at offset ${offset}: ${error}`);
			}
		}

		logSuccess(`✅ Successfully migrated ${totalMigrated} custom field records`);
	}

	/**
	 * Validate migrated data in target database
	 */
	private async validateTargetData(): Promise<void> {
		logStep('Validating migrated data...');

		if (!this.currentOrgId) {
			throw new Error('Organization ID not available for validation');
		}

		// Check record counts
		const validation = await this.targetDb`
      SELECT 
        'organizations' as table_name,
        count(*) as record_count
      FROM organizations
      WHERE id = ${this.currentOrgId}
      UNION ALL
      SELECT 'leads', count(*) FROM leads WHERE organization_id = ${this.currentOrgId}
      UNION ALL  
      SELECT 'conversions', count(*) FROM conversions WHERE organization_id = ${this.currentOrgId}
    `;

		console.log('\n📊 Target database record counts:');
		validation.forEach((row: { table_name: string; record_count: number }) => {
			console.log(`  ${row.table_name}: ${row.record_count} records`);
		});

		// Check referential integrity
		const integrityCheck = await this.targetDb`
      SELECT 
        'orphaned_leads' as issue,
        count(*) as count
      FROM leads l
      LEFT JOIN organizations o ON l.organization_id = o.id
      WHERE l.organization_id = ${this.currentOrgId} AND o.id IS NULL
      UNION ALL
      SELECT 
        'orphaned_conversions',
        count(*)
      FROM conversions c
      LEFT JOIN leads l ON c.lead_id = l.id
      WHERE c.organization_id = ${this.currentOrgId} AND l.id IS NULL
    `;

		const issues = integrityCheck.filter((row: { issue: string; count: number }) => row.count > 0);
		if (issues.length > 0) {
			logError('Data integrity issues found:');
			issues.forEach((issue: { issue: string; count: number }) => {
				logError(`  - ${issue.issue}: ${issue.count} records`);
			});
			throw new Error('Data integrity validation failed');
		}

		logSuccess('✅ Data integrity validation passed');
	}

	/**
	 * Cleanup transformation views
	 */
	private async cleanup(): Promise<void> {
		try {
			await this.sourceDb.file('./scripts/db/migration/sql/cleanup-views.sql');
		} catch (error) {
			logWarning(`Cleanup warning: ${error}`);
		}
	}
}

/**
 * Parse command line arguments
 */
function parseArgs(): MigrationOptions {
	const args = process.argv.slice(2);

	const sourceCompanyArg = args.find((arg) => arg.startsWith('--source-company='))?.split('=')[1];
	const tablesArg = args.find((arg) => arg.startsWith('--tables='))?.split('=')[1];
	const dryRun = args.includes('--dry-run');

	if (!sourceCompanyArg) {
		console.error('❌ --source-company is required');
		console.log('\nUsage:');
		console.log('  bun run scripts/db/migration/run-migration.ts --source-company="company-uuid"');
		console.log(
			'  bun run scripts/db/migration/run-migration.ts --source-company="company-uuid" --tables="leads,conversions"'
		);
		console.log(
			'  bun run scripts/db/migration/run-migration.ts --source-company="company-uuid" --dry-run'
		);
		process.exit(1);
	}

	const tables: MigrationTable[] = tablesArg
		? (tablesArg.split(',').map((t) => t.trim()) as MigrationTable[])
		: [...AVAILABLE_TABLES]; // Default to all tables

	// Validate table names
	const validTables = [...AVAILABLE_TABLES, 'all'];
	const invalidTables = tables.filter((table) => !validTables.includes(table));
	if (invalidTables.length > 0) {
		console.error(`❌ Invalid tables: ${invalidTables.join(', ')}`);
		console.log(`Valid tables: ${validTables.join(', ')}`);
		process.exit(1);
	}

	return {
		sourceCompanyId: sourceCompanyArg,
		tables,
		dryRun
	};
}

/**
 * Show help information
 */
function showHelp() {
	console.log('🔄 Selective Migration Runner');
	console.log('');
	console.log('Migrates data from source database by company and table selection.');
	console.log('Each source company becomes a new organization with fresh nanoid.');
	console.log('');
	console.log('Usage:');
	console.log('  bun run scripts/db/migration/run-migration.ts --source-company="company-uuid"');
	console.log(
		'  bun run scripts/db/migration/run-migration.ts --source-company="company-uuid" --tables="leads,conversions"'
	);
	console.log(
		'  bun run scripts/db/migration/run-migration.ts --source-company="company-uuid" --dry-run'
	);
	console.log('');
	console.log('Options:');
	console.log('  --source-company=UUID    Source company ID to migrate (required)');
	console.log('  --tables=list           Comma-separated list of tables (default: all)');
	console.log('  --dry-run              Preview what would be migrated without changes');
	console.log('  --help                 Show this help message');
	console.log('');
	console.log('Available tables:');
	console.log(`  ${AVAILABLE_TABLES.join(', ')}`);
	console.log('');
	console.log('Examples:');
	console.log('  # Test with single company, leads only');
	console.log('  bun run scripts/db/migration/run-migration.ts \\');
	console.log('    --source-company="697c28f3-a401-4836-af93-891a2b98740d" \\');
	console.log('    --tables="leads" --dry-run');
	console.log('');
	console.log('  # Full migration with all tables');
	console.log('  bun run scripts/db/migration/run-migration.ts \\');
	console.log('    --source-company="4ee89595-e724-46a2-9585-e57be79581fb"');
}

/**
 * Main execution
 */
async function main() {
	const args = process.argv.slice(2);

	if (args.includes('--help') || args.includes('-h')) {
		showHelp();
		return;
	}

	try {
		const options = parseArgs();
		const runner = new SelectiveMigrationRunner();
		await runner.runMigration(options);
	} catch (error) {
		logError(`Migration failed: ${error}`);
		process.exit(1);
	}
}

// Handle script interruption
process.on('SIGINT', async () => {
	logWarning('Migration interrupted by user');
	process.exit(0);
});

// Run the migration
main().catch((error) => {
	logError(`Unexpected error: ${error}`);
	process.exit(1);
});
