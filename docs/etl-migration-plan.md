# ETL Migration Plan: Database-to-Database Approach

## Overview

This document outlines the recommended approach for migrating data from the old database dump to the new Laiki database schema, replacing the problematic CSV-based migration system.

## Current Issues with CSV Approach

1. **Data Corruption Sources:**
   - JSON payloads in `conversions.payload_raw_json` getting mangled by CSV escaping
   - Complex field mapping with NULL handling causing inconsistencies
   - Array fields (tags) losing proper formatting
   - Multi-byte characters and special characters in text fields

2. **Architectural Problems:**
   - Multi-step dependencies require intermediate CSV storage
   - Loss of data types and constraints during transformation
   - Manual ID mapping maintenance across migration steps

## Recommended ETL Approach: Bun SQL + PostgreSQL

### **Bun SQL Client ETL (Recommended)**

**Architecture:**

```
Source PG Dump → Docker PostgreSQL → Bun SQL Client → Target Supabase
```

**Why Bun SQL is Perfect for This:**

1. **Zero External Dependencies:**
   - No need to install `pg` or other PostgreSQL drivers
   - Built into Bun runtime with native performance optimizations

2. **Performance Advantages:**
   - Claims 50% speed improvement over popular Node.js PostgreSQL clients
   - Built-in connection pooling, query pipelining, and prepared statements
   - Written in native code (Zig/C++) with structure caching

3. **ETL-Optimized Features:**
   - `sql.file()` method for executing transformation SQL files
   - `sql.begin()` for proper transaction handling per entity type
   - Multiple statement support with simple queries
   - Direct JSON handling without CSV corruption

**Implementation Strategy:**

1. **Setup Temporary Database:**

   ```bash
   # Use Docker for consistency (Bun SQL is client, not server)
   docker run -d --name temp-migration-db \
     -e POSTGRES_PASSWORD=password \
     -p 5432:5432 postgres:16

   # Restore dump to temporary database
   pg_restore -h localhost -U postgres -d postgres \
     data/db-dumps/daily_supabase-backup-pg16-2025-08-25T23-00-00-820Z.dump
   ```

2. **Bun-Powered Transformation Layer:**
   - SQL transformation views executed via `sql.file()`
   - Direct database-to-database transfers using Bun SQL
   - Atomic transactions with proper rollback handling

3. **Benefits:**
   - Eliminates Node.js PostgreSQL dependency complexity
   - Performance benefits align with ETL workloads
   - You're already standardized on Bun for the project
   - Simpler connection management than juggling multiple clients
   - No data corruption from CSV encoding
   - Preserve data types and referential integrity

## Detailed Implementation Plan

### Phase 1: Database Setup and Analysis

1. **Setup Docker PostgreSQL and restore source data:**

   ```bash
   # Start Docker PostgreSQL
   docker run -d --name temp-migration-db \
     -e POSTGRES_PASSWORD=password \
     -p 5432:5432 postgres:16

   # Wait for startup, then restore dump
   sleep 10
   pg_restore -h localhost -U postgres -d postgres \
     data/db-dumps/daily_supabase-backup-pg16-2025-08-25T23-00-00-820Z.dump
   ```

2. **Schema analysis with Bun SQL:**

   ```typescript
   import { SQL } from 'bun';

   const sourceDb = new SQL({
   	dialect: 'postgres',
   	hostname: 'localhost',
   	database: 'postgres',
   	username: 'postgres',
   	password: 'password'
   });

   // Analyze source schema
   const schema = await sourceDb`
     SELECT table_name, column_name, data_type 
     FROM information_schema.columns 
     WHERE table_schema = 'public'
     ORDER BY table_name, ordinal_position
   `;
   ```

### Phase 2: Create Transformation Layer

**Example transformation view for organizations:**

```sql
CREATE VIEW organizations_transformed AS
SELECT
  -- Generate new ID using your nanoid function
  gen_random_uuid() as id,
  name,
  created_at::timestamptz,
  COALESCE(updated_at, created_at)::timestamptz as updated_at
FROM companies
WHERE active = 't';
```

