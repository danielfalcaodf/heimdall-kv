-- Org schema: clientes, setores e projetos
CREATE SCHEMA IF NOT EXISTS "org";

CREATE TABLE org.clients (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  status      text        NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  deleted_at  timestamptz
);

CREATE TABLE org.sectors (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid        NOT NULL REFERENCES org.clients(id) ON DELETE RESTRICT,
  name        text        NOT NULL,
  status      text        NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  deleted_at  timestamptz
);

CREATE INDEX ON org.sectors (client_id);

CREATE TABLE org.projects (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid        NOT NULL REFERENCES org.clients(id) ON DELETE RESTRICT,
  sector_id   uuid        REFERENCES org.sectors(id) ON DELETE SET NULL,
  name        text        NOT NULL,
  status      text        NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  deleted_at  timestamptz
);

CREATE INDEX ON org.projects (client_id);
CREATE INDEX ON org.projects (sector_id);
