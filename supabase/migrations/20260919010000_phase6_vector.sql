-- Phase 6: pgvector for on-device embeddings. Runs BEFORE the generated column migration.
create extension if not exists vector with schema extensions;