**Example for leads with transformations (CORRECTED):**

```sql
CREATE VIEW leads_transformed AS
SELECT
  id, -- Preserve original UUID
  $target_org_id as organization_id, -- Map to newly created org
  NULLIF(trim(name), '') as name,
  NULLIF(trim(email), '') as email,
  NULLIF(trim(secondary_email), '') as secondary_email,
  NULLIF(trim(phone), '') as phone,
  NULLIF(trim(secondary_phone), '') as secondary_phone,
  NULLIF(trim(company), '') as company,
  NULLIF(trim(job_title), '') as job_title,
  COALESCE(import_method, 'unknown') as import_method,
  id::text as external_id, -- Use original UUID as external ID
  'legacy_migration' as external_source,
  -- Tags are already text[] format in source - no conversion needed
  COALESCE(tags, ARRAY[]::text[]) as tags,
  -- Fit score normalization
  UPPER(COALESCE(NULLIF(trim(fit_score), ''), 'F')) as fit_score,
  COALESCE(interest, 0) as interest,
  COALESCE(number_conversions, 0) as total_conversions,
  first_conversion_date::timestamptz as first_conversion_date,
  last_conversion_date::timestamptz as last_conversion_date,
  -- UTM field mappings (already correctly named in source)
  first_traffic_source_source as first_conversion_utm_source,
  first_traffic_source_medium as first_conversion_utm_medium,
  first_traffic_source_campaign as first_conversion_utm_campaign,
  first_traffic_source_content as first_conversion_utm_content,
  first_traffic_source_term as first_conversion_utm_term,
  last_traffic_source_source as last_conversion_utm_source,
  last_traffic_source_medium as last_conversion_utm_medium,
  last_traffic_source_campaign as last_conversion_utm_campaign,
  last_traffic_source_content as last_conversion_utm_content,
  last_traffic_source_term as last_conversion_utm_term,
  '' as notes, -- Not available in source
  created_at::timestamptz,
  now() as updated_at
FROM leads -- CORRECTED: source table is 'leads', not 'contacts'
WHERE company_id = $source_company_id
  AND (email IS NOT NULL AND trim(email) != '')
   OR (phone IS NOT NULL AND trim(phone) != '');
```

**Example for conversions with JSON handling (CORRECTED):**

```sql
CREATE VIEW conversions_transformed AS
SELECT
  id,
  $target_org_id as organization_id, -- Map to newly created org
  contact_id as lead_id, -- Maps to leads.id (preserved UUIDs)
  conversion_name as name,
  NULLIF(trim(conversion_identifier), '') as identifier,
  conversion_date::timestamptz as date,
  CASE
    WHEN conversion_value IS NOT NULL AND conversion_value != 0
    THEN conversion_value
    ELSE NULL
  END as value,
  NULLIF(trim(source), '') as source,
  NULLIF(trim(traffic_source_source), '') as utm_source,
  NULLIF(trim(traffic_source_medium), '') as utm_medium,
  NULLIF(trim(traffic_source_campaign), '') as utm_campaign,
  NULLIF(trim(traffic_source_content), '') as utm_content,
  NULLIF(trim(traffic_source_term), '') as utm_term,
  NULLIF(trim(traffic_source_channel), '') as utm_channel,
  NULLIF(trim(conversion_url), '') as conversion_url,
  NULLIF(trim(conversion_domain), '') as conversion_domain,
  NULLIF(trim(device), '') as device,
  -- Payload is already clean JSONB in source
  COALESCE(payload_raw_json, '{}'::jsonb) as raw_payload,
  '' as external_id, -- Not available in source
  'legacy_migration' as external_source,
  '' as idempotency_hash, -- Will be generated by trigger
  now() as created_at
FROM conversions
WHERE company_id = $source_company_id
  AND contact_id IS NOT NULL
  AND conversion_name IS NOT NULL AND trim(conversion_name) != '';
```

