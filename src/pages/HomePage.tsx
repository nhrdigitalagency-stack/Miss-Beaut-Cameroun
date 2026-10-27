import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, ShieldCheck, CheckCircle2, HelpCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Candidate, NewsArticle } from '../data/initialData';
import { CandidateCard } from '../components/CandidateCard';

const HERO_RUNWAY_VIDEO_URL =
  '/assets/aistudio/Model_walking_runway_and_logo_1080p_20261027101154_c968f22d.mp4';

interface CountdownParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  isExpired: boolean;
}

export const HomePage: React.FC = () => {
  const { t, locale, config, votingState, voteSuccessTrigger } = useApp();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showPublicVotes, setShowPublicVotes] = useState<boolean>(true);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [countdown, setCountdown] = useState<CountdownParts>({
    days: '35',
    hours: '21',
    minutes: '00',
    seconds: '00',
    isExpired: false,
  });

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

  // Live 1-second precision countdown to December 1, 2026 (Africa/Douala)
  useEffect(() => {
    const targetIso = config.votingClosesAt || '2026-12-01T23:59:59+01:00';
    const targetMs = new Date(targetIso).getTime();

    const updateTimer = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        setCountdown({
          days: '00',
          hours: '00',
          minutes: '00',
          seconds: '00',
          isExpired: true,
        });
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setCountdown({
        days: String(d).padStart(2, '0'),
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0'),
        isExpired: false,
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [config.votingClosesAt]);

  return (
    <div className="w-full">
      {/* 1. HERO PLEIN ÉCRAN (FULL-WIDTH & FULL-HEIGHT 100VH) AVEC OPACITÉ DE SUPERPOSITION RÉDUITE */}
      <section className="relative w-full min-h-screen -mt-[76px] pt-[96px] pb-12 flex flex-col justify-between overflow-hidden bg-[#140911]">
        {/* Fullscreen Background Video (autoplay, muted, loop, playsInline) */}
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

        {/* Lighter, Reduced-Opacity Overlay so the Runway Video & Golden Emblem Shine Clearly */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-black/30 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#140911]/65 via-[#21131D]/30 to-transparent pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#140911]/75 via-transparent to-[#140911]/25 pointer-events-none"
        />

        {/* Hero Full-Width Inner Container */}
        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 xl:px-24 flex-1 flex flex-col justify-between">
          {/* Top Brand & Edition Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-[#D6F542] tracking-wide drop-shadow-sm">
              <span>{config.contestName}</span>
              <span aria-hidden="true">·</span>
              <span>{t.hero.editionKicker}</span>
            </div>

            <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
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

          {/* Center Main Headline & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="max-w-4xl my-auto py-12 space-y-6"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08] [text-wrap:balance] drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)]">
              {t.hero.title}
            </h1>

            <p className="text-base sm:text-xl text-white/95 leading-relaxed max-w-2xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              {t.hero.description}
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <Link
                to="/candidates"
                className="inline-flex items-center gap-2.5 py-4 px-8 rounded-full bg-[#D6F542] hover:bg-[#c8e832] text-[#21131D] font-bold text-sm sm:text-base transition-colors whitespace-nowrap shrink-0 shadow-lg"
              >
                <span>{t.hero.discoverBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#section-compteur"
                className="inline-flex items-center gap-2 py-4 px-7 rounded-full bg-black/35 hover:bg-black/50 backdrop-blur-md text-white border border-white/35 font-semibold text-sm sm:text-base transition-colors whitespace-nowrap shrink-0"
              >
                <span>{t.hero.howToVoteBtn}</span>
              </a>
            </div>
          </motion.div>

          {/* Bottom Scrutin Status Bar inside Fullscreen Hero */}
          <div className="pt-6 border-t border-white/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm text-white">
            <div className="flex flex-wrap items-center gap-3 drop-shadow-xs">
              <div className="flex items-center gap-2 font-semibold text-[#D6F542]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {votingState.open ? t.hero.statusVotingOpen : votingState.messageFr}
                </span>
              </div>
              <span aria-hidden="true" className="hidden sm:inline text-white/50">
                ·
              </span>
              <span>
                1er vote gratuit (compte vérifié) · Dès le 2ᵉ vote : 100 XAF
              </span>
            </div>

            <a
              href="#candidates-apercu"
              className="text-xs font-semibold text-[#D6F542] hover:underline self-start sm:self-auto drop-shadow-xs"
            >
              Voir les 6 candidates ↓
            </a>
          </div>
        </div>
      </section>

      {/* 2. SECTION COMPTEUR OFFICIELLE EN PLEINE LARGEUR (FULL-BLEED) */}
      <section id="section-compteur" className="w-full bg-[#780938] text-white border-b border-[#A80D55] py-14 sm:py-16 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="w-full space-y-10">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
            {/* Left Description */}
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#D6F542]">
                <Clock className="w-4 h-4" />
                <span>{t.countdown.kicker}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                {t.countdown.title}
              </h2>
              <p className="text-sm sm:text-base text-white/85 leading-relaxed">
                {t.countdown.subtitle}
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#F1FACB]">
                <span>{t.countdown.opensLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{t.countdown.closesLabel}</span>
              </div>
            </div>

            {/* Right 4-Unit Digital Counter (Days, Hours, Minutes, Seconds) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 shrink-0">
              <div className="bg-black/30 backdrop-blur-xs border border-white/15 rounded-3xl px-6 py-6 text-center min-w-[120px] sm:min-w-[135px]">
                <p className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#D6F542] tabular-nums tracking-tight">
                  {countdown.days}
                </p>
                <p className="text-xs sm:text-sm font-medium text-white/85 mt-2">
                  {t.countdown.days}
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-xs border border-white/15 rounded-3xl px-6 py-6 text-center min-w-[120px] sm:min-w-[135px]">
                <p className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tabular-nums tracking-tight">
                  {countdown.hours}
                </p>
                <p className="text-xs sm:text-sm font-medium text-white/85 mt-2">
                  {t.countdown.hours}
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-xs border border-white/15 rounded-3xl px-6 py-6 text-center min-w-[120px] sm:min-w-[135px]">
                <p className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tabular-nums tracking-tight">
                  {countdown.minutes}
                </p>
                <p className="text-xs sm:text-sm font-medium text-white/85 mt-2">
                  {t.countdown.minutes}
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-xs border border-[#D6F542]/45 rounded-3xl px-6 py-6 text-center min-w-[120px] sm:min-w-[135px]">
                <p className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#D6F542] tabular-nums tracking-tight">
                  {countdown.seconds}
                </p>
                <p className="text-xs sm:text-sm font-medium text-white/85 mt-2">
                  {t.countdown.seconds}
                </p>
              </div>
            </div>
          </div>

          {/* KPI Strip Full Width */}
          <div className="pt-8 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-xs sm:text-sm">
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
              <p className="text-white/75">{t.editionInfo.opensLabel}</p>
              <p className="text-lg font-bold text-white mt-1 tabular-nums">27 / 10 / 2026</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
              <p className="text-white/75">{t.editionInfo.closesLabel}</p>
              <p className="text-lg font-bold text-white mt-1 tabular-nums">01 / 12 / 2026</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
              <p className="text-white/75">{t.editionInfo.ruleLabel}</p>
              <p className="text-lg font-bold text-[#D6F542] mt-1 tabular-nums">
                1er Gratuit · 2ᵉ+ à 100 XAF
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-white/75">{t.editionInfo.candidatesLabel}</p>
                <p className="text-lg font-bold text-white mt-1 tabular-nums">
                  {candidates.length || 6} Candidates
                </p>
              </div>
              <Link
                to="/candidates"
                className="py-2.5 px-5 rounded-full bg-[#D6F542] hover:bg-[#c8e832] text-[#21131D] font-bold text-xs sm:text-sm whitespace-nowrap transition-colors"
              >
                {t.nav.voteBtn}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CANDIDATES À DÉCOUVRIR (FULL-WIDTH SECTION) */}
      <section id="candidates-apercu" className="w-full py-16 sm:py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-[#FFF8FB] space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-[#A80D55]">{config.editionLabel}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#21131D] mt-1">
              {t.candidates.catalogTitle}
            </h2>
            <p className="text-sm sm:text-base text-[#74636E] mt-1">
              {t.candidates.catalogSubtitle}
            </p>
          </div>
          <Link
            to="/candidates"
            className="inline-flex items-center gap-2 py-3 px-6 rounded-full border border-[#EEDDE6] bg-white hover:bg-[#FFF8FB] text-sm font-semibold text-[#21131D] whitespace-nowrap shrink-0 shadow-2xs"
          >
            <span>Rechercher & filtrer toutes les candidates</span>
            <ArrowRight className="w-4 h-4 text-[#A80D55]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              showPublicVotes={showPublicVotes}
            />
          ))}
        </div>
      </section>

      {/* 4. FONCTIONNEMENT DU VOTE (FULL-WIDTH SECTION) */}
      <section id="fonctionnement-vote" className="w-full bg-[#780938] text-white py-16 sm:py-20 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="w-full space-y-10">
          <div className="max-w-3xl space-y-2">
            <p className="text-xs sm:text-sm font-semibold text-[#D6F542]">
              Transparence & Sécurité Serveur
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {t.votingFlow.sectionTitle}
            </h2>
            <p className="text-sm sm:text-base text-white/85 leading-relaxed">
              {t.votingFlow.sectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-white/10 backdrop-blur-xs rounded-3xl p-7 border border-white/15 space-y-3">
              <h3 className="text-xl font-bold text-[#D6F542]">{t.votingFlow.step1Title}</h3>
              <p className="text-sm sm:text-base text-white/85 leading-relaxed">{t.votingFlow.step1Desc}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-3xl p-7 border border-white/15 space-y-3">
              <h3 className="text-xl font-bold text-[#D6F542]">{t.votingFlow.step2Title}</h3>
              <p className="text-sm sm:text-base text-white/85 leading-relaxed">{t.votingFlow.step2Desc}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-3xl p-7 border border-white/15 space-y-3">
              <h3 className="text-xl font-bold text-[#D6F542]">{t.votingFlow.step3Title}</h3>
              <p className="text-sm sm:text-base text-white/85 leading-relaxed">{t.votingFlow.step3Desc}</p>
            </div>
          </div>

          <div className="bg-black/25 rounded-3xl p-6 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#D6F542] shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                {t.votingFlow.honestyNote}
              </p>
            </div>
            <Link
              to="/reglement"
              className="py-3 px-6 rounded-full bg-[#D6F542] hover:bg-[#c8e832] text-[#21131D] text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 text-center transition-colors"
            >
              Lire le règlement complet
            </Link>
          </div>
        </div>
      </section>

      {/* 5. PRÉSENTATION DU CONCOURS & CLASSEMENT (FULL-WIDTH SECTION) */}
      <section className="w-full py-16 sm:py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-white border-y border-[#EEDDE6]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 bg-[#FFF8FB] rounded-3xl border border-[#EEDDE6] p-8 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-semibold text-[#A80D55]">
                Leadership, Culture & Impact Social
              </p>
              <h2 className="text-2xl sm:text-4xl font-bold text-[#21131D]">
                Une célébration de l'engagement féminin au Cameroun
              </h2>
              <p className="text-sm sm:text-base text-[#74636E] leading-relaxed">
                Cette 20ᵉ Édition met en avant des femmes professionnelles — entrepreneure sociale, médecin pédiatre, architecte, avocate, ingénieure en environnement et journaliste — dont les initiatives transforment durablement leur communauté.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/concours"
                className="py-3 px-6 rounded-full bg-[#A80D55] text-white text-xs sm:text-sm font-semibold hover:bg-[#780938] transition-colors"
              >
                Découvrir la vision du concours
              </Link>
              <Link
                to="/classement"
                className="py-3 px-6 rounded-full border border-[#EEDDE6] bg-white text-[#21131D] text-xs sm:text-sm font-semibold hover:bg-[#FFF8FB] transition-colors"
              >
                Consulter le classement public
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#FFF8FB] rounded-3xl border border-[#EEDDE6] p-8 sm:p-10 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#A80D55]">
                <Calendar className="w-4 h-4" />
                <span>Calendrier Officiel 2026</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#21131D]">
                Rôle du vote public & du jury
              </h3>
              <p className="text-xs sm:text-sm text-[#74636E] leading-relaxed">
                Le vote du public permet de soutenir les projets des candidates. Conformément au règlement, la première place au vote public ne désigne pas automatiquement la lauréate finale si un jury officiel intervient lors de la soirée de clôture.
              </p>
            </div>
            <div className="pt-4 border-t border-[#EEDDE6] flex items-center justify-between text-xs sm:text-sm">
              <span className="text-[#74636E]">État des résultats :</span>
              <span className="font-semibold text-[#21131D]">
                {config.publicLeaderboardEnabled ? 'Classement actif' : 'Classement masqué'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ACTUALITÉS RÉCENTES (FULL-WIDTH SECTION) */}
      <section className="w-full py-16 sm:py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-[#FFF8FB] space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-[#A80D55]">Journal de l'édition</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#21131D] mt-1">{t.nav.news}</h2>
          </div>
          <Link
            to="/actualites"
            className="text-xs sm:text-sm font-semibold text-[#A80D55] hover:underline"
          >
            Tous les articles →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {news.map((article) => (
            <Link
              key={article.id}
              to={`/actualites/${article.slug}`}
              className="group bg-white rounded-3xl border border-[#EEDDE6] p-7 flex flex-col justify-between hover:border-[#A80D55] transition-colors"
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
                <h3 className="text-lg font-bold text-[#21131D] group-hover:text-[#A80D55] transition-colors leading-snug">
                  {locale === 'en' ? article.titleEn : article.titleFr}
                </h3>
                <p className="text-xs sm:text-sm text-[#74636E] leading-relaxed line-clamp-3">
                  {locale === 'en' ? article.excerptEn : article.excerptFr}
                </p>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-[#21131D] pt-5 inline-flex items-center gap-1">
                Lire l'article <ArrowRight className="w-3.5 h-3.5 text-[#A80D55]" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. APERÇU FAQ (FULL-WIDTH SECTION) */}
      <section className="w-full py-14 sm:py-16 px-6 sm:px-10 lg:px-16 xl:px-24 bg-white border-t border-[#EEDDE6]">
        <div className="w-full bg-[#FFF8FB] rounded-3xl border border-[#EEDDE6] p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#A80D55]">
              <HelpCircle className="w-4 h-4" />
              <span>Questions fréquentes</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#21131D]">
              Une question sur la vérification de compte ou la tarification des votes ?
            </h2>
            <p className="text-xs sm:text-base text-[#74636E]">
              Consultez notre FAQ détaillée ou contactez directement le comité d'organisation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/faq"
              className="py-3.5 px-7 rounded-full bg-[#F1FACB] hover:bg-[#D6F542] text-[#21131D] text-xs sm:text-sm font-semibold transition-colors"
            >
              Consulter la FAQ
            </Link>
            <Link
              to="/contact"
              className="py-3.5 px-7 rounded-full border border-[#EEDDE6] bg-white hover:bg-[#FFF8FB] text-[#21131D] text-xs sm:text-sm font-semibold transition-colors"
            >
              Contacter l'organisation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
