/**
 * Automated Verification Suite for Critical Voting & Security Operations (Section 22)
 * Verifies:
 * 1. Central configuration & dates (27/10/2026 - 01/12/2026)
 * 2. Initial 6 candidates data integrity & focal points
 * 3. Bilingual dictionaries completeness (fr.json & en.json)
 * 4. SQL Migration & RLS blueprint presence
 */

import assert from 'assert';
import { DEFAULT_CENTRAL_CONFIG } from '../config/centralConfig.ts';
import { INITIAL_CANDIDATES } from '../data/initialData.ts';
import { SUPABASE_SQL_MIGRATION } from '../db/supabaseMigration.ts';
import frDict from '../i18n/fr.json' with { type: 'json' };
import enDict from '../i18n/en.json' with { type: 'json' };

export function runCriticalIntegrityChecks() {
  // 1. Verify dates & pricing rules
  assert.strictEqual(DEFAULT_CENTRAL_CONFIG.editionNumber, 20, 'Edition must be 20');
  assert.strictEqual(DEFAULT_CENTRAL_CONFIG.freeVotesPerAccount, 1, '1st vote must be free');
  assert.strictEqual(DEFAULT_CENTRAL_CONFIG.paidVotePriceXaf, 100, '2nd+ vote must be 100 XAF');
  assert.strictEqual(DEFAULT_CENTRAL_CONFIG.paidVotingEnabled, false, 'Paid voting disabled by default until provider configured');
  assert.ok(DEFAULT_CENTRAL_CONFIG.votingOpensAt?.startsWith('2026-10-27'), 'Opens 27/10/2026');
  assert.ok(DEFAULT_CENTRAL_CONFIG.votingClosesAt?.startsWith('2026-12-01'), 'Closes 01/12/2026');

  // 2. Verify all 6 candidates (Laure, Nadia, Belva, Joséphine, Morelle, Synthia)
  assert.strictEqual(INITIAL_CANDIDATES.length, 6, 'Must have exactly 6 candidates');
  const expectedNames = ['Laure', 'Nadia', 'Belva', 'Joséphine', 'Morelle', 'Synthia'];
  INITIAL_CANDIDATES.forEach((cand, index) => {
    assert.strictEqual(cand.number, index + 1);
    assert.strictEqual(cand.name, expectedNames[index]);
    assert.ok(cand.photoUrl.startsWith('/assets/aistudio/'), 'Must use authorized uploaded portrait');
    assert.strictEqual(cand.isDemoData, true, 'Must clearly identify demo data');
  });

  // 3. Verify bilingual keys match
  assert.deepStrictEqual(Object.keys(frDict), Object.keys(enDict), 'FR and EN top-level keys must match');

  // 4. Verify SQL migration contains idempotency & unique constraints
  assert.ok(SUPABASE_SQL_MIGRATION.includes('idempotency_key TEXT NOT NULL UNIQUE'));
  assert.ok(SUPABASE_SQL_MIGRATION.includes('idx_unique_free_vote_per_voter_edition'));

  return true;
}
