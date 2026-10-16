-- Local/development rollback only. Dropping the ledger makes the deploy-dev
-- migration gate fail until the table is recreated and backfilled.
drop table if exists public.raven_schema_migrations;
