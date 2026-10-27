/**
 * PostgreSQL / Supabase Migration Blueprint (Section 17)
 * Reflects the active voting rule: 1 free vote per verified account per edition + optional paid packs (100 XAF)
 * Separates public and private voter PII, enforces RLS, and provides atomic vote transactions.
 */

export const SUPABASE_SQL_MIGRATION = `-- ============================================================================
-- MIGRATION SQL : PLATEFORME DE PRÉSENTATION ET DE VOTE (20ᵉ ÉDITION)
-- Nom de travail : Éclat Cameroun / Miss Beauté Cameroun
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Table des éditions du concours
CREATE TABLE IF NOT EXISTS public.contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_number INTEGER NOT NULL UNIQUE,
  contest_name TEXT NOT NULL DEFAULT 'Miss Beauté Cameroun',
  is_provisional_name BOOLEAN NOT NULL DEFAULT true,
  edition_label TEXT NOT NULL DEFAULT '20ᵉ Édition',
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'voting_open', 'voting_closed', 'results_under_review', 'results_published', 'archived')),
  voting_opens_at TIMESTAMPTZ,
  voting_closes_at TIMESTAMPTZ,
  public_leaderboard_enabled BOOLEAN NOT NULL DEFAULT true,
  paid_voting_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Règles du scrutin par édition
CREATE TABLE IF NOT EXISTS public.contest_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  voting_mode TEXT NOT NULL DEFAULT 'free_verified_account',
  vote_limit_mode TEXT NOT NULL DEFAULT 'one_free_then_paid_100xaf',
  free_votes_per_account INTEGER NOT NULL DEFAULT 1,
  paid_vote_price_xaf INTEGER NOT NULL DEFAULT 100,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table des candidates (Données publiques uniquement)
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  candidate_number INTEGER NOT NULL,
  public_name TEXT NOT NULL,
  role_fr TEXT NOT NULL,
  role_en TEXT NOT NULL,
  fictional_age INTEGER,
  region TEXT NOT NULL,
  city TEXT,
  bio_fr TEXT NOT NULL,
  bio_en TEXT NOT NULL,
  cause_fr TEXT NOT NULL,
  cause_en TEXT NOT NULL,
  motto_fr TEXT NOT NULL,
  motto_en TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  focal_point TEXT NOT NULL DEFAULT 'center 18%',
  status TEXT NOT NULL DEFAULT 'eligible' CHECK (status IN ('eligible', 'withdrawn', 'suspended')),
  is_demo_data BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(contest_id, candidate_number)
);

-- 4. Profils votants (Isolés par RLS — Aucune exposition publique des e-mails)
CREATE TABLE IF NOT EXISTS public.voter_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Table des votes (Contrôlée par transaction serveur et clé d'idempotence)
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.contests(id),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id),
  voter_id UUID NOT NULL REFERENCES public.voter_profiles(id),
  vote_type TEXT NOT NULL CHECK (vote_type IN ('free_verified', 'paid_pack')),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  amount_xaf INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'invalidated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contrainte unique pour garantir 1 seul vote gratuit valide par compte et par édition
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_free_vote_per_voter_edition
  ON public.votes (contest_id, voter_id)
  WHERE vote_type = 'free_verified' AND status = 'valid';

-- 6. Table des invalidations de votes (Traçabilité obligatoire, aucune suppression silencieuse)
CREATE TABLE IF NOT EXISTS public.vote_invalidations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL REFERENCES public.votes(id),
  admin_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(reason) >= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Rôles d'administration & Journal d'audit
CREATE TABLE IF NOT EXISTS public.admin_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'candidate_manager', 'moderator', 'report_viewer')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Row Level Security (RLS)
ALTER TABLE public.voter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voter reads own profile only" ON public.voter_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Voter reads own vote history only" ON public.votes
  FOR SELECT USING (auth.uid() = voter_id);
`;
