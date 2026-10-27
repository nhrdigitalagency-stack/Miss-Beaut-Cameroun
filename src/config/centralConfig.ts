export type EditionStatus =
  | 'draft'
  | 'published'
  | 'voting_open'
  | 'voting_closed'
  | 'results_under_review'
  | 'results_published'
  | 'archived';

export type VotingMode =
  | 'free_verified_account'
  | 'hybrid_free_and_paid'
  | 'one_per_period'
  | 'paid_only';

export type VoteLimitMode =
  | 'one_per_account_per_edition'
  | 'one_free_then_paid_100xaf'
  | 'one_per_day';

export interface CentralConfig {
  contestName: string;
  alternateWorkName: string;
  isProvisionalName: boolean;
  editionLabel: string;
  editionNumber: number;
  organizerName: string;
  logoUrl: string;
  sloganFr: string;
  sloganEn: string;
  primaryColor: string;
  deepColor: string;
  accentRoseColor: string;
  accentColor: string;
  accentLightColor: string;
  fontFamily: string;
  defaultLocale: 'fr' | 'en';
  supportedLocales: ('fr' | 'en')[];
  timeZone: string;
  editionStatus: EditionStatus;
  votingMode: VotingMode;
  voteLimitMode: VoteLimitMode;
  freeVotesPerAccount: number;
  paidVotePriceXaf: number;
  votingOpensAt: string | null;
  votingClosesAt: string | null;
  finalEventAt: string | null;
  publicLeaderboardEnabled: boolean;
  leaderboardMode: 'visible' | 'hidden_during_voting' | 'deferred' | 'official_validated';
  paidVotingEnabled: boolean;
  paymentProviderConfigured: boolean;
  publicVoteWeightPercent: number | null;
  juryWeightPercent: number | null;
  contactEmail: string;
  contactPhone: string;
  siteUrl: string;
  demoMode: boolean;
  dataRetentionDays: number;
}

export const DEFAULT_CENTRAL_CONFIG: CentralConfig = {
  contestName: 'Miss Beauté Cameroun',
  alternateWorkName: 'Éclat Cameroun',
  isProvisionalName: true,
  editionLabel: '20ᵉ Édition',
  editionNumber: 20,
  organizerName: 'Comité d’Organisation (Configuration de travail)',
  logoUrl: '/assets/aistudio/Embl_me_dor__Miss_Beaut__Cameroun_2f1797e1.png',
  sloganFr: 'Une scène. Des ambitions. Votre voix.',
  sloganEn: 'One stage. Ambitions. Your voice.',
  primaryColor: '#A80D55',
  deepColor: '#780938',
  accentRoseColor: '#D62C7C',
  accentColor: '#D6F542',
  accentLightColor: '#F1FACB',
  fontFamily: 'Poppins',
  defaultLocale: 'fr',
  supportedLocales: ['fr', 'en'],
  timeZone: 'Africa/Douala',
  editionStatus: 'voting_open',
  votingMode: 'free_verified_account',
  voteLimitMode: 'one_free_then_paid_100xaf',
  freeVotesPerAccount: 1,
  paidVotePriceXaf: 100,
  votingOpensAt: '2026-10-27T00:00:00+01:00',
  votingClosesAt: '2026-12-01T23:59:59+01:00',
  finalEventAt: null,
  publicLeaderboardEnabled: true,
  leaderboardMode: 'visible',
  paidVotingEnabled: false,
  paymentProviderConfigured: false,
  publicVoteWeightPercent: null,
  juryWeightPercent: null,
  contactEmail: 'contact@eclat-cameroun.example.org',
  contactPhone: '+237 6 00 00 00 00 (À configurer)',
  siteUrl: 'https://eclat-cameroun.example.org',
  demoMode: true,
  dataRetentionDays: 90,
};
