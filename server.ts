import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import {
  DEFAULT_CENTRAL_CONFIG,
  CentralConfig,
  EditionStatus,
} from './src/config/centralConfig.ts';
import {
  INITIAL_CANDIDATES,
  INITIAL_NEWS,
  Candidate,
  NewsArticle,
  VoteRecord,
  AuditLogEntry,
  AdminRole,
} from './src/data/initialData.ts';
import {
  isSanityConfigured,
  syncInitialDataToSanity,
  loadStateFromSanity,
  upsertSanityDoc,
} from './src/db/sanityBackend.ts';

interface ServerUserRecord {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  emailVerified: boolean;
  verificationCode: string;
  role: 'voter' | AdminRole;
  createdAt: string;
}

// ============================================================================
// SERVER-AUTHORITATIVE STATE (Synchronized with Sanity Project 79m8ign4)
// ============================================================================

let serverConfig: CentralConfig = {
  ...DEFAULT_CENTRAL_CONFIG,
  demoMode: !isSanityConfigured,
};
let candidatesStore: Candidate[] = INITIAL_CANDIDATES.map((c) => ({ ...c }));
let newsStore: NewsArticle[] = INITIAL_NEWS.map((n) => ({ ...n }));
let votesStore: VoteRecord[] = [];
let auditLogsStore: AuditLogEntry[] = [
  {
    id: 'audit-init-1',
    timestamp: new Date().toISOString(),
    actorId: 'system',
    actorRole: 'super_admin',
    action: 'INIT_EDITION_20',
    targetType: 'contest',
    targetId: 'ed-20',
    reason: 'Initialisation de la 20ᵉ Édition (27/10/2026 - 01/12/2026)',
    details: 'Règle active : 1er vote gratuit (compte vérifié), 100 XAF dès le 2ᵉ vote (paiement désactivé par défaut).',
  },
];

async function bootstrapSanityDatabase() {
  if (!isSanityConfigured) return;
  try {
    const existing = await loadStateFromSanity();
    if (existing?.candidates && existing.candidates.length >= 6) {
      candidatesStore = existing.candidates;
      if (existing.config) {
        serverConfig = {
          ...DEFAULT_CENTRAL_CONFIG,
          ...existing.config,
          demoMode: false,
        };
      }
      if (existing.news && existing.news.length > 0) {
        newsStore = existing.news;
      }
      if (existing.votes) {
        votesStore = existing.votes;
      }
      if (existing.auditLogs && existing.auditLogs.length > 0) {
        auditLogsStore = existing.auditLogs;
      }
      console.log('Loaded existing contest data from Sanity Content Lake (79m8ign4).');
    } else {
      const syncRes = await syncInitialDataToSanity(
        { ...serverConfig, demoMode: false },
        candidatesStore,
        newsStore,
        auditLogsStore
      );
      if (syncRes.ok) {
        serverConfig.demoMode = false;
        console.log(`Synced ${syncRes.syncedCount} initial documents to Sanity Content Lake (79m8ign4).`);
      }
    }
  } catch (err) {
    console.error('Sanity bootstrap warning:', err);
  }
}

function hashPassword(raw: string): string {
  return crypto.createHash('sha256').update(raw + '_eclat_salt_2026').digest('hex');
}

const usersByEmail = new Map<string, ServerUserRecord>();
const sessionsByToken = new Map<string, string>(); // token -> userId
const idempotencyResponses = new Map<string, { status: number; body: any }>();
const activeVoterLocks = new Set<string>();
const rateLimitCounters = new Map<string, { count: number; resetAt: number }>();

// Seed verified test accounts & RBAC administrators (No public admin registration allowed)
const seededAccounts: ServerUserRecord[] = [
  {
    id: 'usr-admin-super',
    email: 'admin@eclat-cameroun.org',
    fullName: 'Direction Générale du Concours',
    passwordHash: hashPassword('Admin2026!'),
    emailVerified: true,
    verificationCode: '000000',
    role: 'super_admin',
    createdAt: '2026-10-27T00:00:00Z',
  },
  {
    id: 'usr-admin-manager',
    email: 'candidates@eclat-cameroun.org',
    fullName: 'Gestionnaire des Candidates',
    passwordHash: hashPassword('Manager2026!'),
    emailVerified: true,
    verificationCode: '000000',
    role: 'candidate_manager',
    createdAt: '2026-10-27T00:00:00Z',
  },
  {
    id: 'usr-admin-moderator',
    email: 'moderateur@eclat-cameroun.org',
    fullName: 'Auditeur & Modérateur Scrutin',
    passwordHash: hashPassword('Mod2026!'),
    emailVerified: true,
    verificationCode: '000000',
    role: 'moderator',
    createdAt: '2026-10-27T00:00:00Z',
  },
  {
    id: 'usr-voter-verified',
    email: 'votant@exemple.cm',
    fullName: 'Amina Ndongo (Votante Vérifiée)',
    passwordHash: hashPassword('Vote2026!'),
    emailVerified: true,
    verificationCode: '123456',
    role: 'voter',
    createdAt: '2026-10-27T01:00:00Z',
  },
];

