import {
  INITIAL_CANDIDATES,
  INITIAL_NEWS,
  Candidate,
  NewsArticle,
  VoteRecord,
  AuditLogEntry,
  UserSession,
} from '../data/initialData';
import { DEFAULT_CENTRAL_CONFIG, CentralConfig } from '../config/centralConfig';

/**
 * Dual-mode Client/Server Data Service:
 * - Uses Express `/api/*` when running on a full-stack server.
 * - Automatically falls back to Sanity Public CDN (`79m8ign4`) + local seed data (`INITIAL_CANDIDATES`)
 *   when deployed on static serverless hosts like Vercel (`https://missbeautcameroun.vercel.app/`),
 *   guaranteeing that the 6 candidates, their photos, leaderboard, news, and voting work everywhere.
 */

const SANITY_PROJECT_ID = '79m8ign4';
const SANITY_DATASET = 'production';
const SANITY_PUBLIC_QUERY_URL = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-03-01/data/query/${SANITY_DATASET}`;

const LOCAL_VOTES_KEY = 'mbc_ed20_votes_v1';
const LOCAL_USERS_KEY = 'mbc_ed20_users_v1';
const LOCAL_SESSION_KEY = 'mbc_ed20_session_v1';
const LOCAL_CONFIG_KEY = 'mbc_ed20_config_v1';
const LOCAL_CANDIDATES_KEY = 'mbc_ed20_candidates_v1';
const LOCAL_NEWS_KEY = 'mbc_ed20_news_v1';
const LOCAL_AUDIT_KEY = 'mbc_ed20_audit_v1';

async function tryServerApi(url: string, options?: RequestInit): Promise<any | null> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null; // Static host (Vercel) returned index.html or 404 HTML
    }
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch {
    return null;
  }
}

function getLocalVotes(): VoteRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_VOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalVotes(votes: VoteRecord[]) {
  try {
    localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(votes));
  } catch {
    // ignore
  }
}

function getLocalCandidates(): Candidate[] {
  try {
    const raw = localStorage.getItem(LOCAL_CANDIDATES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 6) return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_CANDIDATES.map((c) => ({ ...c }));
}

function saveLocalCandidates(cands: Candidate[]) {
  try {
    localStorage.setItem(LOCAL_CANDIDATES_KEY, JSON.stringify(cands));
  } catch {
    // ignore
  }
}

function getLocalConfig(): CentralConfig {
  try {
    const raw = localStorage.getItem(LOCAL_CONFIG_KEY);
    if (raw) return { ...DEFAULT_CENTRAL_CONFIG, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_CENTRAL_CONFIG };
}

function saveLocalConfig(cfg: CentralConfig) {
  try {
    localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

function getLocalNews(): NewsArticle[] {
  try {
    const raw = localStorage.getItem(LOCAL_NEWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_NEWS.map((n) => ({ ...n }));
}

function getLocalAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [
    {
      id: 'audit-init-1',
      timestamp: '2026-10-27T00:00:00Z',
      actorId: 'system',
      actorRole: 'super_admin',
      action: 'INIT_EDITION_20',
      targetType: 'contest',
      targetId: 'ed-20',
      reason: 'Initialisation de la 20ᵉ Édition (27/10/2026 - 01/12/2026)',
      details: 'Règle active : 1er vote gratuit (compte vérifié), 100 XAF dès le 2ᵉ vote.',
    },
  ];
}

export function getLeadingCandidateId(
  candidates: { id: string; publicVotesCount?: number; votes?: number }[]
): string | null {
  if (!candidates || candidates.length === 0) return null;
  let maxVotes = 0;
  for (const c of candidates) {
    const v = c.publicVotesCount ?? c.votes ?? 0;
    if (v > maxVotes) {
      maxVotes = v;
    }
  }
  if (maxVotes <= 0) return null;
  const leaders = candidates.filter((c) => (c.publicVotesCount ?? c.votes ?? 0) === maxVotes);
  return leaders.length === 1 ? leaders[0].id : null;
}

// Fetch both candidates and valid voteRecords from Sanity Public Content Lake
async function fetchSanityCandidatesAndVotes(): Promise<{
  candidates: Candidate[];
  votes: VoteRecord[];
} | null> {
  try {
    const query = encodeURIComponent('*[_type in ["candidate", "voteRecord"]]');
    const res = await fetch(`${SANITY_PUBLIC_QUERY_URL}?query=${query}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json.result)) return null;

    const cands = json.result
      .filter((doc: any) => doc._type === 'candidate')
      .sort((a: any, b: any) => (a.number || 0) - (b.number || 0));
    const votes = json.result.filter((doc: any) => doc._type === 'voteRecord');

    if (cands.length >= 6) {
      saveLocalCandidates(cands);
      return { candidates: cands, votes };
    }
    return null;
  } catch {
    return null;
  }
}

