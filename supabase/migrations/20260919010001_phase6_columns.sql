ALTER TABLE "posts" ADD COLUMN "embedding" vector(384);--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "triage" jsonb;--> statement-breakpoint
CREATE INDEX "posts_embedding_idx" ON "posts" USING hnsw ("embedding" vector_cosine_ops);