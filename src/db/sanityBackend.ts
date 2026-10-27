import { createClient, SanityClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import { CentralConfig, DEFAULT_CENTRAL_CONFIG } from '../config/centralConfig.ts';
import {
  Candidate,
  NewsArticle,
  VoteRecord,
  AuditLogEntry,
  INITIAL_CANDIDATES,
  INITIAL_NEWS,
} from '../data/initialData.ts';

dotenv.config({ path: '.env.local' });
dotenv.config();

const projectId = process.env.SANITY_PROJECT_ID || '79m8ign4';
const dataset = process.env.SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN || '';

export const isSanityConfigured = Boolean(projectId && token);

export const sanityClient: SanityClient | null = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      token,
      apiVersion: '2024-03-01',
      useCdn: false,
    })
  : null;

/**
 * Synchronize initial contest config, 6 candidates, and news articles to Sanity Content Lake
 */
export async function syncInitialDataToSanity(
  config: CentralConfig = DEFAULT_CENTRAL_CONFIG,
  candidates: Candidate[] = INITIAL_CANDIDATES,
  news: NewsArticle[] = INITIAL_NEWS,
  auditLogs: AuditLogEntry[] = []
): Promise<{ ok: boolean; syncedCount: number; error?: string }> {
  if (!sanityClient) {
    return { ok: false, syncedCount: 0, error: 'Sanity token not configured' };
  }

  try {
    const tx = sanityClient.transaction();

    // 1. Contest Config Document
    tx.createIfNotExists({
      _id: 'contestConfig-edition-20',
      _type: 'contestConfig',
      ...config,
    });

    // 2. Candidates Documents
    for (const cand of candidates) {
      tx.createOrReplace({
        _id: `candidate-${cand.id}`,
        _type: 'candidate',
        ...cand,
      });
    }

    // 3. News Articles Documents
    for (const art of news) {
      tx.createOrReplace({
        _id: `newsArticle-${art.id}`,
        _type: 'newsArticle',
        ...art,
      });
    }

    // 4. Initial Audit Logs
    for (const log of auditLogs) {
      tx.createIfNotExists({
        _id: `auditLog-${log.id}`,
        _type: 'auditLog',
        ...log,
      });
    }

    await tx.commit();
    return { ok: true, syncedCount: 1 + candidates.length + news.length + auditLogs.length };
  } catch (err: any) {
    console.error('Sanity sync error:', err?.message || err);
    return { ok: false, syncedCount: 0, error: err?.message || String(err) };
  }
}

/**
 * Load persisted state from Sanity Content Lake at server startup
 */
export async function loadStateFromSanity(): Promise<{
  config?: CentralConfig;
  candidates?: Candidate[];
  news?: NewsArticle[];
  votes?: VoteRecord[];
  auditLogs?: AuditLogEntry[];
} | null> {
  if (!sanityClient) return null;
  try {
    const data = await sanityClient.fetch(`{
      "config": *[_type == "contestConfig" && _id == "contestConfig-edition-20"][0],
      "candidates": *[_type == "candidate"] | order(number asc),
      "news": *[_type == "newsArticle"] | order(publishedAt desc),
      "votes": *[_type == "voteRecord"] | order(createdAt desc),
      "auditLogs": *[_type == "auditLog"] | order(timestamp desc)
    }`);
    return data;
  } catch (err: any) {
    console.error('Failed to fetch from Sanity:', err?.message || err);
    return null;
  }
}

/**
 * Persist a single document mutation to Sanity asynchronously & safely
 */
export async function upsertSanityDoc(docId: string, docType: string, payload: Record<string, any>) {
  if (!sanityClient) return;
  try {
    await sanityClient.createOrReplace({
      _id: docId,
      _type: docType,
      ...payload,
    });
  } catch (err: any) {
    console.error(`Failed to upsert Sanity doc ${docId}:`, err?.message || err);
  }
}