### Phase 3: Migration Execution

**Single transaction per entity type:**

```sql
BEGIN;
INSERT INTO organizations (id, name, created_at, updated_at)
SELECT * FROM organizations_transformed;
COMMIT;

BEGIN;
INSERT INTO leads (id, organization_id, name, email, ...)
SELECT * FROM leads_transformed;
COMMIT;

BEGIN;
INSERT INTO conversions (id, organization_id, lead_id, name, date, ...)
SELECT * FROM conversions_transformed;
COMMIT;
```

## Best Practices Implementation

### 1. **Data Validation Layer**

```sql
-- Pre-migration validation views (CORRECTED)
CREATE VIEW migration_validation AS
SELECT
  'leads_missing_contact' as issue,
  count(*) as count
FROM leads
WHERE company_id = $source_company_id
  AND (email IS NULL OR trim(email) = '')
  AND (phone IS NULL OR trim(phone) = '')
UNION ALL
SELECT
  'conversions_orphaned',
  count(*)
FROM conversions c
LEFT JOIN leads l ON c.contact_id = l.id
WHERE c.company_id = $source_company_id
  AND l.id IS NULL
UNION ALL
SELECT
  'conversions_missing_name',
  count(*)
FROM conversions
WHERE company_id = $source_company_id
  AND (conversion_name IS NULL OR trim(conversion_name) = '');
```

### 2. **Idempotent Migration Scripts**

```sql
-- Truncate and reload pattern for development
TRUNCATE TABLE conversions, leads, organizations CASCADE;
-- Then reload...
```

### 3. **Progress Tracking**

```sql
-- Migration progress table
CREATE TABLE migration_progress (
  entity_type text PRIMARY KEY,
  total_records int,
  migrated_records int,
  error_records int,
  last_run timestamptz DEFAULT now()
);
```

### 4. **Error Handling**

```sql
-- Capture migration errors
CREATE TABLE migration_errors (
  id serial PRIMARY KEY,
  entity_type text,
  source_id text,
  error_message text,
  raw_data jsonb,
  created_at timestamptz DEFAULT now()
);
```

## Recommended Tools and Libraries

1. **Database Connection:** Bun SQL (built-in, zero dependencies)
2. **Migration Framework:** Custom TypeScript scripts with Bun SQL
3. **Data Validation:** SQL-based validation with Bun SQL reporting
4. **Progress Monitoring:** Bun-native logging with status updates
5. **Container Management:** Docker for temporary PostgreSQL database

## Bun-Powered Migration Script Structure

