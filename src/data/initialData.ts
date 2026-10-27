export interface Candidate {
  id: string;
  slug: string;
  number: number;
  name: string;
  roleFr: string;
  roleEn: string;
  age: number;
  isFictionalAge: boolean;
  region: string;
  city: string;
  bioFr: string;
  bioEn: string;
  causeFr: string;
  causeEn: string;
  mottoFr: string;
  mottoEn: string;
  photoUrl: string;
  focalPoint: string; // e.g. 'center 20%' to prevent face cropping
  galleryUrls: string[];
  videoUrl: string | null;
  socialLinks: {
    platform: string;
    url: string;
  }[];
  editionId: string;
  status: 'eligible' | 'withdrawn' | 'suspended';
  publicVotesCount: number;
  isDemoData: boolean;
}

export interface NewsArticle {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  excerptFr: string;
  excerptEn: string;
  contentFr: string;
  contentEn: string;
  categoryFr: string;
  categoryEn: string;
  publishedAt: string;
  coverUrl: string;
  isDemoData: boolean;
}

export interface VoteRecord {
  id: string;
  contestEdition: number;
  candidateId: string;
  candidateNumber: number;
  candidateName: string;
  voterId: string;
  voteType: 'free_verified' | 'paid_pack';
  quantity: number;
  amountXaf: number;
  idempotencyKey: string;
  status: 'valid' | 'invalidated';
  invalidationReason?: string;
  invalidatedByAdminId?: string;
  invalidatedAt?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string;
}

