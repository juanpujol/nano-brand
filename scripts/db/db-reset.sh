bunx supabase db reset --debug \
  && psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/seeds/01_auth_users.sql \
  && bun run ./scripts/db/migration/run-migration.ts --source-company="7f1b3228-ce3b-4dfe-8608-38a2879091b4" \
  && bun run ./scripts/db/migration/create-memberships.ts