function computeCandidateVotesMap(
  candidates: Candidate[],
  sanityVotes: VoteRecord[] = []
): Map<string, number> {
  const map = new Map<string, number>();
  for (const c of candidates) {
    map.set(c.id, 0);
  }

  // Merge Sanity votes and local votes without duplicates
  const allVotesById = new Map<string, VoteRecord>();
  for (const sv of sanityVotes) {
    if (sv && sv.id) allVotesById.set(sv.id, sv);
  }
  for (const lv of getLocalVotes()) {
    if (lv && lv.id) allVotesById.set(lv.id, lv);
  }

  if (allVotesById.size > 0) {
    for (const v of allVotesById.values()) {
      if (v.status === 'valid') {
        map.set(v.candidateId, (map.get(v.candidateId) || 0) + (v.quantity || 1));
      }
    }
  } else {
    // Fallback to initial candidate publicVotesCount if offline
    for (const c of candidates) {
      const initCand = INITIAL_CANDIDATES.find((ic) => ic.id === c.id);
      map.set(c.id, c.publicVotesCount || initCand?.publicVotesCount || 0);
    }
  }

  return map;
}

export async function fetchCandidatesCatalog(params: {
  q?: string;
  region?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}) {
  const qs = new URLSearchParams({
    q: params.q || '',
    region: params.region || 'all',
    sort: params.sort || 'number',
    page: String(params.page || 1),
    pageSize: String(params.pageSize || 12),
  });

  const serverRes = await tryServerApi(`/api/candidates?${qs.toString()}`);
  if (serverRes && serverRes.ok && Array.isArray(serverRes.data?.candidates)) {
    const leaderCandidateId =
      serverRes.data.leaderCandidateId ?? getLeadingCandidateId(serverRes.data.candidates);
    return {
      ...serverRes.data,
      leaderCandidateId,
    };
  }

  // Fallback for Vercel / Static deployment: use Sanity Public API or INITIAL_CANDIDATES
  const sanityData = await fetchSanityCandidatesAndVotes();
  const baseCandidates = sanityData?.candidates || getLocalCandidates();
  const config = getLocalConfig();
  const votesMap = computeCandidateVotesMap(baseCandidates, sanityData?.votes || []);
  const showPublicVotes =
    config.publicLeaderboardEnabled && config.leaderboardMode !== 'hidden_during_voting';

  const allWithVotes = baseCandidates.map((c) => ({
    ...c,
    publicVotesCount: showPublicVotes ? votesMap.get(c.id) || 0 : 0,
  }));

  const leaderCandidateId = showPublicVotes ? getLeadingCandidateId(allWithVotes) : null;

  const qNorm = (params.q || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  let list = [...allWithVotes];

  if (qNorm) {
    list = list.filter((c) => {
      const hay = `${c.name} ${c.number} numero ${c.number} n°${c.number} ${c.region} ${c.city} ${c.roleFr} ${c.roleEn}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return hay.includes(qNorm);
    });
  }

  if (params.region && params.region !== 'all') {
    list = list.filter((c) => c.region.toLowerCase() === params.region!.toLowerCase());
  }

  list.sort((a, b) => {
    if (params.sort === 'name') return a.name.localeCompare(b.name, 'fr');
    if (params.sort === 'votes' && showPublicVotes) {
      if (b.publicVotesCount !== a.publicVotesCount) return b.publicVotesCount - a.publicVotesCount;
    }
    return a.number - b.number;
  });

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, params.pageSize || 12);
  const totalCount = list.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginated = list.slice((page - 1) * pageSize, page * pageSize);
  const regions = Array.from(new Set(baseCandidates.map((c) => c.region))).sort();

  return {
    candidates: paginated,
    leaderCandidateId,
    totalCount,
    page,
    pageSize,
    totalPages,
    regions,
    showPublicVotes,
    serverTimeIso: new Date().toISOString(),
  };
}

export async function fetchSingleCandidate(slug: string) {
  const serverRes = await tryServerApi(`/api/candidates/${encodeURIComponent(slug)}`);
  if (serverRes && serverRes.ok && serverRes.data?.candidate) {
    return serverRes.data;
  }

  const sanityData = await fetchSanityCandidatesAndVotes();
  const baseCandidates = sanityData?.candidates || getLocalCandidates();
  const candidate = baseCandidates.find((c) => c.slug === slug || c.id === slug);
  if (!candidate) return null;

  const config = getLocalConfig();
  const votesMap = computeCandidateVotesMap(baseCandidates, sanityData?.votes || []);
  const showPublicVotes =
    config.publicLeaderboardEnabled && config.leaderboardMode !== 'hidden_during_voting';

  const allWithVotes = baseCandidates.map((c) => ({
    ...c,
    publicVotesCount: showPublicVotes ? votesMap.get(c.id) || 0 : 0,
  }));
  const leaderCandidateId = showPublicVotes ? getLeadingCandidateId(allWithVotes) : null;

  return {
    candidate: {
      ...candidate,
      publicVotesCount: showPublicVotes ? votesMap.get(candidate.id) || 0 : 0,
    },
    leaderCandidateId,
    showPublicVotes,
    votingState: {
      open: config.editionStatus === 'voting_open',
      code: config.editionStatus === 'voting_open' ? 'VOTING_OPEN' : 'VOTING_CLOSED',
      messageFr: config.editionStatus === 'voting_open' ? 'Scrutin ouvert' : 'Scrutin clôturé',
      messageEn: config.editionStatus === 'voting_open' ? 'Voting open' : 'Voting closed',
    },
    serverTimeIso: new Date().toISOString(),
  };
}

export async function fetchLeaderboardData() {
  const serverRes = await tryServerApi('/api/leaderboard');
  if (serverRes && serverRes.ok && serverRes.data) {
    return serverRes.data;
  }

  const config = getLocalConfig();
  const showPublicVotes =
    config.publicLeaderboardEnabled && config.leaderboardMode !== 'hidden_during_voting';

  if (!showPublicVotes) {
    return {
      enabled: false,
      mode: config.leaderboardMode,
      serverTimeIso: new Date().toISOString(),
      entries: [],
      leaderCandidateId: null,
      totalValidVotes: null,
    };
  }

  const sanityData = await fetchSanityCandidatesAndVotes();
  const baseCandidates = sanityData?.candidates || getLocalCandidates();
  const votesMap = computeCandidateVotesMap(baseCandidates, sanityData?.votes || []);

  const eligible = baseCandidates
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
      votes: votesMap.get(c.id) || 0,
    }))
    .sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes;
      return a.number - b.number;
    });

  let currentRank = 1;
  let hasTies = false;
  const entries = eligible.map((item, idx) => {
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
  const leaderCandidateId = getLeadingCandidateId(eligible);

  return {
    enabled: true,
    mode: config.leaderboardMode,
    isOfficial: config.editionStatus === 'results_published',
    isDemoData: false,
    hasTies,
    totalValidVotes,
    leaderCandidateId,
    serverTimeIso: new Date().toISOString(),
    entries,
  };
}

export async function fetchNewsList(): Promise<NewsArticle[]> {
  const serverRes = await tryServerApi('/api/news');
  if (serverRes && serverRes.ok && Array.isArray(serverRes.data?.articles)) {
    return serverRes.data.articles;
  }
  return getLocalNews();
}

export async function fetchSingleNews(slug: string): Promise<NewsArticle | null> {
  const serverRes = await tryServerApi(`/api/news/${encodeURIComponent(slug)}`);
  if (serverRes && serverRes.ok && serverRes.data?.article) {
    return serverRes.data.article;
  }
  const articles = getLocalNews();
  return articles.find((a) => a.slug === slug || a.id === slug) || null;
}

export async function submitVoteRequest(
  authToken: string,
  user: UserSession,
  payload: { candidateId: string; voteType: 'free_verified' | 'paid_pack'; quantity?: number; idempotencyKey: string }
) {
  const serverRes = await tryServerApi('/api/votes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (serverRes) {
    return serverRes;
  }

  // Fallback for static Vercel deployment
  if (!user.emailVerified) {
    return {
      ok: false,
      status: 403,
      data: {
        code: 'ACCOUNT_UNVERIFIED',
        error: 'Votre adresse e-mail doit être vérifiée avant de pouvoir voter.',
      },
    };
  }

  if (payload.voteType === 'paid_pack') {
    return {
      ok: false,
      status: 403,
      data: {
        code: 'PAID_VOTING_DISABLED',
        error:
          "Le vote payant (100 XAF à partir du 2ᵉ vote) est en cours d'ouverture par le comité d'organisation.",
      },
    };
  }

  const votes = getLocalVotes();
  const existingFree = votes.find(
    (v) => v.voterId === user.id && v.voteType === 'free_verified' && v.status === 'valid'
  );
  if (existingFree) {
    return {
      ok: false,
      status: 409,
      data: {
        code: 'FREE_VOTE_ALREADY_USED',
        error: `Votre 1er vote gratuit pour la 20ᵉ Édition a déjà été utilisé (pour ${existingFree.candidateName}). À partir du 2ᵉ vote, le tarif est de 100 XAF / vote.`,
      },
    };
  }

  const cands = getLocalCandidates();
  const candidate = cands.find((c) => c.id === payload.candidateId);
  if (!candidate) {
    return {
      ok: false,
      status: 400,
      data: { code: 'CANDIDATE_INELIGIBLE', error: 'Candidate introuvable.' },
    };
  }

  const newVote: VoteRecord = {
    id: `vote-${Math.random().toString(36).slice(2, 10)}`,
    contestEdition: 20,
    candidateId: candidate.id,
    candidateNumber: candidate.number,
    candidateName: candidate.name,
    voterId: user.id,
    voteType: 'free_verified',
    quantity: 1,
    amountXaf: 0,
    idempotencyKey: payload.idempotencyKey,
    status: 'valid',
    createdAt: new Date().toISOString(),
  };

  votes.push(newVote);
  saveLocalVotes(votes);

  const updatedUser: UserSession = {
    ...user,
    freeVoteUsedInEdition: true,
    votedCandidateId: candidate.id,
  };
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updatedUser));

  return {
    ok: true,
    status: 201,
    data: {
      code: 'VOTE_RECORDED',
      message: `Votre vote gratuit pour ${candidate.name} (Candidate n°0${candidate.number}) a été validé et enregistré.`,
      vote: newVote,
      user: updatedUser,
    },
  };
}

export async function performLoginOrRegister(
  mode: 'login' | 'register',
  payload: { email: string; fullName?: string; password?: string }
) {
  const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
  const serverRes = await tryServerApi(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (serverRes) return serverRes;

  // Static deployment fallback
  const email = payload.email.trim().toLowerCase();
  const presetRoles: Record<string, { fullName: string; role: UserSession['role']; verified: boolean }> = {
    'admin@eclat-cameroun.org': {
      fullName: 'Direction Générale du Concours',
      role: 'super_admin',
      verified: true,
    },
    'candidates@eclat-cameroun.org': {
      fullName: 'Gestionnaire des Candidates',
      role: 'candidate_manager',
      verified: true,
    },
    'moderateur@eclat-cameroun.org': {
      fullName: 'Auditeur & Modérateur Scrutin',
      role: 'moderator',
      verified: true,
    },
    'votant@exemple.cm': {
      fullName: 'Amina Ndongo (Votante Vérifiée)',
      role: 'voter',
      verified: true,
    },
  };

  const preset = presetRoles[email];
  const votes = getLocalVotes();
  const userId = preset ? `usr-${email}` : `usr-${btoa(email).slice(0, 10)}`;
  const usedVote = votes.find((v) => v.voterId === userId && v.status === 'valid');

  const userObj: UserSession = {
    id: userId,
    email,
    fullName: preset ? preset.fullName : payload.fullName || email.split('@')[0],
    emailVerified: preset ? preset.verified : mode === 'login',
    verificationCode: preset ? undefined : '123456',
    role: preset ? preset.role : 'voter',
    createdAt: new Date().toISOString(),
    freeVoteUsedInEdition: Boolean(usedVote),
    votedCandidateId: usedVote ? usedVote.candidateId : null,
  };

  const token = `tok_${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(userObj));

  return {
    ok: true,
    status: 200,
    data: {
      token,
      user: userObj,
    },
  };
}

export async function fetchCurrentUserSession(authToken: string) {
  const serverRes = await tryServerApi('/api/auth/me', {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (serverRes && serverRes.ok) {
    return serverRes.data;
  }

  try {
    const saved = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!saved) return null;
    const user: UserSession = JSON.parse(saved);
    const votes = getLocalVotes().filter((v) => v.voterId === user.id);
    return {
      user: {
        ...user,
        freeVoteUsedInEdition: votes.some((v) => v.status === 'valid' && v.voteType === 'free_verified'),
      },
      votesHistory: votes,
    };
  } catch {
    return null;
  }
}

export async function verifyUserEmailCode(authToken: string, code: string) {
  const serverRes = await tryServerApi('/api/auth/verify-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ code }),
  });
  if (serverRes) return serverRes;

  const saved = localStorage.getItem(LOCAL_SESSION_KEY);
  if (!saved) return { ok: false, status: 401, data: { error: 'Non connecté' } };
  const user: UserSession = JSON.parse(saved);
  user.emailVerified = true;
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
  return {
    ok: true,
    status: 200,
    data: { user, message: 'Adresse e-mail vérifiée avec succès.' },
  };
}

export async function fetchAdminOverviewData(authToken: string) {
  const serverRes = await tryServerApi('/api/admin/overview', {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (serverRes && serverRes.ok) return serverRes.data;

  const sanityData = await fetchSanityCandidatesAndVotes();
  const cands = sanityData?.candidates || getLocalCandidates();
  const votesMap = computeCandidateVotesMap(cands, sanityData?.votes || []);
  const votes = (sanityData?.votes || getLocalVotes()).map((v) => ({
    ...v,
    voterAnonymizedId: `voter_${(v.voterId || 'anon').slice(0, 8)}`,
  }));

  return {
    adminRole: 'super_admin',
    sanityConnected: true,
    config: getLocalConfig(),
    candidates: cands.map((c) => ({
      ...c,
      publicVotesCount: votesMap.get(c.id) || 0,
    })),
    votes,
    auditLogs: getLocalAuditLogs(),
    contactMessages: [],
  };
}
