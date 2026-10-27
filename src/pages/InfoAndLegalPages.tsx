import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldCheck, ChevronDown, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NewsArticle } from '../data/initialData';

// 1. LE CONCOURS (/concours)
export const ContestPage: React.FC = () => {
  const { config, t } = useApp();

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      <div className="bg-white rounded-3xl border border-[#EEDDE6] p-7 sm:p-10 space-y-6">
        <div className="flex items-center gap-3">
          <img
            src={config.logoUrl}
            alt={config.contestName}
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-full object-cover border border-[#EEDDE6]"
          />
          <div>
            <p className="text-xs font-semibold text-[#A80D55]">
              {config.editionLabel} · Nom de travail : « {config.alternateWorkName} »
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#21131D]">
              Présentation du concours {config.contestName}
            </h1>
          </div>
        </div>

        <p className="text-sm sm:text-base text-[#74636E] leading-relaxed">
          {config.contestName} ({config.editionLabel}) est une plateforme dédiée à la mise en valeur de l'ambition intellectuelle, du leadership communautaire et de l'élégance culturelle au Cameroun. Chaque candidate porte un projet social concret répondant aux enjeux contemporains : entrepreneuriat féminin, santé pédiatrique, architecture durable, droits des femmes, protection de l'environnement et médias éducatifs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-5 rounded-2xl bg-[#FFF8FB] border border-[#EEDDE6] space-y-1.5">
            <p className="text-xs font-semibold text-[#A80D55]">Période officielle</p>
            <p className="text-sm font-bold text-[#21131D] tabular-nums">
              Du 27/10/2026 au 01/12/2026
            </p>
            <p className="text-xs text-[#74636E]">Fuseau de référence : {config.timeZone}</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#FFF8FB] border border-[#EEDDE6] space-y-1.5">
            <p className="text-xs font-semibold text-[#A80D55]">Modèle de vote</p>
            <p className="text-sm font-bold text-[#21131D]">1er vote gratuit vérifié</p>
            <p className="text-xs text-[#74636E]">Dès le 2ᵉ vote : 100 XAF / vote</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#FFF8FB] border border-[#EEDDE6] space-y-1.5">
            <p className="text-xs font-semibold text-[#A80D55]">Cadre éditorial</p>
            <p className="text-sm font-bold text-[#21131D]">Respect & Dignité</p>
            <p className="text-xs text-[#74636E]">Aucun critère discriminatoire ou dévalorisant</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-[#74636E] space-y-1.5">
          <p className="font-semibold text-[#21131D]">Mention de transparence institutionnelle</p>
          <p>
            Le nom « {config.alternateWorkName} » / « {config.contestName} » est configuré comme identité de travail. Cette plateforme n'invente aucun sponsor, aucune certification extérieure ni aucun partenariat institutionnel non validé.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            to="/candidates"
            className="py-3 px-6 rounded-full bg-[#A80D55] text-white text-xs sm:text-sm font-semibold"
          >
            {t.hero.discoverBtn}
          </Link>
          <Link
            to="/reglement"
            className="py-3 px-6 rounded-full border border-[#EEDDE6] text-[#21131D] text-xs sm:text-sm font-semibold hover:bg-[#FFF8FB]"
          >
            Consulter le règlement officiel
          </Link>
        </div>
      </div>
    </div>
  );
};

// 2. RÈGLEMENT DU VOTE (/reglement)
export const RulesPage: React.FC = () => {
  const { config } = useApp();

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="bg-white rounded-3xl border border-[#EEDDE6] p-7 sm:p-10 space-y-6">
        <div className="space-y-2 border-b border-[#EEDDE6] pb-6">
          <p className="text-xs font-semibold text-[#A80D55]">
            Document réglementaire configurable — {config.editionLabel}
          </p>
          <h1 className="text-3xl font-bold text-[#21131D]">
            Règlement du Scrutin et Charte d'Intégrité
          </h1>
          <p className="text-xs text-[#74636E]">
            Ce document présente les règles techniques et organisationnelles appliquées par le serveur pour l'édition du 27/10/2026 au 01/12/2026 (à faire valider par l'organisateur avant ouverture en production).
          </p>
        </div>

        <div className="space-y-6 text-sm text-[#21131D] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#A80D55]">
              Article 1 — Période du scrutin et horloge de référence
            </h2>
            <p className="text-[#74636E]">
              Le vote est ouvert du <strong>27 octobre 2026 à 00h00</strong> au{' '}
              <strong>1er décembre 2026 à 23h59</strong> (fuseau horaire <code>Africa/Douala</code>). L'ouverture et la clôture sont contrôlées exclusivement par l'horloge du serveur. Le compte à rebours affiché dans le navigateur a une valeur purement informative.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#A80D55]">
              Article 2 — Conditions d'éligibilité des votants et tarification
            </h2>
            <p className="text-[#74636E]">
              Pour la 20ᵉ Édition, la règle tarifaire et de limite est fixée comme suit :
            </p>
            <ul className="list-disc pl-5 text-[#74636E] space-y-1">
              <li>
                <strong>1er vote gratuit (0 XAF)</strong> : accordé à tout utilisateur disposant d'un compte avec adresse e-mail vérifiée (1 vote gratuit valide par compte vérifié sur l'édition).
              </li>
              <li>
                <strong>À partir du 2ᵉ vote (100 XAF / vote)</strong> : les votes supplémentaires sont tarifés à 100 XAF par vote. Cette option demeure désactivée par sécurité tant que le prestataire de paiement, le rapprochement par webhook signé et les conditions de remboursement ne sont pas formellement activés par l'organisation.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#A80D55]">
              Article 3 — Portée de la vérification de compte
            </h2>
            <p className="text-[#74636E]">
              Un compte vérifié par e-mail confirme l'accès à une boîte de réception électronique valide mais ne constitue pas une preuve biométrique ou légale d'identité physique unique. La plateforme n'affirme donc jamais « une personne physique = un vote » sur la seule base d'un e-mail, et combine cette vérification avec des contrôles de débit et une revue d'audit.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#A80D55]">
              Article 4 — Rôle du vote public, du jury et règles d'égalité
            </h2>
            <p className="text-[#74636E]">
              La candidate arrivée en tête du vote public n'est pas automatiquement proclamée gagnante finale si le règlement général de la soirée finale prévoit l'intervention d'un jury officiel. En cas d'égalité de voix dans le classement public, les candidates ex æquo partagent le même rang tant qu'aucune règle officielle de départage n'est appliquée.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#A80D55]">
              Article 5 — Intégrité serveur, idempotence et invalidations tracées
            </h2>
            <p className="text-[#74636E]">
              Chaque requête de vote est protégée par une clé d'idempotence unique empêchant tout double enregistrement lors d'une coupure réseau. Aucun vote n'est jamais supprimé silencieusement : en cas d'anomalie technique ou de fraude caractérisée, seule une invalidation motivée, horodatée et rattachée à un administrateur habilité dans le journal d'audit est autorisée.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

