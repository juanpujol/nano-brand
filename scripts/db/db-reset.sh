bunx supabase db reset --debug \
  && psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/seeds/01_auth_users.sql