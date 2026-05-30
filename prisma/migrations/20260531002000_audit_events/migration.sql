CREATE SCHEMA IF NOT EXISTS "audit";

CREATE TABLE "audit"."audit_events" (
  "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
  "actor_user_id" UUID        NOT NULL,
  "action"        TEXT        NOT NULL,
  "resource_type" TEXT        NOT NULL,
  "resource_id"   UUID,
  "scope_type"    TEXT,
  "scope_id"      UUID,
  "result"        TEXT        NOT NULL DEFAULT 'success',
  "ip_address"    TEXT,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_events_actor_user_id_idx" ON "audit"."audit_events" ("actor_user_id");
CREATE INDEX "audit_events_created_at_idx" ON "audit"."audit_events" ("created_at");
