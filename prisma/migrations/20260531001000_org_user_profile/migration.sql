-- Org schema: perfis e vínculos de usuários
CREATE TABLE org.user_profiles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text        NOT NULL DEFAULT 'viewer',
  status      text        NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  suspended_at timestamptz,
  removed_at  timestamptz
);

CREATE UNIQUE INDEX ON org.user_profiles (user_id);

CREATE TABLE org.user_bindings (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id      uuid        REFERENCES org.projects(id) ON DELETE CASCADE,
  sector_id       uuid        REFERENCES org.sectors(id) ON DELETE CASCADE,
  client_id       uuid        REFERENCES org.clients(id) ON DELETE CASCADE,
  role            text        NOT NULL DEFAULT 'viewer',
  has_vault_access boolean   NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  revoked_at      timestamptz
);

CREATE INDEX ON org.user_bindings (user_id);
CREATE INDEX ON org.user_bindings (project_id);
