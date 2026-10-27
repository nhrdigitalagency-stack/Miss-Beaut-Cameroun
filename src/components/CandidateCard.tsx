import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Candidate } from '../data/initialData';
import { useApp } from '../context/AppContext';

interface CandidateCardProps {
  candidate: Candidate;
  showPublicVotes: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, showPublicVotes }) => {
  const { t, locale, votingState, openVoteModal } = useApp();

  const role = locale === 'en' ? candidate.roleEn : candidate.roleFr;
  const motto = locale === 'en' ? candidate.mottoEn : candidate.mottoFr;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group bg-white rounded-3xl border border-[#EEDDE6] overflow-hidden flex flex-col justify-between transition-shadow hover:shadow-[0_12px_32px_rgb(168,13,85,0.08)]"
    >
      <div>
        {/* Portrait Container with Configurable Focal Point to never cut off faces */}
        <Link
          to={`/candidates/${candidate.slug}`}
          className="block relative aspect-[3/4] bg-[#21131D]/5 overflow-hidden focus-visible:outline-2 focus-visible:outline-[#A80D55]"
        >
          <img
            src={candidate.photoUrl}
            alt={`${candidate.name} — ${t.candidates.candidateNumber}${candidate.number}`}
            referrerPolicy="no-referrer"
            loading="lazy"
            style={{ objectPosition: candidate.focalPoint || 'center 18%' }}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#21131D]/85 via-[#21131D]/35 to-transparent flex items-end p-4">
            <div className="text-white">
              <p className="text-xs font-medium text-[#D6F542] tabular-nums">
                {t.candidates.candidateNumber}0{candidate.number} · {candidate.region}
              </p>
              <h3 className="text-xl font-bold tracking-tight leading-snug">
                {candidate.name}
              </h3>
            </div>
          </div>
        </Link>

        {/* Editorial Body */}
        <div className="p-5 space-y-2.5">
          {/* Unboxed clean metadata with typographic separators */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#74636E]">
            <span className="font-medium text-[#A80D55]">{role}</span>
            <span aria-hidden="true">·</span>
            <span>{candidate.city}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{candidate.age} {t.candidates.fictionalAgeNote}</span>
          </div>

          <p className="text-sm text-[#21131D] italic leading-relaxed line-clamp-2">
            « {motto} »
          </p>

          {showPublicVotes && (
            <p className="text-xs font-medium text-[#74636E] pt-1 tabular-nums">
              Total public : <strong className="text-[#21131D]">{candidate.publicVotesCount}</strong>{' '}
              {t.candidates.votesUnit}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-5 pb-5 pt-2 flex items-center gap-2.5">
        <Link
          to={`/candidates/${candidate.slug}`}
          className="flex-1 py-2.5 px-4 rounded-full border border-[#EEDDE6] text-[#21131D] hover:bg-[#FFF8FB] text-xs sm:text-sm font-medium text-center transition-colors whitespace-nowrap shrink-0"
        >
          {t.candidates.viewProfile}
        </Link>
        {votingState.open && candidate.status === 'eligible' && (
          <button
            type="button"
            onClick={() => openVoteModal(candidate)}
            className="py-2.5 px-5 rounded-full bg-[#D6F542] hover:bg-[#c8e832] text-[#21131D] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.candidates.voteAction}
          </button>
        )}
      </div>
    </motion.article>
  );
};
