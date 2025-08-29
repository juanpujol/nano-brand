# Database Migration V2 Scripts

This directory contains advanced database migration scripts for migrating data from the old database structure to the new Supabase-based schema.

## Scripts

### 1. `run-migration.ts` - Main Migration Script

The primary migration script that handles complete data migration from source companies to new organizations.

**Features:**

- Migrates organizations, leads, conversions, segments, and custom fields
- Validates data integrity before and after migration
- Supports dry-run mode for testing
- Handles large datasets efficiently with Bun

**Usage:**

```bash
# Full migration with custom fields
bun run scripts/db/migration/run-migration.ts \
  --source-company="4ee89595-e724-46a2-9585-e57be79581fb" \
  --custom-fields

# Test migration (dry run)
bun run scripts/db/migration/run-migration.ts \
  --source-company="697c28f3-a401-4836-af93-891a2b98740d" \
  --tables="leads,conversions" \
  --dry-run

# Get help
bun run scripts/db/migration/run-migration.ts --help
```

### 2. `create-memberships.ts` - Standalone Membership Management

A standalone script for creating or managing memberships for jp2@laiki.co on existing organizations.

**Use Cases:**

- Create memberships after manual migration
- Fix missing memberships on existing organizations
- Bulk membership creation across all organizations

**Usage:**

```bash
# Create memberships for all organizations
bun run scripts/db/migration/create-memberships.ts

# Create membership for specific organization
bun run scripts/db/migration/create-memberships.ts --org=abc123def456

# Preview without making changes
bun run scripts/db/migration/create-memberships.ts --dry-run

# Get help
bun run scripts/db/migration/create-memberships.ts --help
```

**Features:**

- Validates user existence before creating memberships
- Checks for existing memberships to avoid duplicates
- Provides detailed summary of operations
- Supports dry-run mode
- Can target specific organizations or process all

## User Information

Both scripts work with the seeded user:

- **Email:** jp2@laiki.co
- **UUID:** 5ea389fd-b35d-4a40-803a-b2b009e80b99
- **Role:** admin (for all created memberships)

This user is automatically created when running `bun db:reset` through the seed scripts.

## Environment Requirements

- `DATABASE_URL` environment variable must be set
- Supabase database must be accessible
- Source database connection details in script constants
- User jp2@laiki.co must exist in the profiles table

## Workflow

1. **Run Migration:** Use `run-migration.ts` to migrate data from source company
2. **Create Membership:** Use `create-memberships.ts` to manually create jp2@laiki.co membership on the new organization

## Error Handling

- Both scripts include comprehensive error handling
- Membership script provides detailed error reporting
- All operations are logged with colored output for easy debugging
