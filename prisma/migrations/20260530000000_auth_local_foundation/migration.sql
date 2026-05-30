CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  status text NOT NULL DEFAULT 'invited',
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  suspended_at timestamptz,
  deleted_at timestamptz,
  CONSTRAINT users_role_check CHECK (role IN ('viewer', 'editor', 'administrator', 'vault')),
  CONSTRAINT users_status_check CHECK (status IN ('invited', 'active', 'suspended', 'removed'))
);

CREATE TABLE IF NOT EXISTS auth.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  invalidated_at timestamptz,
  accepted_at timestamptz,
  invited_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT invitations_status_check CHECK (
    status IN ('pending', 'accepted', 'expired', 'invalidated')
  ),
  CONSTRAINT invitations_expiry_check CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS invitations_email_idx ON auth.invitations(email);
CREATE INDEX IF NOT EXISTS invitations_status_expires_at_idx
  ON auth.invitations(status, expires_at);

CREATE TABLE IF NOT EXISTS auth.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  CONSTRAINT sessions_expiry_check CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS sessions_user_id_expires_at_idx ON auth.sessions(user_id, expires_at);