```typescript
// migration-runner.ts
import { SQL } from 'bun';

class BunMigrationRunner {
	private sourceDb: SQL;
	private targetDb: SQL;

	constructor() {
		// Temporary Docker PostgreSQL database (from restored dump)
		this.sourceDb = new SQL({
			dialect: 'postgres',
			hostname: 'localhost',
			database: 'postgres',
			username: 'postgres',
			password: 'password'
		});

		// Target Supabase database
		this.targetDb = new SQL(process.env.DATABASE_URL!);
	}

	async runMigration() {
		try {
			console.log('🚀 Starting Bun-powered ETL migration...');

			// 1. Validate source data
			console.log('🔍 Validating source data...');
			await this.validateSourceData();

			// 2. Create transformation views using SQL files
			console.log('🏗️  Creating transformation views...');
			await this.sourceDb.file('./sql/transformation-views.sql');

			// 3. Migrate in dependency order with transactions
			console.log('📊 Migrating organizations...');
			await this.migrateWithTransaction('organizations');

			console.log('🏷️  Migrating custom fields...');
			await this.migrateWithTransaction('custom_field_definitions');

			console.log('👥 Migrating leads...');
			await this.migrateWithTransaction('leads');

			console.log('💰 Migrating conversions...');
			await this.migrateWithTransaction('conversions');

			console.log('🎯 Migrating segments...');
			await this.migrateWithTransaction('segments');

			// 4. Validate target data
			console.log('✅ Validating target data...');
			await this.validateTargetData();

			console.log('🎉 Migration completed successfully!');
		} catch (error) {
			console.error('❌ Migration failed:', error);
			throw error;
		}
	}

	private async validateSourceData() {
		const validationResults = await this.sourceDb`
      SELECT issue, count 
      FROM migration_validation 
      WHERE count > 0
    `;

		if (validationResults.length > 0) {
			console.warn('⚠️  Data validation issues found:');
			validationResults.forEach((row) => {
				console.warn(`  - ${row.issue}: ${row.count} records`);
			});
		}
	}

	private async migrateWithTransaction(entityType: string) {
		const transaction = await this.targetDb.begin();

		try {
			// Get transformed data from source views
			const transformedData = await this.sourceDb`
        SELECT * FROM ${entityType}_transformed
      `;

			console.log(`📦 Found ${transformedData.length} ${entityType} to migrate`);

			// Batch insert using Bun SQL's optimized bulk operations
			if (transformedData.length > 0) {
				await transaction`
          INSERT INTO ${entityType} ${transaction.values(transformedData)}
          ON CONFLICT (id) DO UPDATE SET
            updated_at = EXCLUDED.updated_at
        `;
			}

			await transaction.commit();
			console.log(`✅ Successfully migrated ${transformedData.length} ${entityType}`);
		} catch (error) {
			await transaction.rollback();
			console.error(`❌ Failed to migrate ${entityType}:`, error);
			throw error;
		}
	}

	private async validateTargetData() {
		const validation = await this.targetDb`
      SELECT 
        'organizations' as table_name,
        count(*) as record_count
      FROM organizations
      UNION ALL
      SELECT 'leads', count(*) FROM leads
      UNION ALL
      SELECT 'conversions', count(*) FROM conversions
    `;

		console.log('📊 Target database record counts:');
		validation.forEach((row) => {
			console.log(`  ${row.table_name}: ${row.record_count} records`);
		});

		// Check referential integrity
		const integrityCheck = await this.targetDb`
      SELECT 
        'orphaned_leads' as issue,
        count(*) as count
      FROM leads l
      LEFT JOIN organizations o ON l.organization_id = o.id
      WHERE o.id IS NULL
      UNION ALL
      SELECT 
        'orphaned_conversions',
        count(*)
      FROM conversions c
      LEFT JOIN leads l ON c.lead_id = l.id
      WHERE l.id IS NULL
    `;

		const issues = integrityCheck.filter((row) => row.count > 0);
		if (issues.length > 0) {
			console.error('❌ Data integrity issues found:');
			issues.forEach((issue) => {
				console.error(`  - ${issue.issue}: ${issue.count} records`);
			});
			throw new Error('Data integrity validation failed');
		}

		console.log('✅ Data integrity validation passed');
	}
}

// Usage
const migrator = new BunMigrationRunner();
await migrator.runMigration();
```

## Setup and Execution Commands

```bash
# 1. Start temporary PostgreSQL with Docker
docker run -d --name temp-migration-db \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 postgres:16

# 2. Wait for PostgreSQL to start and restore dump
sleep 10
pg_restore -h localhost -U postgres -d postgres \
  data/db-dumps/daily_supabase-backup-pg16-2025-08-25T23-00-00-820Z.dump

# 3. Run Bun-powered migration
bun run scripts/migration/run-migration.ts

# 4. Cleanup
docker stop temp-migration-db
docker rm temp-migration-db
```

## Selective Migration Architecture

### **Migration by Organization Strategy**

Each source `company_id` becomes a new organization with fresh nanoid:

- **Source**: `companies.id` (UUID)
- **Target**: `organizations.id` (nanoid)
- **Scope**: All related data migrated together

### **CLI Interface**

