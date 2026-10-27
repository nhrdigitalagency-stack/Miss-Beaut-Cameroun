import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, ShieldCheck, CheckCircle2, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Candidate, NewsArticle } from '../data/initialData';
import { CandidateCard } from '../components/CandidateCard';

const HERO_RUNWAY_VIDEO_URL =
  '/assets/aistudio/Model_walking_runway_and_logo_1080p_20261027101154_c968f22d.mp4';

export const HomePage: React.FC = () => {
  const { t, locale, config, votingState, voteSuccessTrigger } = useApp();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showPublicVotes, setShowPublicVotes] = useState<boolean>(true);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [countdownText, setCountdownText] = useState<string>('');

  useEffect(() => {
    fetch('/api/candidates?pageSize=6')
      .then((r) => r.json())
      .then((data) => {
        if (data.candidates) setCandidates(data.candidates);
        if (typeof data.showPublicVotes === 'boolean') setShowPublicVotes(data.showPublicVotes);
      })
      .catch(console.error);

    fetch('/api/news')
      .then((r) => r.json())
      .then((data) => {
        if (data.articles) setNews(data.articles.slice(0, 3));
      })
      .catch(console.error);
  }, [voteSuccessTrigger]);

  // Display countdown strictly for valid dates; opening/closing remain enforced server-side
  useEffect(() => {
    if (!config.votingClosesAt) {
      setCountdownText('Le calendrier sera annoncé prochainement');
      return;
    }

    const updateTimer = () => {
      const targetMs = new Date(config.votingClosesAt!).getTime();
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        setCountdownText('Période de vote arrivée à échéance');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      setCountdownText(`${days}j ${hours}h ${mins}m avant clôture (01/12/2026)`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30_000);
    return () => clearInterval(interval);
  }, [config.votingClosesAt]);

  return (
    <div className="space-y-20 pb-10">
      {/* 1. HERO IMMERSIF AVEC VIDÉO OFFICIELLE EN ARRIÈRE-PLAN */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="relative rounded-[2.5rem] overflow-hidden border border-[#EEDDE6] shadow-[0_24px_60px_rgb(120,9,56,0.18)] min-h-[560px] sm:min-h-[640px] flex flex-col justify-between p-6 sm:p-12 lg:p-14 bg-[#21131D]">
          {/* Background Runway & Golden Logo Video */}
          <video
            src={HERO_RUNWAY_VIDEO_URL}
            poster={config.logoUrl}
            autoPlay
            loop
            muted
            playsInline
            aria-label="Défilé officiel et emblème Miss Beauté Cameroun"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          />

          {/* Measured Contrast Scrim for WCAG AA Legibility over Video */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#21131D]/90 via-[#780938]/70 to-[#21131D]/45 pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#21131D]/90 via-transparent to-[#21131D]/35 pointer-events-none"
          />

          {/* Top Bar inside Hero over Video */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-[#D6F542]">
              <span>{config.contestName}</span>
              <span aria-hidden="true">·</span>
              <span>{t.hero.editionKicker}</span>
            </div>

            <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/15">
              <img
                src={config.logoUrl}
                alt={config.contestName}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-[#D6F542]"
              />
              <span className="text-xs font-semibold text-white">
                {config.editionLabel}
              </span>
            </div>
          </div>

          {/* Main Editorial Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 max-w-2xl my-auto py-8 space-y-6"
          >
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] [text-wrap:balance] drop-shadow-sm">
              {t.hero.title}
            </h1>

            <p className="text-base sm:text-lg text-white/90 leading-relaxed max-w-xl">
              {t.hero.description}
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/candidates"
                className="inline-flex items-center gap-2 py-3.5 px-7 rounded-full bg-[#D6F542] hover:bg-[#c8e832] text-[#21131D] font-bold text-sm transition-colors whitespace-nowrap shrink-0 shadow-md"
              >
                <span>{t.hero.discoverBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#fonctionnement-vote"
                className="inline-flex items-center gap-2 py-3.5 px-6 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/25 font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
              >
                <span>{t.hero.howToVoteBtn}</span>
              </a>
            </div>
          </motion.div>

          {/* Bottom Bar inside Hero over Video: Scrutin Status, Pricing Rule & Countdown */}
          <div className="relative z-10 pt-6 border-t border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-white">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 font-semibold text-[#D6F542]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {votingState.open ? t.hero.statusVotingOpen : votingState.messageFr}
                </span>
              </div>
              <span aria-hidden="true" className="hidden sm:inline text-white/40">
                ·
              </span>
              <span className="text-white/90">
                1er vote gratuit (compte vérifié) · Dès le 2ᵉ vote : 100 XAF
              </span>
            </div>

            <div className="text-white/90 tabular-nums font-medium bg-black/35 px-4 py-2 rounded-full border border-white/15 self-start md:self-auto">
              {countdownText}
            </div>
          </div>
        </div>

        {/* 2. INFORMATIONS CLÉS DE L'ÉDITION (Full-width 4-column strip below hero) */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#EEDDE6] p-5">
            <p className="text-xs text-[#74636E]">{t.editionInfo.opensLabel}</p>
            <p className="text-lg font-bold text-[#21131D] mt-1 tabular-nums">27 / 10 / 2026</p>
            <p className="text-xs text-[#A80D55] mt-0.5">Fuseau {config.timeZone}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#EEDDE6] p-5">
            <p className="text-xs text-[#74636E]">{t.editionInfo.closesLabel}</p>
            <p className="text-lg font-bold text-[#21131D] mt-1 tabular-nums">01 / 12 / 2026</p>
            <p className="text-xs text-[#74636E] mt-0.5">Clôture automatique serveur</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#EEDDE6] p-5">
            <p className="text-xs text-[#74636E]">{t.editionInfo.ruleLabel}</p>
            <p className="text-base font-bold text-[#21131D] mt-1 tabular-nums">
              1er Gratuit · 2ᵉ+ à 100 XAF
            </p>
            <p className="text-xs text-[#A80D55] mt-0.5">1 vote gratuit / compte vérifié</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#EEDDE6] p-5">
            <p className="text-xs text-[#74636E]">{t.editionInfo.candidatesLabel}</p>
            <p className="text-lg font-bold text-[#21131D] mt-1 tabular-nums">
              {candidates.length || 6} Candidates
            </p>
            <p className="text-xs text-[#74636E] mt-0.5">
              Base Sanity (79m8ign4) synchronisée
            </p>
          </div>
        </div>
      </section>

      {/* 3. CANDIDATES À DÉCOUVRIR */}
      <section id="candidates-apercu" className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#A80D55]">{config.editionLabel}</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#21131D] mt-1">
              {t.candidates.catalogTitle}
            </h2>
            <p className="text-sm text-[#74636E] mt-1">
              {t.candidates.catalogSubtitle}
            </p>
          </div>
          <Link
            to="/candidates"
            className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full border border-[#EEDDE6] bg-white hover:bg-[#FFF8FB] text-sm font-semibold text-[#21131D] whitespace-nowrap shrink-0"
          >
            <span>Rechercher & filtrer toutes les candidates</span>
            <ArrowRight className="w-4 h-4 text-[#A80D55]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              showPublicVotes={showPublicVotes}
            />
          ))}
        </div>
      </section>

      {/* 4. FONCTIONNEMENT DU VOTE */}
      <section id="fonctionnement-vote" className="bg-[#780938] text-white py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-10">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold text-[#D6F542]">
              Transparence & Sécurité Serveur
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t.votingFlow.sectionTitle}
            </h2>
            <p className="text-sm text-white/80 leading-relaxed">
              {t.votingFlow.sectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-xs rounded-3xl p-6 border border-white/15 space-y-3">
              <h3 className="text-lg font-bold text-[#D6F542]">{t.votingFlow.step1Title}</h3>
              <p className="text-sm text-white/85 leading-relaxed">{t.votingFlow.step1Desc}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-3xl p-6 border border-white/15 space-y-3">
              <h3 className="text-lg font-bold text-[#D6F542]">{t.votingFlow.step2Title}</h3>
              <p className="text-sm text-white/85 leading-relaxed">{t.votingFlow.step2Desc}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-3xl p-6 border border-white/15 space-y-3">
              <h3 className="text-lg font-bold text-[#D6F542]">{t.votingFlow.step3Title}</h3>
              <p className="text-sm text-white/85 leading-relaxed">{t.votingFlow.step3Desc}</p>
            </div>
          </div>

          <div className="bg-black/25 rounded-2xl p-5 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#D6F542] shrink-0 mt-0.5" />
              <p className="text-xs text-white/85 leading-relaxed">
                {t.votingFlow.honestyNote}
              </p>
            </div>
            <Link
              to="/reglement"
              className="py-2.5 px-5 rounded-full bg-[#D6F542] text-[#21131D] text-xs font-semibold whitespace-nowrap shrink-0 text-center"
            >
              Lire le règlement complet
            </Link>
          </div>
        </div>
      </section>

      {/* 5. PRÉSENTATION DU CONCOURS & CLASSEMENT */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#EEDDE6] p-7 sm:p-9 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#A80D55]">
                Leadership, Culture & Impact Social
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#21131D]">
                Une célébration de l'engagement féminin au Cameroun
              </h2>
              <p className="text-sm text-[#74636E] leading-relaxed">
                Cette 20ᵉ Édition met en avant des femmes professionnelles — entrepreneure sociale, médecin pédiatre, architecte, avocate, ingénieure en environnement et journaliste — dont les initiatives transforment durablement leur communauté.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/concours"
                className="py-2.5 px-5 rounded-full bg-[#A80D55] text-white text-xs sm:text-sm font-semibold hover:bg-[#780938] transition-colors"
              >
                Découvrir la vision du concours
              </Link>
              <Link
                to="/classement"
                className="py-2.5 px-5 rounded-full border border-[#EEDDE6] text-[#21131D] text-xs sm:text-sm font-semibold hover:bg-[#FFF8FB] transition-colors"
              >
                Consulter le classement public
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#EEDDE6] p-7 sm:p-9 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#A80D55]">
                <Calendar className="w-4 h-4" />
                <span>Calendrier Officiel 2026</span>
              </div>
              <h3 className="text-xl font-bold text-[#21131D]">
                Rôle du vote public & du jury
              </h3>
              <p className="text-xs text-[#74636E] leading-relaxed">
                Le vote du public permet de soutenir les projets des candidates. Conformément au règlement, la première place au vote public ne désigne pas automatiquement la lauréate finale si un jury officiel intervient lors de la soirée de clôture.
              </p>
            </div>
            <div className="pt-3 border-t border-[#EEDDE6] flex items-center justify-between text-xs">
              <span className="text-[#74636E]">État des résultats :</span>
              <span className="font-semibold text-[#21131D]">
                {config.publicLeaderboardEnabled ? 'Classement provisoire actif' : 'Classement masqué'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ACTUALITÉS RÉCENTES */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#A80D55]">Journal de l'édition</p>
            <h2 className="text-2xl font-bold text-[#21131D] mt-1">{t.nav.news}</h2>
          </div>
          <Link
            to="/actualites"
            className="text-xs sm:text-sm font-semibold text-[#A80D55] hover:underline"
          >
            Tous les articles →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map((article) => (
            <Link
              key={article.id}
              to={`/actualites/${article.slug}`}
              className="group bg-white rounded-3xl border border-[#EEDDE6] p-6 flex flex-col justify-between hover:border-[#A80D55] transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-[#74636E]">
                  <span className="font-semibold text-[#A80D55]">
                    {locale === 'en' ? article.categoryEn : article.categoryFr}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {new Date(article.publishedAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#21131D] group-hover:text-[#A80D55] transition-colors leading-snug">
                  {locale === 'en' ? article.titleEn : article.titleFr}
                </h3>
                <p className="text-xs text-[#74636E] leading-relaxed line-clamp-3">
                  {locale === 'en' ? article.excerptEn : article.excerptFr}
                </p>
              </div>
              <span className="text-xs font-semibold text-[#21131D] pt-4 inline-flex items-center gap-1">
                Lire l'article <ArrowRight className="w-3.5 h-3.5 text-[#A80D55]" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. APERÇU FAQ */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-[#EEDDE6] p-7 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#A80D55]">
              <HelpCircle className="w-4 h-4" />
              <span>Questions fréquentes</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#21131D]">
              Une question sur la vérification de compte ou la tarification des votes ?
            </h2>
            <p className="text-xs sm:text-sm text-[#74636E]">
              Consultez notre FAQ détaillée ou contactez directement le comité d'organisation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/faq"
              className="py-3 px-6 rounded-full bg-[#F1FACB] hover:bg-[#D6F542] text-[#21131D] text-xs sm:text-sm font-semibold transition-colors"
            >
              Consulter la FAQ
            </Link>
            <Link
              to="/contact"
              className="py-3 px-6 rounded-full border border-[#EEDDE6] hover:bg-[#FFF8FB] text-[#21131D] text-xs sm:text-sm font-semibold transition-colors"
            >
              Contacter l'organisation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