export type AdminRole = 'super_admin' | 'candidate_manager' | 'moderator' | 'report_viewer';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  verificationCode?: string;
  role: 'voter' | AdminRole;
  createdAt: string;
  freeVoteUsedInEdition: boolean;
  votedCandidateId: string | null;
}

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'cand-1',
    slug: 'laure-candidate-1',
    number: 1,
    name: 'Laure',
    roleFr: 'Entrepreneure sociale',
    roleEn: 'Social Entrepreneur',
    age: 24,
    isFictionalAge: false,
    region: 'Littoral',
    city: 'Douala',
    bioFr:
      "Laure dirige une entreprise qui accompagne les jeunes femmes camerounaises dans la création de leurs propres activités. Elle souhaite utiliser le concours pour promouvoir l'indépendance financière des femmes.",
    bioEn:
      'Laure leads an organization that supports young Cameroonian women in launching their own businesses. She aims to use the pageant platform to champion women’s financial independence.',
    causeFr: 'Autonomisation économique et entrepreneuriat féminin au Cameroun',
    causeEn: 'Economic empowerment and female entrepreneurship in Cameroon',
    mottoFr: 'Une femme autonome est une femme qui transforme le monde.',
    mottoEn: 'An empowered woman is a woman who transforms the world.',
    photoUrl: '/assets/aistudio/Laure_69cc1d06.jpg',
    focalPoint: 'center 18%',
    galleryUrls: ['/assets/aistudio/Laure_69cc1d06.jpg'],
    videoUrl: null,
    socialLinks: [],
    editionId: 'ed-20',
    status: 'eligible',
    publicVotesCount: 0,
    isDemoData: false,
  },
  {
    id: 'cand-2',
    slug: 'nadia-candidate-2',
    number: 2,
    name: 'Nadia',
    roleFr: 'Médecin pédiatre',
    roleEn: 'Pediatrician',
    age: 23,
    isFictionalAge: false,
    region: 'Centre',
    city: 'Yaoundé',
    bioFr:
      "Nadia travaille auprès des enfants et participe à des campagnes de sensibilisation sur la santé maternelle et infantile. Elle rêve de faciliter l'accès aux soins pour les familles défavorisées.",
    bioEn:
      'Nadia works closely with children and leads awareness campaigns on maternal and child health. Her goal is to expand healthcare access for underserved families.',
    causeFr: 'Santé maternelle, pédiatrie préventive et accès aux soins pour tous',
    causeEn: 'Maternal health, preventive pediatrics, and healthcare access for all',
    mottoFr: "La beauté prend tout son sens lorsqu'elle sauve des vies.",
    mottoEn: 'Beauty finds its truest meaning when it saves lives.',
    photoUrl: '/assets/aistudio/Nadia_7882f6b6.jpg',
    focalPoint: 'center 15%',
    galleryUrls: ['/assets/aistudio/Nadia_7882f6b6.jpg'],
    videoUrl: null,
    socialLinks: [],
    editionId: 'ed-20',
    status: 'eligible',
    publicVotesCount: 0,
    isDemoData: false,
  },
  {
    id: 'cand-3',
    slug: 'belva-candidate-3',
    number: 3,
    name: 'Belva',
    roleFr: 'Architecte et designer',
    roleEn: 'Architect & Designer',
    age: 25,
    isFictionalAge: false,
    region: 'Ouest',
    city: 'Bafoussam',
    bioFr:
      "Belva conçoit des bâtiments modernes inspirés de l'identité culturelle camerounaise. Elle veut promouvoir une architecture durable et valoriser le patrimoine local.",
    bioEn:
      'Belva designs contemporary buildings inspired by Cameroonian cultural heritage. She advocates for sustainable architecture and the preservation of local craftsmanship.',
    causeFr: 'Architecture bioclimatique durable et valorisation du patrimoine bâti camerounais',
    causeEn: 'Sustainable bioclimatic architecture and preservation of Cameroonian heritage',
    mottoFr: 'Construire demain sans oublier nos racines.',
    mottoEn: 'Building tomorrow without forgetting our roots.',
    photoUrl: '/assets/aistudio/belva_2d5c7ff1.jpg',
    focalPoint: 'center 20%',
    galleryUrls: ['/assets/aistudio/belva_2d5c7ff1.jpg'],
    videoUrl: null,
    socialLinks: [],
    editionId: 'ed-20',
    status: 'eligible',
    publicVotesCount: 1,
    isDemoData: false,
  },
  {
    id: 'cand-4',
    slug: 'josephine-candidate-4',
    number: 4,
    name: 'Joséphine',
    roleFr: 'Avocate spécialisée en droits des femmes',
    roleEn: 'Women’s Rights Attorney',
    age: 26,
    isFictionalAge: false,
    region: 'Sud',
    city: 'Kribi',
    bioFr:
      "Joséphine défend les droits des femmes et accompagne les personnes victimes de discriminations. Elle souhaite faire de sa participation un moyen de sensibiliser la société à l'égalité des chances.",
    bioEn:
      'Joséphine defends women’s rights and provides legal assistance to victims of discrimination. She uses her participation to raise societal awareness around equal opportunity.',
    causeFr: 'Accès à la justice, protection juridique des femmes et égalité des chances',
    causeEn: 'Access to justice, legal protection for women, and equal opportunity',
    mottoFr: "La vraie élégance, c'est aussi le courage de défendre les autres.",
    mottoEn: 'True elegance is also the courage to stand up for others.',
    photoUrl: '/assets/aistudio/Josephine_1da2964d.jpg',
    focalPoint: 'center 20%',
    galleryUrls: ['/assets/aistudio/Josephine_1da2964d.jpg'],
    videoUrl: null,
    socialLinks: [],
    editionId: 'ed-20',
    status: 'eligible',
    publicVotesCount: 0,
    isDemoData: false,
  },
  {
    id: 'cand-5',
    slug: 'morelle-candidate-5',
    number: 5,
    name: 'Morelle',
    roleFr: 'Ingénieure en environnement',
    roleEn: 'Environmental Engineer',
    age: 24,
    isFictionalAge: false,
    region: 'Est',
    city: 'Bertoua',
    bioFr:
      'Morelle travaille sur des projets de protection des forêts, de recyclage et de sensibilisation écologique. Elle ambitionne de mobiliser les jeunes pour préserver les richesses naturelles du Cameroun.',
    bioEn:
      'Morelle leads forest conservation, recycling, and ecological education projects. She aims to mobilize youth to safeguard Cameroon’s natural biodiversity.',
    causeFr: 'Préservation du bassin forestier, économie circulaire et éducation écologique des jeunes',
    causeEn: 'Forest basin conservation, circular economy, and youth ecological education',
    mottoFr: "Protéger notre nature, c'est préserver notre avenir.",
    mottoEn: 'Protecting our nature means preserving our future.',
    photoUrl: '/assets/aistudio/morelle_40314c3d.jpg',
    focalPoint: 'center 15%',
    galleryUrls: ['/assets/aistudio/morelle_40314c3d.jpg'],
    videoUrl: null,
    socialLinks: [],
    editionId: 'ed-20',
    status: 'eligible',
    publicVotesCount: 0,
    isDemoData: false,
  },
  {
    id: 'cand-6',
    slug: 'synthia-candidate-6',
    number: 6,
    name: 'Synthia',
    roleFr: 'Journaliste et présentatrice TV',
    roleEn: 'Journalist & TV Presenter',
    age: 22,
    isFictionalAge: false,
    region: 'Nord-Ouest',
    city: 'Bamenda',
    bioFr:
      'Synthia met en lumière les talents, les traditions et les initiatives positives du Cameroun. Elle souhaite donner davantage de visibilité aux jeunes filles qui ont des projets pour leur communauté.',
    bioEn:
      'Synthia spotlights Cameroonian talents, cultural traditions, and positive community initiatives. She seeks to amplify the voices of young girls leading local impact projects.',
    causeFr: 'Médias éducatifs, rayonnement culturel et mentorat médiatique pour les jeunes filles',
    causeEn: 'Educational media, cultural heritage, and media mentorship for young girls',
    mottoFr: 'Ma voix est mon pouvoir, mon impact est mon héritage.',
    mottoEn: 'My voice is my power, my impact is my legacy.',
    photoUrl: '/assets/aistudio/synthia_bb504dc4.jpg',
    focalPoint: 'center 18%',
    galleryUrls: ['/assets/aistudio/synthia_bb504dc4.jpg'],
    videoUrl: null,
    socialLinks: [],
    editionId: 'ed-20',
    status: 'eligible',
    publicVotesCount: 0,
    isDemoData: false,
  },
];