for (const acc of seededAccounts) {
  usersByEmail.set(acc.email.toLowerCase(), acc);
}

// Recompute candidate valid vote totals strictly from server-side valid votes
function recomputeValidVoteTotals(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of candidatesStore) {
    counts.set(c.id, 0);
  }
  const validVotes = votesStore.filter((v) => v.status === 'valid');
  if (validVotes.length > 0) {
    for (const v of validVotes) {
      counts.set(v.candidateId, (counts.get(v.candidateId) || 0) + v.quantity);
    }
  } else {
    for (const c of candidatesStore) {
      const initCand = INITIAL_CANDIDATES.find((ic) => ic.id === c.id);
      counts.set(c.id, c.publicVotesCount || initCand?.publicVotesCount || 0);
    }
  }
  return counts;
}

function computeLeaderCandidateId(totals: Map<string, number>): string | null {
  let maxVotes = 0;
  for (const c of candidatesStore) {
    if (c.status !== 'eligible') continue;
    const v = totals.get(c.id) || 0;
    if (v > maxVotes) maxVotes = v;
  }
  if (maxVotes <= 0) return null;
  const leaders = candidatesStore.filter(
    (c) => c.status === 'eligible' && (totals.get(c.id) || 0) === maxVotes
  );
  return leaders.length === 1 ? leaders[0].id : null;
}

function isVotingCurrentlyOpen(): { open: boolean; code: string; messageFr: string; messageEn: string } {
  if (serverConfig.editionStatus !== 'voting_open') {
    const code =
      serverConfig.editionStatus === 'voting_closed' ||
      serverConfig.editionStatus === 'results_under_review' ||
      serverConfig.editionStatus === 'results_published'
        ? 'VOTING_CLOSED'
        : 'VOTING_NOT_OPEN';
    return {
      open: false,
      code,
      messageFr:
        code === 'VOTING_CLOSED'
          ? 'Le scrutin de cette édition est officiellement clôturé.'
          : "Le scrutin n'est pas encore ouvert au public.",
      messageEn:
        code === 'VOTING_CLOSED'
          ? 'Voting for this edition is officially closed.'
          : 'Voting is not yet open to the public.',
    };
  }

  const nowMs = Date.now();
  if (serverConfig.votingOpensAt) {
    const opensMs = new Date(serverConfig.votingOpensAt).getTime();
    if (nowMs < opensMs) {
      return {
        open: false,
        code: 'VOTING_NOT_OPEN',
        messageFr: "La date d'ouverture du scrutin n'est pas encore atteinte (Horloge serveur).",
        messageEn: 'The voting opening time has not yet been reached (Server clock).',
      };
    }
  }
  if (serverConfig.votingClosesAt) {
    const closesMs = new Date(serverConfig.votingClosesAt).getTime();
    if (nowMs > closesMs) {
      return {
        open: false,
        code: 'VOTING_CLOSED',
        messageFr: 'La date de clôture du scrutin (01/12/2026) est dépassée.',
        messageEn: 'The voting closing deadline (01/12/2026) has passed.',
      };
    }
  }

  return {
    open: true,
    code: 'VOTING_OPEN',
    messageFr: 'Scrutin ouvert',
    messageEn: 'Voting open',
  };
}

function getAuthenticatedUser(req: Request): ServerUserRecord | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const userId = sessionsByToken.get(token);
  if (!userId) return null;
  for (const u of usersByEmail.values()) {
    if (u.id === userId) return u;
  }
  return null;
}

function buildUserClientPayload(user: ServerUserRecord) {
  const validFreeVote = votesStore.find(
    (v) =>
      v.voterId === user.id &&
      v.contestEdition === serverConfig.editionNumber &&
      v.voteType === 'free_verified' &&
      v.status === 'valid'
  );
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    emailVerified: user.emailVerified,
    verificationCode: !user.emailVerified ? user.verificationCode : undefined,
    role: user.role,
    createdAt: user.createdAt,
    freeVoteUsedInEdition: Boolean(validFreeVote),
    votedCandidateId: validFreeVote ? validFreeVote.candidateId : null,
  };
}

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitCounters.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitCounters.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

