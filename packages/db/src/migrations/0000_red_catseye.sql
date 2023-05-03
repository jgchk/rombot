CREATE TABLE IF NOT EXISTS "discord-accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"discord_id" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "discord_id_idx" ON "discord-accounts" ("discord_id");