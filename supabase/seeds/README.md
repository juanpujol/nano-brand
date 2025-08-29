# Seed Data Organization

This directory contains organized seed data files that replace the monolithic `seed.sql` file.

## Files Structure

### Individual Seed Files (in execution order)

1. `01_auth_users.sql` - Authentication data (users, identities, sessions, etc.)
2. `02_organizations.sql` - Organization data
3. `03_profiles_memberships.sql` - User profiles and organization memberships
4. `04_dashboards.sql` - Dashboard configurations and favorites
5. `05_custom_fields.sql` - Custom field definitions and values
6. `06_leads.sql` - Lead data with realistic examples
7. `07_conversions.sql` - Conversion tracking data (large dataset)

### Runner Files

- `run_all_seeds.sql` - Master script that executes all files in order

## Usage

### Run all seeds at once:

```bash
psql -d your_database -f supabase/seeds/run_all_seeds.sql
```

### Run individual seed files:

```bash
psql -d your_database -f supabase/seeds/01_auth_users.sql
psql -d your_database -f supabase/seeds/02_organizations.sql
# ... etc
```

## Benefits of This Structure

1. **Maintainability**: Each file has a single responsibility
2. **Debugging**: Easier to identify issues in specific data domains
3. **Selective Loading**: Can run individual files for testing
4. **Code Reviews**: Much easier to review changes in smaller, focused files
5. **Performance**: Can parallelize loading of independent datasets
6. **Environment-Specific**: Can create different versions for dev/staging/prod

## Development Workflow

- For new features requiring seed data, modify only the relevant file(s)
- Test individual files during development
- The master runner ensures correct execution order for full database seeding

## Notes

- Dependencies are maintained through execution order
- All files assume the database schema is already applied via migrations
- The original `seed.sql` file is now deprecated in favor of this modular approach
