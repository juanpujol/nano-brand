# Seeding Supabase Users for OTP/Magic Link Authentication

## Problem Statement

When using Supabase with magic link authentication (`signInWithOtp`), it's challenging to seed test users that work properly with the authentication flow. Standard seeding approaches that work for password-based authentication fail with magic link authentication, causing errors like:

```
AuthApiError: Database error finding user
```

This happens because magic link authentication has complex state requirements across multiple auth tables that must be perfectly synchronized.

## Initial Attempts and Failures

### Attempt 1: Basic Password User Seeding

**What we tried:** Standard auth.users insertion with encrypted password

```sql
INSERT INTO auth.users (email, encrypted_password, ...)
```

**Why it failed:** Magic link authentication doesn't use passwords and has different validation paths

### Attempt 2: Fixing raw_user_meta_data Structure

**What we tried:** Matching the metadata structure of working users

```json
{
	"sub": "uuid",
	"email": "user@example.com",
	"display_name": "Name",
	"email_verified": true,
	"phone_verified": false
}
```

**Why it failed:** Metadata structure was necessary but not sufficient - missing auth flow state

### Attempt 3: Adding Magic Link Flow State

**What we tried:** Adding `recovery_sent_at`, `last_sign_in_at`, and auth.identities records

```sql
INSERT INTO auth.users (..., recovery_sent_at, last_sign_in_at, ...)
INSERT INTO auth.identities (...)
```

**Why it failed:** Still missing critical auth flow state and session data

### Attempt 4: Complete Auth State Simulation

**What we tried:** Adding auth.flow_state and auth.refresh_tokens

```sql
INSERT INTO auth.flow_state (...)
INSERT INTO auth.refresh_tokens (...)
```

**Why it failed:** Actually broke even normal user creation through the app - something was corrupted

## Root Cause Analysis

The fundamental issue is that magic link authentication involves a complex multi-table auth flow:

1. **auth.users** - Basic user record with specific timestamps
2. **auth.identities** - Identity data with exact structure requirements
3. **auth.sessions** - Active session records
4. **auth.refresh_tokens** - Refresh tokens linked to sessions
5. **auth.flow_state** - Magic link flow state with challenge codes
6. **profiles** - User profile data (via trigger)

Each table has interdependencies and exact field requirements that must match what Supabase's auth system expects.

## The Working Solution: Exact User Cloning

### Step 1: Create a Working User Through the App

Create a test user through your app's normal magic link flow:

1. Use your app to sign up with `testuser@example.com`
2. Complete the magic link authentication
3. Verify the user works for subsequent logins

### Step 2: Extract Complete User Data

Query ALL auth tables to get the exact user data:

```sql
-- Get complete auth.users record
SELECT * FROM auth.users WHERE email = 'testuser@example.com';

-- Get auth.identities record
SELECT i.* FROM auth.identities i
JOIN auth.users u ON i.user_id = u.id
WHERE u.email = 'testuser@example.com';

-- Get auth.sessions records
SELECT s.* FROM auth.sessions s
JOIN auth.users u ON s.user_id = u.id
WHERE u.email = 'testuser@example.com';

-- Get auth.refresh_tokens records
SELECT r.* FROM auth.refresh_tokens r
JOIN auth.users u ON r.user_id::text = u.id::text
WHERE u.email = 'testuser@example.com';

-- Get auth.flow_state record
SELECT f.* FROM auth.flow_state f
JOIN auth.users u ON f.user_id = u.id
WHERE u.email = 'testuser@example.com';

-- Get profiles record
SELECT * FROM profiles WHERE email = 'testuser@example.com';
```

### Step 3: Create Exact INSERT Statements

Convert the extracted data into exact INSERT statements preserving:

- All UUIDs exactly as they are
- All timestamps exactly as they are
- All tokens and session data exactly as they are
- All JSONB structures exactly as they are

**Critical:** Do NOT modify any values - copy everything exactly.

### Step 4: Handle Computed Columns

Remove computed columns like `confirmed_at` that don't accept explicit values:

```sql
-- Remove confirmed_at from the column list
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, recovery_sent_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  -- confirmed_at, -- REMOVE THIS - it's computed
  email_change_confirm_status, is_sso_user, is_anonymous
) VALUES (...);
```

## Final Working Seed File Structure

```sql
-- Seed data for development
-- Exact copy of working user created through the app

-- Insert exact copy of auth.users record
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  email_change_confirm_status, is_sso_user, is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '5ea389fd-b35d-4a40-803a-b2b009e80b99'::uuid,
  'authenticated', 'authenticated', 'jp2@laiki.co',
  '$2a$10$5eC17oE3IZL2.Ga7zcJF7.z7G90JYNsiL5ooEx7ly/SWvL3vkpu/S',
  '2025-08-24 15:13:25.912733+00'::timestamptz,
  '2025-08-24 15:13:25.926543+00'::timestamptz,
  '2025-08-24 15:13:36.423912+00'::timestamptz,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"sub": "5ea389fd-b35d-4a40-803a-b2b009e80b99", "email": "jp2@laiki.co", "display_name": "Jp2", "email_verified": true, "phone_verified": false}'::jsonb,
  '2025-08-24 15:13:25.902773+00'::timestamptz,
  '2025-08-24 15:13:36.43538+00'::timestamptz,
  0, false, false
);

-- Insert exact copy of auth.identities record
INSERT INTO auth.identities (...) VALUES (...);

-- Insert exact copy of auth.sessions records
INSERT INTO auth.sessions (...) VALUES (...);

-- Insert exact copy of auth.refresh_tokens records
INSERT INTO auth.refresh_tokens (...) VALUES (...);

-- Insert exact copy of auth.flow_state record
INSERT INTO auth.flow_state (...) VALUES (...);

-- Insert exact copy of profiles record
INSERT INTO profiles (...) VALUES (...) ON CONFLICT (id) DO NOTHING;
```

## Key Insights

### Why This Works

1. **Perfect State Replication**: The seeded user has identical state to a real user
2. **Complete Auth Flow**: All required tables have correct interdependent data
3. **Exact Field Matching**: No guesswork about what Supabase expects
4. **Session Continuity**: Active sessions and tokens are preserved

### Why Other Approaches Failed

1. **Incomplete State**: Missing critical auth flow tables
2. **Field Mismatches**z: Small differences in metadata structure break validation
3. **Timestamp Issues**: Auth flow expects specific timing relationships
4. **Token Mismatches**: Session/token relationships must be exact

## Usage Instructions

1. Create a working test user through your app
2. Extract all auth data using the queries above
3. Create exact INSERT statements preserving all values
4. Remove computed columns from INSERT statements
5. Test with `supabase db reset`

## Important Notes

- **Never modify UUIDs, tokens, or timestamps** when creating the seed
- **Always use the exact same email** as the source user
- **Include all auth tables** - missing any table breaks the flow
- **Handle computed columns** by excluding them from INSERT statements
- **Test thoroughly** after each reset to ensure the user works

This approach guarantees a working seeded user because it's an exact replica of a user that already works in your system.