export const INITIAL_NEWS: NewsArticle[] = [
  {
    id: 'news-1',
    slug: 'ouverture-scrutin-20e-edition',
    titleFr: 'Ouverture officielle de la période de présentation et de vote de la 20ᵉ Édition',
    titleEn: 'Official Opening of the 20th Edition Presentation and Voting Period',
    excerptFr:
      'Découvrez le calendrier officiel du 27 octobre 2026 au 1er décembre 2026 ainsi que les règles de transparence appliquées au vote du public.',
    excerptEn:
      'Discover the official schedule from October 27, 2026 to December 1, 2026 and the transparency rules governing the public vote.',
    contentFr:
      "La 20ᵉ Édition met à l'honneur six profils engagés autour de projets concrets pour la société camerounaise : entrepreneuriat féminin, santé pédiatrique, architecture durable, droits des femmes, ingénierie environnementale et journalisme citoyen.\n\nConformément au règlement de l'édition, la période de scrutin est fixée du 27 octobre 2026 au 1er décembre 2026 (fuseau Africa/Douala). Le premier vote est gratuit pour tout compte vérifié. Les modalités relatives aux votes supplémentaires payants (100 XAF à partir du 2ᵉ vote) sont soumises à l'activation d'un prestataire de paiement certifié par l'organisation.\n\nChaque vote validé par le serveur fait l'objet d'un contrôle d'idempotence et d'une journalisation d'audit afin d'assurer l'équité entre toutes les candidates.",
    contentEn:
      'The 20th Edition highlights six dedicated candidates championing concrete projects for Cameroonian society: female entrepreneurship, pediatric healthcare, sustainable architecture, women’s rights, environmental engineering, and civic journalism.\n\nIn accordance with the edition rules, the voting window runs from October 27, 2026 to December 1, 2026 (Africa/Douala timezone). The first vote is free for every verified account. Additional paid votes (100 XAF starting from the 2nd vote) require activation of a certified payment gateway by the organizing committee.\n\nEvery server-validated vote undergoes idempotency checks and audit logging to guarantee fairness across all candidates.',
    categoryFr: 'Communiqué Officiel',
    categoryEn: 'Official Release',
    publishedAt: '2026-10-27T08:00:00+01:00',
    coverUrl: '/assets/aistudio/Embl_me_dor__Miss_Beaut__Cameroun_2f1797e1.png',
    isDemoData: false,
  },
  {
    id: 'news-2',
    slug: 'engagements-sociaux-des-candidates',
    titleFr: 'Focus sur les projets sociaux portés par les 6 candidates de la 20ᵉ Édition',
    titleEn: 'Spotlight on the Social Impact Projects Led by the 6 Candidates',
    excerptFr:
      "Au-delà de l'élégance, chaque candidate défend une cause sociale mesurable au service des communautés locales.",
    excerptEn:
      'Beyond elegance, each candidate champions a measurable social cause serving local communities.',
    contentFr:
      "Le concours place le leadership intellectuel et l'engagement citoyen au cœur de ses critères d'appréciation. Cette année, les candidates présentent des initiatives structurées :\n\n• Candidate n°1 — Laure : Accompagnement entrepreneurial et indépendance financière des jeunes femmes.\n• Candidate n°2 — Nadia : Campagnes de prévention pédiatrique et santé maternelle.\n• Candidate n°3 — Belva : Architecture durable inspirée du patrimoine culturel camerounais.\n• Candidate n°4 — Joséphine : Assistance juridique et défense des droits des femmes.\n• Candidate n°5 — Morelle : Protection des forêts et éducation environnementale.\n• Candidate n°6 — Synthia : Visibilité médiatique des jeunes filles porteuses d'initiatives communautaires.\n\nNous invitons le public à consulter attentivement chaque profil avant d'exprimer son choix.",
    contentEn:
      'The pageant places intellectual leadership and civic commitment at the heart of its evaluation criteria. This year, candidates present structured initiatives:\n\n• Candidate #1 — Laure: Entrepreneurial support and financial independence for young women.\n• Candidate #2 — Nadia: Pediatric prevention campaigns and maternal healthcare.\n• Candidate #3 — Belva: Sustainable architecture inspired by Cameroonian cultural heritage.\n• Candidate #4 — Joséphine: Legal aid and defense of women’s rights.\n• Candidate #5 — Morelle: Forest conservation and environmental education.\n• Candidate #6 — Synthia: Media visibility for young women leading community projects.\n\nWe invite the public to carefully review each profile before casting their vote.',
    categoryFr: 'Projets & Impact',
    categoryEn: 'Projects & Impact',
    publishedAt: '2026-10-27T09:30:00+01:00',
    coverUrl: '/assets/aistudio/Laure_69cc1d06.jpg',
    isDemoData: false,
  },
  {
    id: 'news-3',
    slug: 'charte-integrite-et-transparence-du-vote',
    titleFr: 'Charte d’intégrité du scrutin : comment vos votes sont protégés',
    titleEn: 'Voting Integrity Charter: How Your Votes Are Protected',
    excerptFr:
      'Explication détaillée des contrôles serveur, de la vérification de compte et de la revue des anomalies.',
    excerptEn:
      'Detailed explanation of server-side controls, account verification, and anomaly review procedures.',
    contentFr:
      "Pour garantir un scrutin crédible, la plateforme applique des règles techniques strictes :\n\n1. Horloge serveur de référence : L'ouverture (27/10/2026) et la clôture (01/12/2026) sont validées côté serveur sur le fuseau Africa/Douala.\n2. Clé d'idempotence unique : En cas d'instabilité réseau mobile, une requête relancée avec la même clé ne génère jamais de doublon ni d'erreur trompeuse.\n3. Traçabilité des invalidations : Aucun vote n'est supprimé silencieusement. En cas d'anomalie avérée, seule une invalidation motivée et signée dans le journal d'audit par un administrateur habilité est possible.\n4. Limites techniques expliquées avec transparence : La vérification par e-mail atteste le contrôle d'une boîte de réception mais ne constitue pas une preuve biométrique d'identité unique.",
    contentEn:
      'To ensure a credible election, the platform enforces strict technical safeguards:\n\n1. Authoritative server clock: Opening (27/10/2026) and closing (01/12/2026) timestamps are validated server-side in the Africa/Douala timezone.\n2. Unique idempotency key: During mobile network instability, a retried request carrying the same key never creates a duplicate vote or false error.\n3. Traceable invalidations: No vote is ever silently deleted. If a verified anomaly occurs, only a reasoned invalidation logged in the audit trail by an authorized administrator is permitted.\n4. Transparent technical boundaries: Email verification confirms control of an inbox but does not constitute biometric proof of a unique physical person.',
    categoryFr: 'Règlement & Sécurité',
    categoryEn: 'Rules & Security',
    publishedAt: '2026-10-27T10:15:00+01:00',
    coverUrl: '/assets/aistudio/belva_2d5c7ff1.jpg',
    isDemoData: false,
  },
];