```bash
# Migrate specific company with all tables
bun run scripts/db/migration-v2/run-migration.ts \
  --source-company "4ee89595-e724-46a2-9585-e57be79581fb"

# Migrate specific company with selected tables only
bun run scripts/db/migration-v2/run-migration.ts \
  --source-company "4ee89595-e724-46a2-9585-e57be79581fb" \
  --tables "leads,conversions"

# Test with small dataset first
bun run scripts/db/migration-v2/run-migration.ts \
  --source-company "697c28f3-a401-4836-af93-891a2b98740d" \
  --tables "leads" \
  --dry-run
```

### **Migration Dependencies**

For each selected company, maintain this dependency order:

1. **organizations** (no dependencies) - Creates new org with nanoid
2. **leads_custom_fields_definitions** (depends on organizations)
3. **leads** (depends on organizations)
4. **conversions** (depends on organizations, leads)
5. **segments** (depends on organizations)

### **Available Source Companies** (from analysis):

- `4ee89595-e724-46a2-9585-e57be79581fb` (largest dataset)
- `697c28f3-a401-4836-af93-891a2b98740d`
- `355d17f4-c6b8-423b-af41-f5057a37e136`
- Plus 7 more (10 total companies)

## Rollback Strategy

1. **Development Environment:**
   - Use `TRUNCATE CASCADE` to clear all migrated data
   - Re-run migration from scratch

2. **Production Environment:**
   - Create backup before migration
   - Use transaction wrapping for each entity type
   - Manual rollback procedures documented

## Post-Migration Validation

```sql
-- Validate record counts
SELECT
  'organizations' as table_name,
  count(*) as record_count
FROM organizations
UNION ALL
SELECT 'leads', count(*) FROM leads
UNION ALL
SELECT 'conversions', count(*) FROM conversions;

-- Validate referential integrity
SELECT
  'orphaned_leads' as issue,
  count(*) as count
FROM leads l
LEFT JOIN organizations o ON l.organization_id = o.id
WHERE o.id IS NULL
UNION ALL
SELECT
  'orphaned_conversions',
  count(*)
FROM conversions c
LEFT JOIN leads l ON c.lead_id = l.id
WHERE l.id IS NULL;

-- Validate data quality
SELECT
  'leads_without_contact' as issue,
  count(*) as count
FROM leads
WHERE (email IS NULL OR trim(email) = '')
  AND (phone IS NULL OR trim(phone) = '');
```

## Key Advantages of Updated Migration Approach

### **Corrected Schema Mapping**

1. **Source Reality**: `leads` table (not `contacts`), already clean data structure
2. **Tags Handling**: Source `tags` are already `text[]` arrays - no JSON conversion needed
3. **JSON Payloads**: Source `payload_raw_json` is clean JSONB - no escaping issues
4. **Field Alignment**: Direct mapping between source and target schemas

### **Selective Migration Benefits**

1. **Organization Isolation**: Each company becomes separate organization with fresh nanoid
2. **Flexible Scope**: Choose specific companies and tables to migrate
3. **Incremental Testing**: Start small, scale up gradually
4. **Error Recovery**: Failed migrations don't affect other organizations
5. **Performance**: Smaller datasets, faster execution and validation

### **Bun SQL Technical Advantages**

1. **Zero Dependencies:** No need to install `pg`, `node-postgres`, or other database drivers
2. **Superior Performance:** Native code implementation with 50% speed improvement claims
3. **Built-in ETL Features:** `sql.file()`, transactions, bulk operations, connection pooling
4. **Project Consistency:** Leverages your existing Bun standardization
5. **Simplified Architecture:** Single runtime for both application and migration code

This updated approach addresses the actual source schema structure, implements selective migration capabilities, and leverages Bun's performance advantages while eliminating CSV corruption issues entirely.

## Next Steps

1. **Phase 1:** Set up Docker PostgreSQL and restore the dump
2. **Phase 2:** Create transformation SQL files based on existing migrator logic
3. **Phase 3:** Implement the Bun migration runner script
4. **Phase 4:** Test with a subset of data first
5. **Phase 5:** Execute full migration with validation

The migration can be run multiple times safely in development using the idempotent upsert patterns shown above.