// 3. ACTUALITÉS (/actualites & /actualites/:slug)
export const NewsListPage: React.FC = () => {
  const { locale, t } = useApp();
  const [articles, setArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    fetch('/api/news')
      .then((r) => r.json())
      .then((d) => setArticles(d.articles || []))
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#A80D55]">Communiqués & Annonces</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#21131D]">{t.nav.news}</h1>
      </div>

      <div className="space-y-5">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={`/actualites/${article.slug}`}
            className="block bg-white rounded-3xl border border-[#EEDDE6] p-6 sm:p-8 hover:border-[#A80D55] transition-colors space-y-3"
          >
            <div className="flex items-center gap-2 text-xs text-[#74636E]">
              <span className="font-semibold text-[#A80D55]">
                {locale === 'en' ? article.categoryEn : article.categoryFr}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {new Date(article.publishedAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR')}
              </span>
              <span aria-hidden="true">·</span>
              <span>{t.banner.demoBadge}</span>
            </div>
            <h2 className="text-xl font-bold text-[#21131D]">
              {locale === 'en' ? article.titleEn : article.titleFr}
            </h2>
            <p className="text-sm text-[#74636E] leading-relaxed">
              {locale === 'en' ? article.excerptEn : article.excerptFr}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export const NewsDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { locale, t } = useApp();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/news/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setArticle(d?.article || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-12">
        <div className="h-64 bg-white rounded-3xl border border-[#EEDDE6] animate-pulse" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#21131D]">Article introuvable</h1>
        <Link
          to="/actualites"
          className="inline-flex items-center gap-2 py-2.5 px-6 rounded-full bg-[#A80D55] text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux actualités</span>
        </Link>
      </div>
    );
  }

  const content = locale === 'en' ? article.contentEn : article.contentFr;

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <Link
        to="/actualites"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#74636E] hover:text-[#21131D]"
      >
        <ArrowLeft className="w-4 h-4 text-[#A80D55]" />
        <span>Retour aux actualités</span>
      </Link>

      <article className="bg-white rounded-3xl border border-[#EEDDE6] p-7 sm:p-10 space-y-6">
        <div className="space-y-2 border-b border-[#EEDDE6] pb-6">
          <div className="flex items-center gap-2 text-xs text-[#74636E]">
            <span className="font-semibold text-[#A80D55]">
              {locale === 'en' ? article.categoryEn : article.categoryFr}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {new Date(article.publishedAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR')}
            </span>
            <span aria-hidden="true">·</span>
            <span>{t.banner.demoBadge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#21131D] leading-snug">
            {locale === 'en' ? article.titleEn : article.titleFr}
          </h1>
        </div>

        <div className="space-y-4 text-sm sm:text-base text-[#21131D] leading-relaxed whitespace-pre-line">
          {content}
        </div>
      </article>
    </div>
  );
};

// 4. FAQ (/faq)
export const FaqPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Comment fonctionne la règle du 1er vote gratuit et des votes suivants à 100 XAF ?',
      a: "Pour la 20ᵉ Édition, chaque électeur disposant d'un compte avec adresse e-mail vérifiée bénéficie d'un (1) premier vote gratuit (0 XAF). À partir du 2ᵉ vote, le tarif unitaire est fixé à 100 XAF par vote. Tant que le prestataire de paiement n'est pas activé en production par l'organisation, l'option de paiement reste verrouillée et aucun prélèvement ni faux paiement n'est effectué.",
    },
    {
      q: 'Quelles sont les dates d’ouverture et de clôture du vote ?',
      a: "Le scrutin est programmé du 27 octobre 2026 à 00h00 au 1er décembre 2026 à 23h59 sur le fuseau horaire Africa/Douala. L'horloge du serveur fait foi pour bloquer automatiquement tout vote avant l'ouverture ou après la clôture.",
    },
    {
      q: 'Que se passe-t-il si ma connexion mobile coupe au moment de voter ?',
      a: "Chaque tentative de vote génère une clé d'idempotence unique. Si votre réseau mobile subit une coupure (timeout), la plateforme interroge d'abord le serveur avec cette clé pour vérifier si votre vote a bien été enregistré, évitant ainsi tout doublon ou message d'erreur trompeur.",
    },
    {
      q: 'La candidate première au classement public est-elle automatiquement élue Miss ?',
      a: "Non, sauf mention expresse contraire dans le règlement final validé. Le vote du public soutient les candidates selon les modalités définies par l'organisation, qui peut inclure l'évaluation d'un jury officiel lors de la cérémonie finale.",
    },
    {
      q: 'Mes données personnelles (e-mail) sont-elles visibles publiquement ?',
      a: "Jamais. Les adresses e-mail des votants sont strictement isolées côté serveur et ne sont jamais exposées dans les API publiques ni dans le classement.",
    },
  ];

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#A80D55]">Assistance & Transparence</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#21131D]">
          Questions Fréquentes (FAQ)
        </h1>
      </div>

      <div className="space-y-3">
        {faqs.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#EEDDE6] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#21131D] hover:bg-[#FFF8FB] transition-colors cursor-pointer"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#A80D55] shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-[#74636E] leading-relaxed border-t border-[#EEDDE6] pt-4">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 5. CONTACT & SIGNALEMENT (/contact)
export const ContactPage: React.FC = () => {
  const { config } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submittedRef, setSubmittedRef] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmittedRef('');
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, category, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de l’envoi.');
      } else {
        setSubmittedRef(data.reference);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="bg-white rounded-3xl border border-[#EEDDE6] p-7 sm:p-10 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#A80D55]">{config.contestName}</p>
          <h1 className="text-3xl font-bold text-[#21131D]">
            Contacter l'organisation ou signaler une anomalie
          </h1>
          <p className="text-xs sm:text-sm text-[#74636E]">
            Utilisez ce formulaire pour toute question relative au règlement, signalement technique ou demande de suppression de vos données personnelles.
          </p>
        </div>

        {submittedRef && (
          <div className="p-4 rounded-2xl bg-[#F1FACB] border border-[#D6F542] text-xs sm:text-sm text-[#21131D] flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#A80D55]" />
            <span>
              Votre demande a bien été enregistrée côté serveur (Référence : {submittedRef}).
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="c-name" className="block text-xs font-semibold text-[#21131D] mb-1.5">
                Nom complet
              </label>
              <input
                id="c-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-[#EEDDE6] bg-[#FFF8FB] text-sm"
              />
            </div>
            <div>
              <label htmlFor="c-email" className="block text-xs font-semibold text-[#21131D] mb-1.5">
                Adresse e-mail
              </label>
              <input
                id="c-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-[#EEDDE6] bg-[#FFF8FB] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="c-cat" className="block text-xs font-semibold text-[#21131D] mb-1.5">
                Nature de la demande
              </label>
              <select
                id="c-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-[#EEDDE6] bg-[#FFF8FB] text-sm"
              >
                <option value="general">Question générale sur le concours</option>
                <option value="anomaly">Signalement d'anomalie sur le scrutin</option>
                <option value="privacy">Demande de suppression de données personnelles</option>
                <option value="press">Presse & Médias</option>
              </select>
            </div>
            <div>
              <label htmlFor="c-sub" className="block text-xs font-semibold text-[#21131D] mb-1.5">
                Objet
              </label>
              <input
                id="c-sub"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-[#EEDDE6] bg-[#FFF8FB] text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="c-msg" className="block text-xs font-semibold text-[#21131D] mb-1.5">
              Message détaillé (minimum 10 caractères)
            </label>
            <textarea
              id="c-msg"
              rows={4}
              required
              minLength={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-[#EEDDE6] bg-[#FFF8FB] text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 py-3.5 px-7 rounded-full bg-[#A80D55] hover:bg-[#780938] text-white text-xs sm:text-sm font-semibold cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Envoi en cours...' : 'Envoyer la demande'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

// 6. POLITIQUE DE CONFIDENTIALITÉ (/confidentialite)
export const PrivacyPage: React.FC = () => {
  const { config } = useApp();

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-[#EEDDE6] p-7 sm:p-10 space-y-6">
        <div className="space-y-1 border-b border-[#EEDDE6] pb-5">
          <p className="text-xs font-semibold text-[#A80D55]">Protection des données</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#21131D]">
            Politique de Confidentialité (Modèle à valider par l'organisateur)
          </h1>
        </div>
        <div className="space-y-4 text-xs sm:text-sm text-[#74636E] leading-relaxed">
          <p>
            <strong>1. Minimisation des données collectées :</strong> La plateforme collecte uniquement les informations strictement nécessaires à la vérification du droit de vote (adresse e-mail, nom d'affichage et empreinte d'idempotence). Aucun numéro personnel, adresse privée ou document d'identité des candidates n'est publié.
          </p>
          <p>
            <strong>2. Isolation des données des votants :</strong> Les adresses e-mail des votants ne sont jamais exposées dans les réponses API publiques. Dans l'interface de modération, les identifiants des votants sont pseudonymisés par hachage SHA-256.
          </p>
          <p>
            <strong>3. Durée de conservation configurable :</strong> Les données techniques de vote et les journaux d'audit sont conservés pour une durée configurée à <strong>{config.dataRetentionDays} jours</strong> après la publication officielle des résultats, puis purgés ou anonymisés.
          </p>
          <p>
            <strong>4. Droit d'accès et de suppression :</strong> Tout utilisateur peut solliciter la suppression de son compte via la page <Link to="/contact" className="text-[#A80D55] underline">Contact & Signalement</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

// 7. CONDITIONS D'UTILISATION (/conditions)
export const TermsPage: React.FC = () => {
  const { config } = useApp();

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-[#EEDDE6] p-7 sm:p-10 space-y-6">
        <div className="space-y-1 border-b border-[#EEDDE6] pb-5">
          <p className="text-xs font-semibold text-[#A80D55]">Cadre d'utilisation</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#21131D]">
            Conditions Générales d'Utilisation ({config.contestName})
          </h1>
        </div>
        <div className="space-y-4 text-xs sm:text-sm text-[#74636E] leading-relaxed">
          <p>
            <strong>1. Objet de la plateforme :</strong> Ce site permet de consulter les profils des candidates de la {config.editionLabel} et de participer au vote selon le règlement en vigueur.
          </p>
          <p>
            <strong>2. Comportement et respect des candidates :</strong> Aucun espace de commentaire public anonyme n'est ouvert afin de prévenir tout propos dévalorisant ou harcèlement. Toute tentative d'automatisation de votes (scripts, bots) entraîne l'invalidation motivée des votes concernés.
          </p>
          <p>
            <strong>3. Sécurité des moyens de paiement :</strong> La plateforme ne demande jamais de code PIN Mobile Money ni de mot de passe de portefeuille électronique.
          </p>
        </div>
      </div>
    </div>
  );
};

// 8. PAGE 404 SOIGNÉE
export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-[700px] mx-auto px-4 py-20 text-center space-y-5">
      <p className="text-xs font-bold text-[#A80D55] tracking-widest">ERREUR 404</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#21131D]">
        Cette page n'existe pas ou a été déplacée
      </h1>
      <p className="text-sm text-[#74636E]">
        Revenez à l'accueil ou explorez directement le catalogue des 6 candidates de la 20ᵉ Édition.
      </p>
      <div className="flex items-center justify-center gap-3 pt-2">
        <Link
          to="/"
          className="py-3 px-6 rounded-full bg-[#A80D55] text-white text-xs sm:text-sm font-semibold"
        >
          Retour à l'accueil
        </Link>
        <Link
          to="/candidates"
          className="py-3 px-6 rounded-full bg-[#D6F542] text-[#21131D] text-xs sm:text-sm font-semibold"
        >
          Voir les candidates
        </Link>
      </div>
    </div>
  );
};
