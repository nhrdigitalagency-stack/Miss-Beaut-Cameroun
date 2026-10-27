import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Check, ShieldCheck, QrCode, HeartHandshake } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Candidate } from '../data/initialData';

export const CandidateProfilePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, locale, config, votingState, openVoteModal, voteSuccessTrigger } = useApp();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [showPublicVotes, setShowPublicVotes] = useState(true);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/candidates/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setCandidate(data.candidate);
        setShowPublicVotes(Boolean(data.showPublicVotes));
        setLoading(false);
      })
      .catch(() => {
        setCandidate(null);
        setLoading(false);
      });
  }, [slug, voteSuccessTrigger]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        <div className="h-[520px] rounded-3xl bg-white border border-[#EEDDE6] animate-pulse" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#21131D]">Candidate introuvable</h1>
        <p className="text-sm text-[#74636E]">
          Ce profil n'existe pas ou a été retiré de l'édition en cours.
        </p>
        <Link
          to="/candidates"
          className="inline-flex items-center gap-2 py-2.5 px-6 rounded-full bg-[#A80D55] text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.candidates.backToCatalog}</span>
        </Link>
      </div>
    );
  }

  const publicProfileUrl = `${window.location.origin}/candidates/${candidate.slug}`;
  const role = locale === 'en' ? candidate.roleEn : candidate.roleFr;
  const bio = locale === 'en' ? candidate.bioEn : candidate.bioFr;
  const cause = locale === 'en' ? candidate.causeEn : candidate.causeFr;
  const motto = locale === 'en' ? candidate.mottoEn : candidate.mottoFr;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${candidate.name} — Candidate n°0${candidate.number} (${config.contestName})`,
          text: `Découvrez le profil et le projet de ${candidate.name} (${role}) : « ${motto} »`,
          url: publicProfileUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Breadcrumb Back Link */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/candidates"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#74636E] hover:text-[#21131D] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#A80D55]" />
          <span>{t.candidates.backToCatalog}</span>
        </Link>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-white border border-[#EEDDE6] text-xs font-semibold text-[#21131D] hover:bg-[#FFF8FB] transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#A80D55]" />
              <span>{t.candidates.copiedLink}</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-[#A80D55]" />
              <span>{t.candidates.shareProfile}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Editorial Profile Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Portrait Column */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-5 bg-white rounded-3xl border border-[#EEDDE6] p-4 shadow-xs space-y-4"
        >
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#21131D]/5">
            <img
              src={candidate.photoUrl}
              alt={`${candidate.name} — Candidate n°0${candidate.number}`}
              referrerPolicy="no-referrer"
              style={{ objectPosition: candidate.focalPoint || 'center 18%' }}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="px-2 pb-1 flex items-center justify-between text-xs text-[#74636E]">
            <span>Portrait officiel</span>
            <span>{config.editionLabel}</span>
          </div>
        </motion.div>

        {/* Details & Vote Block Column */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-7 space-y-6"
        >
          {/* Identity Card */}
          <div className="bg-white rounded-3xl border border-[#EEDDE6] p-6 sm:p-8 space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#A80D55]">
                <span className="tabular-nums">
                  {t.candidates.candidateNumber}0{candidate.number}
                </span>
                <span aria-hidden="true">·</span>
                <span>Région : {candidate.region}</span>
                <span aria-hidden="true">·</span>
                <span>{candidate.city}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#74636E] font-normal tabular-nums">
                  {candidate.age} {t.candidates.fictionalAgeNote}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-[#21131D] tracking-tight">
                {candidate.name}
              </h1>
              <p className="text-base font-semibold text-[#780938]">{role}</p>
            </div>

            {/* Official Motto */}
            <div className="p-5 rounded-2xl bg-[#FFF8FB] border border-[#EEDDE6] space-y-1">
              <p className="text-xs font-semibold text-[#A80D55]">
                {t.candidates.mottoTitle}
              </p>
              <blockquote className="text-base sm:text-lg font-medium text-[#21131D] italic">
                « {motto} »
              </blockquote>
            </div>

            {/* Biography */}
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-[#21131D]">
                {t.candidates.aboutTitle}
              </h2>
              <p className="text-sm text-[#74636E] leading-relaxed">
                {bio}
              </p>
            </div>

            {/* Cause & Social Project */}
            <div className="space-y-2 pt-2 border-t border-[#EEDDE6]">
              <div className="flex items-center gap-2 text-sm font-bold text-[#21131D]">
                <HeartHandshake className="w-4 h-4 text-[#A80D55]" />
                <h2>{t.candidates.causeTitle}</h2>
              </div>
              <p className="text-sm text-[#74636E] leading-relaxed">
                {cause}
              </p>
            </div>
          </div>

          {/* Dedicated Voting Box */}
          <div className="bg-[#780938] text-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/15">
              <div>
                <p className="text-xs font-semibold text-[#D6F542]">
                  Soutenir {candidate.name} (Candidate n°0{candidate.number})
                </p>
                <h2 className="text-xl font-bold mt-0.5">
                  Vote du public — {config.editionLabel}
                </h2>
              </div>
              {showPublicVotes && (
                <div className="bg-black/25 px-4 py-2.5 rounded-2xl border border-white/10 text-right">
                  <p className="text-[11px] text-white/75">Total public validé</p>
                  <p className="text-xl font-bold text-[#D6F542] tabular-nums">
                    {candidate.publicVotesCount} {t.candidates.votesUnit}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs text-white/85">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D6F542] shrink-0" />
                <span>
                  Règle applicable : <strong>1er vote gratuit</strong> (avec compte e-mail vérifié) · Dès le 2ᵉ vote : <strong>100 XAF / vote</strong>.
                </span>
              </div>
              <p className="text-white/75">
                Période officielle : du 27/10/2026 au 01/12/2026 (Fuseau {config.timeZone}).
              </p>
            </div>

            {votingState.open && candidate.status === 'eligible' ? (
              <button
                type="button"
                onClick={() => openVoteModal(candidate)}
                className="w-full py-4 px-6 rounded-full bg-[#D6F542] hover:bg-[#c8e832] text-[#21131D] font-bold text-sm sm:text-base transition-colors cursor-pointer"
              >
                Voter pour {candidate.name} (Candidate n°0{candidate.number})
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-black/25 border border-white/15 text-xs text-white/90">
                Scrutin actuellement indisponible pour cette candidate : {votingState.messageFr}
              </div>
            )}
          </div>

          {/* Public QR Code Card (No secrets embedded) */}
          <div className="bg-white rounded-3xl border border-[#EEDDE6] p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-[#A80D55]">
                <QrCode className="w-4 h-4" />
                <span>{t.candidates.qrTitle}</span>
              </div>
              <p className="text-sm font-bold text-[#21131D]">
                Partager l'affiche ou le lien direct de {candidate.name}
              </p>
              <p className="text-xs text-[#74636E] max-w-md">
                {t.candidates.qrSubtitle}
              </p>
              <p className="text-[11px] font-mono text-[#74636E] break-all pt-1">
                {publicProfileUrl}
              </p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-[#EEDDE6] shrink-0">
              <QRCodeSVG
                value={publicProfileUrl}
                size={108}
                bgColor="#FFFFFF"
                fgColor="#21131D"
                level="M"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