async function startServer() {
  await bootstrapSanityDatabase();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // --------------------------------------------------------------------------
  // 1. PUBLIC CONFIGURATION & SERVER CLOCK
  // --------------------------------------------------------------------------
  app.get('/api/config', (_req, res) => {
    const votingState = isVotingCurrentlyOpen();
    res.json({
      config: serverConfig,
      serverTimeIso: new Date().toISOString(),
      votingState,
      sanityConnected: isSanityConfigured,
    });
  });

  // --------------------------------------------------------------------------
  // 2. PUBLIC CANDIDATES CATALOGUE (Search, Filters, Pagination, Hide Votes if Leaderboard Disabled)
  // --------------------------------------------------------------------------
  app.get('/api/candidates', (req, res) => {
    const q = String(req.query.q || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const region = String(req.query.region || '').trim();
    const statusFilter = String(req.query.status || '').trim();
    const sort = String(req.query.sort || 'number').trim();
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const pageSize = Math.min(24, Math.max(1, parseInt(String(req.query.pageSize || '12'), 10) || 12));

    const validTotals = recomputeValidVoteTotals();
    const showPublicVotes =
      serverConfig.publicLeaderboardEnabled && serverConfig.leaderboardMode !== 'hidden_during_voting';

    let list = candidatesStore.map((c) => ({
      ...c,
      publicVotesCount: showPublicVotes ? validTotals.get(c.id) || 0 : 0,
    }));

    if (q) {
      list = list.filter((c) => {
        const haystack = `${c.name} ${c.number} numero ${c.number} n°${c.number} ${c.region} ${c.city} ${c.roleFr} ${c.roleEn}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return haystack.includes(q);
      });
    }

    if (region && region !== 'all') {
      list = list.filter((c) => c.region.toLowerCase() === region.toLowerCase());
    }

    if (statusFilter && statusFilter !== 'all') {
      list = list.filter((c) => c.status === statusFilter);
    }

    list.sort((a, b) => {
      if (sort === 'name') {
        return a.name.localeCompare(b.name, 'fr');
      }
      if (sort === 'votes' && showPublicVotes) {
        if (b.publicVotesCount !== a.publicVotesCount) {
          return b.publicVotesCount - a.publicVotesCount;
        }
      }
      return a.number - b.number;
    });

    const totalCount = list.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startIndex = (page - 1) * pageSize;
    const paginated = list.slice(startIndex, startIndex + pageSize);

    const regions = Array.from(new Set(candidatesStore.map((c) => c.region))).sort();
    const leaderCandidateId = showPublicVotes ? computeLeaderCandidateId(validTotals) : null;

    res.json({
      candidates: paginated,
      leaderCandidateId,
      totalCount,
      page,
      pageSize,
      totalPages,
      regions,
      showPublicVotes,
      serverTimeIso: new Date().toISOString(),
    });
  });

  app.get('/api/candidates/:slug', (req, res) => {
    const { slug } = req.params;
    const candidate = candidatesStore.find((c) => c.slug === slug || c.id === slug);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate introuvable / Candidate not found' });
    }
    const validTotals = recomputeValidVoteTotals();
    const showPublicVotes =
      serverConfig.publicLeaderboardEnabled && serverConfig.leaderboardMode !== 'hidden_during_voting';
    const leaderCandidateId = showPublicVotes ? computeLeaderCandidateId(validTotals) : null;

    res.json({
      candidate: {
        ...candidate,
        publicVotesCount: showPublicVotes ? validTotals.get(candidate.id) || 0 : 0,
      },
      leaderCandidateId,
      showPublicVotes,
      votingState: isVotingCurrentlyOpen(),
      serverTimeIso: new Date().toISOString(),
    });
  });

  // --------------------------------------------------------------------------
  // 3. PUBLIC LEADERBOARD (Strict privacy & tie-handling)
  // --------------------------------------------------------------------------
  app.get('/api/leaderboard', (_req, res) => {
    const showPublicVotes =
      serverConfig.publicLeaderboardEnabled && serverConfig.leaderboardMode !== 'hidden_during_voting';

    if (!showPublicVotes) {
      return res.json({
        enabled: false,
        mode: serverConfig.leaderboardMode,
        serverTimeIso: new Date().toISOString(),
        entries: [],
        totalValidVotes: null,
      });
    }

    const validTotals = recomputeValidVoteTotals();
    const eligible = candidatesStore
      .filter((c) => c.status === 'eligible')
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        number: c.number,
        name: c.name,
        region: c.region,
        city: c.city,
        roleFr: c.roleFr,
        roleEn: c.roleEn,
        photoUrl: c.photoUrl,
        focalPoint: c.focalPoint,
        votes: validTotals.get(c.id) || 0,
      }))
      .sort((a, b) => {
        if (b.votes !== a.votes) return b.votes - a.votes;
        return a.number - b.number;
      });

    let currentRank = 1;
    let hasTies = false;
    const rankedEntries = eligible.map((item, idx) => {
      if (idx > 0) {
        if (item.votes === eligible[idx - 1].votes) {
          hasTies = true;
        } else {
          currentRank = idx + 1;
        }
      }
      return {
        ...item,
        rank: currentRank,
        isTied:
          (idx > 0 && item.votes === eligible[idx - 1].votes) ||
          (idx < eligible.length - 1 && item.votes === eligible[idx + 1].votes),
      };
    });

    const totalValidVotes = eligible.reduce((acc, cur) => acc + cur.votes, 0);

    res.json({
      enabled: true,
      mode: serverConfig.leaderboardMode,
      isOfficial: serverConfig.editionStatus === 'results_published',
      isDemoData: serverConfig.demoMode,
      hasTies,
      totalValidVotes,
      serverTimeIso: new Date().toISOString(),
      entries: rankedEntries,
    });
  });

  // --------------------------------------------------------------------------
  // 4. NEWS ARTICLES
  // --------------------------------------------------------------------------
  app.get('/api/news', (_req, res) => {
    const sorted = [...newsStore].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    res.json({ articles: sorted });
  });

  app.get('/api/news/:slug', (req, res) => {
    const article = newsStore.find((n) => n.slug === req.params.slug || n.id === req.params.slug);
    if (!article) {
      return res.status(404).json({ error: 'Article introuvable' });
    }
    res.json({ article });
  });

  // --------------------------------------------------------------------------
  // 5. AUTHENTICATION & EMAIL VERIFICATION
  // --------------------------------------------------------------------------
  app.post('/api/auth/register', (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const fullName = String(req.body.fullName || '').trim();
    const password = String(req.body.password || '');

    if (!email || !email.includes('@') || fullName.length < 2 || password.length < 6) {
      return res.status(400).json({
        error: 'Veuillez renseigner un nom valide, une adresse e-mail valide et un mot de passe (6 caractères min).',
      });
    }

    if (usersByEmail.has(email)) {
      return res.status(409).json({
        error: 'Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.',
      });
    }

    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const newUser: ServerUserRecord = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      email,
      fullName,
      passwordHash: hashPassword(password),
      emailVerified: false,
      verificationCode,
      role: 'voter',
      createdAt: new Date().toISOString(),
    };

    usersByEmail.set(email, newUser);
    const token = crypto.randomBytes(24).toString('hex');
    sessionsByToken.set(token, newUser.id);

    // Persist anonymized voter profile in Sanity (without exposing PII publicly)
    upsertSanityDoc(`voterProfile-${newUser.id}`, 'voterProfile', {
      id: newUser.id,
      emailVerified: false,
      createdAt: newUser.createdAt,
    });

    res.status(201).json({
      token,
      user: buildUserClientPayload(newUser),
      verificationCodePreview: verificationCode,
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const user = usersByEmail.get(email);
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({
        error: 'Identifiants incorrects. Vérifiez votre adresse e-mail et votre mot de passe.',
      });
    }

    const token = crypto.randomBytes(24).toString('hex');
    sessionsByToken.set(token, user.id);

    res.json({
      token,
      user: buildUserClientPayload(user),
    });
  });

  app.post('/api/auth/verify-email', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }
    const code = String(req.body.code || '').trim();
    if (user.emailVerified) {
      return res.json({ user: buildUserClientPayload(user), message: 'Compte déjà vérifié.' });
    }
    if (code !== user.verificationCode) {
      return res.status(400).json({ error: 'Code de vérification invalide.' });
    }
    user.emailVerified = true;

    upsertSanityDoc(`voterProfile-${user.id}`, 'voterProfile', {
      id: user.id,
      emailVerified: true,
      createdAt: user.createdAt,
    });

    res.json({
      user: buildUserClientPayload(user),
      message: 'Adresse e-mail vérifiée avec succès.',
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      sessionsByToken.delete(token);
    }
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Non connecté' });
    }
    const myVotes = votesStore
      .filter((v) => v.voterId === user.id)
      .map((v) => ({
        id: v.id,
        contestEdition: v.contestEdition,
        candidateId: v.candidateId,
        candidateNumber: v.candidateNumber,
        candidateName: v.candidateName,
        voteType: v.voteType,
        quantity: v.quantity,
        amountXaf: v.amountXaf,
        status: v.status,
        invalidationReason: v.invalidationReason,
        createdAt: v.createdAt,
        idempotencyKey: v.idempotencyKey,
      }));

    res.json({
      user: buildUserClientPayload(user),
      votesHistory: myVotes,
    });
  });

  // --------------------------------------------------------------------------
  // 6. ATOMIC VOTE RECORDING WITH IDEMPOTENCY & SANITY PERSISTENCE
  // --------------------------------------------------------------------------
  app.post('/api/votes', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({
        code: 'AUTH_REQUIRED',
        error: 'Vous devez être connecté pour enregistrer un vote.',
      });
    }

    const idempotencyKey = String(req.body.idempotencyKey || '').trim();
    if (!idempotencyKey || idempotencyKey.length < 8) {
      return res.status(400).json({
        code: 'MISSING_IDEMPOTENCY_KEY',
        error: "Clé d'idempotence requise pour sécuriser la transaction.",
      });
    }

    // 1. Check Idempotency Cache First
    const cachedKey = `${user.id}:${idempotencyKey}`;
    if (idempotencyResponses.has(cachedKey)) {
      const cached = idempotencyResponses.get(cachedKey)!;
      return res.status(cached.status).json({
        ...cached.body,
        idempotentReplay: true,
      });
    }

    // 2. Rate limiting per authenticated account
    if (!checkRateLimit(`vote:${user.id}`, 10, 60_000)) {
      return res.status(429).json({
        code: 'RATE_LIMITED',
        error: 'Trop de tentatives rapprochées. Veuillez patienter quelques secondes.',
      });
    }

    // 3. Concurrency lock per voter
    if (activeVoterLocks.has(user.id)) {
      return res.status(409).json({
        code: 'CONCURRENT_REQUEST',
        error: 'Une requête de vote est déjà en cours de traitement pour votre compte.',
      });
    }

    activeVoterLocks.add(user.id);
    try {
      if (!user.emailVerified) {
        const body = {
          code: 'ACCOUNT_UNVERIFIED',
          error: 'Votre adresse e-mail doit être vérifiée avant de pouvoir voter.',
        };
        return res.status(403).json(body);
      }

      const votingState = isVotingCurrentlyOpen();
      if (!votingState.open) {
        const body = {
          code: votingState.code,
          error: votingState.messageFr,
        };
        return res.status(403).json(body);
      }

      const candidateId = String(req.body.candidateId || '').trim();
      const candidate = candidatesStore.find((c) => c.id === candidateId);
      if (!candidate || candidate.status !== 'eligible') {
        const body = {
          code: 'CANDIDATE_INELIGIBLE',
          error: "Cette candidate n'est pas éligible au vote actuellement.",
        };
        return res.status(400).json(body);
      }

      const voteType = req.body.voteType === 'paid_pack' ? 'paid_pack' : 'free_verified';

      if (voteType === 'free_verified') {
        const existingFreeVote = votesStore.find(
          (v) =>
            v.voterId === user.id &&
            v.contestEdition === serverConfig.editionNumber &&
            v.voteType === 'free_verified' &&
            v.status === 'valid'
        );

        if (existingFreeVote) {
          const body = {
            code: 'FREE_VOTE_ALREADY_USED',
            error: `Votre 1er vote gratuit pour la ${serverConfig.editionLabel} a déjà été utilisé (pour ${existingFreeVote.candidateName}). À partir du 2ᵉ vote, le tarif est de ${serverConfig.paidVotePriceXaf} XAF / vote.`,
            existingVote: {
              id: existingFreeVote.id,
              candidateId: existingFreeVote.candidateId,
              candidateName: existingFreeVote.candidateName,
              createdAt: existingFreeVote.createdAt,
            },
          };
          idempotencyResponses.set(cachedKey, { status: 409, body });
          return res.status(409).json(body);
        }

        const newVote: VoteRecord = {
          id: `vote-${crypto.randomUUID().slice(0, 10)}`,
          contestEdition: serverConfig.editionNumber,
          candidateId: candidate.id,
          candidateNumber: candidate.number,
          candidateName: candidate.name,
          voterId: user.id,
          voteType: 'free_verified',
          quantity: 1,
          amountXaf: 0,
          idempotencyKey,
          status: 'valid',
          createdAt: new Date().toISOString(),
        };

        votesStore.push(newVote);

        const auditEntry: AuditLogEntry = {
          id: `audit-${crypto.randomUUID().slice(0, 8)}`,
          timestamp: newVote.createdAt,
          actorId: user.id,
          actorRole: user.role,
          action: 'RECORD_FREE_VOTE',
          targetType: 'candidate',
          targetId: candidate.id,
          reason: '1er vote gratuit avec compte vérifié',
          details: `Vote #${newVote.id} enregistré pour Candidate n°${candidate.number} (${candidate.name}) — Clé idempotence: ${idempotencyKey}`,
        };
        auditLogsStore.unshift(auditEntry);

        // Persist vote & audit log in Sanity Content Lake
        upsertSanityDoc(`voteRecord-${newVote.id}`, 'voteRecord', newVote);
        upsertSanityDoc(`auditLog-${auditEntry.id}`, 'auditLog', auditEntry);

        const validTotals = recomputeValidVoteTotals();
        const showPublicVotes =
          serverConfig.publicLeaderboardEnabled &&
          serverConfig.leaderboardMode !== 'hidden_during_voting';

        const successBody = {
          code: 'VOTE_RECORDED',
          message: `Votre vote gratuit pour ${candidate.name} (Candidate n°${candidate.number}) a été validé et enregistré par le serveur.`,
          vote: {
            id: newVote.id,
            candidateId: newVote.candidateId,
            candidateNumber: newVote.candidateNumber,
            candidateName: newVote.candidateName,
            voteType: newVote.voteType,
            quantity: newVote.quantity,
            createdAt: newVote.createdAt,
            idempotencyKey: newVote.idempotencyKey,
          },
          updatedCandidatePublicVotes: showPublicVotes ? validTotals.get(candidate.id) || 0 : null,
          user: buildUserClientPayload(user),
        };

        idempotencyResponses.set(cachedKey, { status: 201, body: successBody });
        return res.status(201).json(successBody);
      } else {
        if (!serverConfig.paidVotingEnabled || !serverConfig.paymentProviderConfigured) {
          const body = {
            code: 'PAID_VOTING_DISABLED',
            error:
              "Le vote payant (100 XAF à partir du 2ᵉ vote) est préparé dans l'architecture mais désactivé tant qu'un prestataire de paiement certifié et ses webhooks signés ne sont pas configurés par l'organisation. Aucun paiement fictif n'est simulé.",
          };
          return res.status(403).json(body);
        }
      }
    } finally {
      activeVoterLocks.delete(user.id);
    }
  });

  app.get('/api/votes/status/:idempotencyKey', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    const key = String(req.params.idempotencyKey || '').trim();
    const vote = votesStore.find((v) => v.voterId === user.id && v.idempotencyKey === key);
    if (!vote) {
      return res.json({ found: false });
    }
    res.json({
      found: true,
      vote: {
        id: vote.id,
        candidateId: vote.candidateId,
        candidateName: vote.candidateName,
        status: vote.status,
        createdAt: vote.createdAt,
      },
    });
  });

  // --------------------------------------------------------------------------
  // 7. CONTACT & ISSUE REPORTING
  // --------------------------------------------------------------------------
  const contactMessages: {
    id: string;
    name: string;
    email: string;
    subject: string;
    category: string;
    message: string;
    createdAt: string;
  }[] = [];

  app.post('/api/contact', (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim();
    const subject = String(req.body.subject || '').trim();
    const category = String(req.body.category || 'general').trim();
    const message = String(req.body.message || '').trim();

    if (!name || !email.includes('@') || message.length < 10) {
      return res.status(400).json({
        error: 'Veuillez remplir tous les champs obligatoires (message de 10 caractères minimum).',
      });
    }

    const entry = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      name,
      email,
      subject: subject || 'Demande de contact',
      category,
      message,
      createdAt: new Date().toISOString(),
    };
    contactMessages.unshift(entry);
    upsertSanityDoc(`contactMessage-${entry.id}`, 'contactMessage', entry);

    res.status(201).json({
      ok: true,
      reference: entry.id,
      createdAt: entry.createdAt,
    });
  });

  // --------------------------------------------------------------------------
  // 8. SECURE ADMINISTRATION ROUTES (RBAC Enforced Server-Side)
  // --------------------------------------------------------------------------
  function requireAdminRole(allowedRoles: AdminRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = getAuthenticatedUser(req);
      if (!user || user.role === 'voter' || !allowedRoles.includes(user.role as AdminRole)) {
        return res.status(403).json({
          error: 'Accès interdit : votre rôle ne dispose pas des permissions nécessaires.',
        });
      }
      (req as any).adminUser = user;
      next();
    };
  }

  app.get(
    '/api/admin/overview',
    requireAdminRole(['super_admin', 'candidate_manager', 'moderator', 'report_viewer']),
    (req, res) => {
      const adminUser = (req as any).adminUser as ServerUserRecord;
      const validTotals = recomputeValidVoteTotals();

      const sanitizedVotes = votesStore.map((v) => ({
        id: v.id,
        contestEdition: v.contestEdition,
        candidateId: v.candidateId,
        candidateNumber: v.candidateNumber,
        candidateName: v.candidateName,
        voterAnonymizedId: `voter_${crypto.createHash('sha256').update(v.voterId).digest('hex').slice(0, 10)}`,
        voteType: v.voteType,
        quantity: v.quantity,
        amountXaf: v.amountXaf,
        idempotencyKey: v.idempotencyKey,
        status: v.status,
        invalidationReason: v.invalidationReason,
        invalidatedByAdminId: v.invalidatedByAdminId,
        invalidatedAt: v.invalidatedAt,
        createdAt: v.createdAt,
      }));

      res.json({
        adminRole: adminUser.role,
        sanityConnected: isSanityConfigured,
        config: serverConfig,
        candidates: candidatesStore.map((c) => ({
          ...c,
          publicVotesCount: validTotals.get(c.id) || 0,
        })),
        votes: sanitizedVotes,
        auditLogs: auditLogsStore,
        contactMessages,
      });
    }
  );

  app.patch('/api/admin/config', requireAdminRole(['super_admin']), (req, res) => {
    const adminUser = (req as any).adminUser as ServerUserRecord;
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 8) {
      return res.status(400).json({
        error: 'Un motif de traçabilité (minimum 8 caractères) est obligatoire pour modifier la configuration.',
      });
    }

    const updates = req.body.updates || {};
    const previousStatus = serverConfig.editionStatus;

    if (typeof updates.contestName === 'string' && updates.contestName.trim()) {
      serverConfig.contestName = updates.contestName.trim();
    }
    if (typeof updates.editionLabel === 'string' && updates.editionLabel.trim()) {
      serverConfig.editionLabel = updates.editionLabel.trim();
    }
    if (typeof updates.editionStatus === 'string') {
      const allowedStatuses: EditionStatus[] = [
        'draft',
        'published',
        'voting_open',
        'voting_closed',
        'results_under_review',
        'results_published',
        'archived',
      ];
      if (allowedStatuses.includes(updates.editionStatus)) {
        serverConfig.editionStatus = updates.editionStatus;
      }
    }
    if (typeof updates.publicLeaderboardEnabled === 'boolean') {
      serverConfig.publicLeaderboardEnabled = updates.publicLeaderboardEnabled;
    }
    if (typeof updates.leaderboardMode === 'string') {
      serverConfig.leaderboardMode = updates.leaderboardMode;
    }

    const auditEntry: AuditLogEntry = {
      id: `audit-${crypto.randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      actorId: adminUser.id,
      actorRole: adminUser.role,
      action: 'UPDATE_CONTEST_CONFIG',
      targetType: 'contest',
      targetId: `ed-${serverConfig.editionNumber}`,
      reason,
      details: `Statut: ${previousStatus} -> ${serverConfig.editionStatus} | Classement public: ${serverConfig.publicLeaderboardEnabled}`,
    };
    auditLogsStore.unshift(auditEntry);

    upsertSanityDoc('contestConfig-edition-20', 'contestConfig', serverConfig);
    upsertSanityDoc(`auditLog-${auditEntry.id}`, 'auditLog', auditEntry);

    res.json({ config: serverConfig, auditLogs: auditLogsStore });
  });

  app.post(
    '/api/admin/candidates',
    requireAdminRole(['super_admin', 'candidate_manager']),
    (req, res) => {
      const adminUser = (req as any).adminUser as ServerUserRecord;
      const { name, number, region, city, roleFr, roleEn, age, bioFr, bioEn, causeFr, causeEn, mottoFr, mottoEn, photoUrl, focalPoint } = req.body;

      if (!name || !number || !region || !roleFr || !bioFr || !mottoFr) {
        return res.status(400).json({ error: 'Veuillez renseigner tous les champs obligatoires de la candidate.' });
      }

      const num = Number(number);
      if (candidatesStore.some((c) => c.number === num)) {
        return res.status(409).json({ error: `Une candidate porte déjà le numéro ${num}.` });
      }

      const slug = `${String(name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')}-candidate-${num}`;

      const newCandidate: Candidate = {
        id: `cand-${crypto.randomUUID().slice(0, 6)}`,
        slug,
        number: num,
        name: String(name).trim(),
        roleFr: String(roleFr).trim(),
        roleEn: String(roleEn || roleFr).trim(),
        age: Number(age) || 23,
        isFictionalAge: true,
        region: String(region).trim(),
        city: String(city || '').trim(),
        bioFr: String(bioFr).trim(),
        bioEn: String(bioEn || bioFr).trim(),
        causeFr: String(causeFr || roleFr).trim(),
        causeEn: String(causeEn || causeFr || roleFr).trim(),
        mottoFr: String(mottoFr).trim(),
        mottoEn: String(mottoEn || mottoFr).trim(),
        photoUrl: String(photoUrl || '/assets/aistudio/Laure_69cc1d06.jpg').trim(),
        focalPoint: String(focalPoint || 'center 18%').trim(),
        galleryUrls: [String(photoUrl || '/assets/aistudio/Laure_69cc1d06.jpg').trim()],
        videoUrl: null,
        socialLinks: [],
        editionId: 'ed-20',
        status: 'eligible',
        publicVotesCount: 0,
        isDemoData: false,
      };

      candidatesStore.push(newCandidate);

      const auditEntry: AuditLogEntry = {
        id: `audit-${crypto.randomUUID().slice(0, 8)}`,
        timestamp: new Date().toISOString(),
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: 'CREATE_CANDIDATE',
        targetType: 'candidate',
        targetId: newCandidate.id,
        reason: `Ajout officiel de la Candidate n°${newCandidate.number} (${newCandidate.name})`,
        details: `Région: ${newCandidate.region} | Rôle: ${newCandidate.roleFr}`,
      };
      auditLogsStore.unshift(auditEntry);

      upsertSanityDoc(`candidate-${newCandidate.id}`, 'candidate', newCandidate);
      upsertSanityDoc(`auditLog-${auditEntry.id}`, 'auditLog', auditEntry);

      res.status(201).json({ candidate: newCandidate });
    }
  );

  app.patch(
    '/api/admin/candidates/:id',
    requireAdminRole(['super_admin', 'candidate_manager']),
    (req, res) => {
      const adminUser = (req as any).adminUser as ServerUserRecord;
      const candidate = candidatesStore.find((c) => c.id === req.params.id);
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate introuvable' });
      }
      const reason = String(req.body.reason || 'Mise à jour du profil candidate').trim();
      if (req.body.status && ['eligible', 'withdrawn', 'suspended'].includes(req.body.status)) {
        candidate.status = req.body.status;
      }

      const auditEntry: AuditLogEntry = {
        id: `audit-${crypto.randomUUID().slice(0, 8)}`,
        timestamp: new Date().toISOString(),
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: 'UPDATE_CANDIDATE',
        targetType: 'candidate',
        targetId: candidate.id,
        reason,
        details: `Candidate n°${candidate.number} (${candidate.name}) — Statut: ${candidate.status}`,
      };
      auditLogsStore.unshift(auditEntry);

      upsertSanityDoc(`candidate-${candidate.id}`, 'candidate', candidate);
      upsertSanityDoc(`auditLog-${auditEntry.id}`, 'auditLog', auditEntry);

      res.json({ candidate });
    }
  );

  app.post(
    '/api/admin/votes/:voteId/invalidate',
    requireAdminRole(['super_admin', 'moderator']),
    (req, res) => {
      const adminUser = (req as any).adminUser as ServerUserRecord;
      const vote = votesStore.find((v) => v.id === req.params.voteId);
      if (!vote) {
        return res.status(404).json({ error: 'Vote introuvable.' });
      }
      const reason = String(req.body.reason || '').trim();
      if (reason.length < 10) {
        return res.status(400).json({
          error: "Toute invalidation de vote exige un motif documenté d'au moins 10 caractères pour le journal d'audit.",
        });
      }

      vote.status = 'invalidated';
      vote.invalidationReason = reason;
      vote.invalidatedByAdminId = adminUser.id;
      vote.invalidatedAt = new Date().toISOString();

      const auditEntry: AuditLogEntry = {
        id: `audit-${crypto.randomUUID().slice(0, 8)}`,
        timestamp: vote.invalidatedAt,
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: 'INVALIDATE_VOTE',
        targetType: 'vote',
        targetId: vote.id,
        reason,
        details: `Invalidation motivée du vote ${vote.id} (Candidate n°${vote.candidateNumber} ${vote.candidateName})`,
      };
      auditLogsStore.unshift(auditEntry);

      upsertSanityDoc(`voteRecord-${vote.id}`, 'voteRecord', vote);
      upsertSanityDoc(`auditLog-${auditEntry.id}`, 'auditLog', auditEntry);

      res.json({ vote });
    }
  );

  app.post(
    '/api/admin/news',
    requireAdminRole(['super_admin', 'candidate_manager']),
    (req, res) => {
      const adminUser = (req as any).adminUser as ServerUserRecord;
      const { titleFr, titleEn, excerptFr, excerptEn, contentFr, contentEn, categoryFr } = req.body;
      if (!titleFr || !excerptFr || !contentFr) {
        return res.status(400).json({ error: 'Titre, résumé et contenu français obligatoires.' });
      }
      const slug = `${String(titleFr)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

      const article: NewsArticle = {
        id: `news-${crypto.randomUUID().slice(0, 6)}`,
        slug,
        titleFr: String(titleFr).trim(),
        titleEn: String(titleEn || titleFr).trim(),
        excerptFr: String(excerptFr).trim(),
        excerptEn: String(excerptEn || excerptFr).trim(),
        contentFr: String(contentFr).trim(),
        contentEn: String(contentEn || contentFr).trim(),
        categoryFr: String(categoryFr || 'Communiqué').trim(),
        categoryEn: 'Official Update',
        publishedAt: new Date().toISOString(),
        coverUrl: '/assets/aistudio/Embl_me_dor__Miss_Beaut__Cameroun_2f1797e1.png',
        isDemoData: false,
      };

      newsStore.unshift(article);

      const auditEntry: AuditLogEntry = {
        id: `audit-${crypto.randomUUID().slice(0, 8)}`,
        timestamp: article.publishedAt,
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: 'PUBLISH_NEWS',
        targetType: 'news',
        targetId: article.id,
        reason: 'Publication actualité officielle',
        details: article.titleFr,
      };
      auditLogsStore.unshift(auditEntry);

      upsertSanityDoc(`newsArticle-${article.id}`, 'newsArticle', article);
      upsertSanityDoc(`auditLog-${auditEntry.id}`, 'auditLog', auditEntry);

      res.status(201).json({ article });
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
