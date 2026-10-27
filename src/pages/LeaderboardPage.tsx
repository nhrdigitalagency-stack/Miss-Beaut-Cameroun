import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, EyeOff, Info, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

interface LeaderboardEntry {
  id: string;
  slug: string;
  number: number;
  name: string;
  region: string;
  city: string;
  roleFr: string;
  roleEn: string;
  photoUrl: string;
  focalPoint: string;
  votes: number;
  rank: number;
  isTied: boolean;
}

export const LeaderboardPage: React.FC = () => {
  const { t, locale, config, voteSuccessTrigger } = useApp();
  const [enabled, setEnabled] = useState<boolean>(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [hasTies, setHasTies] = useState<boolean>(false);
  const [isOfficial, setIsOfficial] = useState<boolean>(false);
  const [serverTimeIso, setServerTimeIso] = useState<string>('');
  const [totalValidVotes, setTotalValidVotes] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setEnabled(Boolean(data.enabled));
      setEntries(data.entries || []);
      setHasTies(Boolean(data.hasTies));
      setIsOfficial(Boolean(data.isOfficial));
      setServerTimeIso(data.serverTimeIso || new Date().toISOString());
      setTotalValidVotes(data.totalValidVotes || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard, voteSuccessTrigger]);

  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-10 sm:py-14 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#A80D55]">
            <span>{config.contestName}</span>
            <span aria-hidden="true">·</span>
            <span>{config.editionLabel}</span>
            <span aria-hidden="true">·</span>
            <span>
              {isOfficial ? t.leaderboard.officialBadge : t.leaderboard.provisionalBadge}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#21131D] tracking-tight">
            {t.leaderboard.title}
          </h1>
          <p className="text-sm text-[#74636E]">{t.leaderboard.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {serverTimeIso && (
            <span className="text-xs text-[#74636E] tabular-nums">
              {t.leaderboard.lastUpdated} :{' '}
              {new Date(serverTimeIso).toLocaleTimeString(locale === 'en' ? 'en-GB' : 'fr-FR')}
            </span>
          )}
          <button
            type="button"
            onClick={fetchLeaderboard}
            disabled={loading}
            className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-full bg-white border border-[#EEDDE6] text-xs font-semibold text-[#21131D] hover:bg-[#FFF8FB] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#A80D55] ${loading ? 'animate-spin' : ''}`} />
            <span>{t.leaderboard.refreshBtn}</span>
          </button>
        </div>
      </div>

      {/* Hidden State if Organization Disabled Public Leaderboard */}
      {!enabled ? (
        <div className="bg-white rounded-3xl border border-[#EEDDE6] p-10 sm:p-14 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FFF8FB] border border-[#EEDDE6] flex items-center justify-center mx-auto text-[#A80D55]">
            <EyeOff className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#21131D]">
            {t.leaderboard.hiddenTitle}
          </h2>
          <p className="text-sm text-[#74636E] leading-relaxed">
            {t.leaderboard.hiddenDesc}
          </p>
          <div className="pt-2">
            <Link
              to="/candidates"
              className="inline-flex items-center justify-center py-3 px-6 rounded-full bg-[#A80D55] text-white text-xs sm:text-sm font-semibold"
            >
              Découvrir et soutenir les candidates
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Regulatory & Tie Disclaimers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#EEDDE6] p-4 flex items-start gap-3 text-xs text-[#74636E]">
              <Info className="w-4 h-4 text-[#A80D55] shrink-0 mt-0.5" />
              <p>{t.leaderboard.juryDisclaimer}</p>
            </div>
            {hasTies && (
              <div className="bg-[#FFF8FB] rounded-2xl border border-[#EEDDE6] p-4 flex items-start gap-3 text-xs text-[#21131D]">
                <ShieldAlert className="w-4 h-4 text-[#A80D55] shrink-0 mt-0.5" />
                <p>{t.leaderboard.tieNotice}</p>
              </div>
            )}
          </div>

          {/* Sober Editorial Podium (Top 3) */}
          {entries.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {entries.slice(0, 3).map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  className={`rounded-3xl border p-6 flex flex-col justify-between ${
                    item.rank === 1
                      ? 'bg-[#780938] text-white border-[#A80D55]'
                      : 'bg-white text-[#21131D] border-[#EEDDE6]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-4">
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        item.rank === 1 ? 'text-[#D6F542]' : 'text-[#A80D55]'
                      }`}
                    >
                      Rang #{item.rank} {item.isTied ? '(Égalité)' : ''}
                    </span>
                    <span
                      className={`text-xs tabular-nums ${
                        item.rank === 1 ? 'text-white/80' : 'text-[#74636E]'
                      }`}
                    >
                      Candidate n°0{item.number}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 my-2">
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      style={{ objectPosition: item.focalPoint }}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-[#EEDDE6]"
                    />
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold truncate">{item.name}</h2>
                      <p
                        className={`text-xs truncate ${
                          item.rank === 1 ? 'text-white/80' : 'text-[#74636E]'
                        }`}
                      >
                        {locale === 'en' ? item.roleEn : item.roleFr} · {item.region}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-5 pt-4 border-t flex items-center justify-between ${
                      item.rank === 1 ? 'border-white/15' : 'border-[#EEDDE6]'
                    }`}
                  >
                    <div>
                      <p
                        className={`text-[11px] ${
                          item.rank === 1 ? 'text-white/75' : 'text-[#74636E]'
                        }`}
                      >
                        {t.leaderboard.votes}
                      </p>
                      <p
                        className={`text-xl font-bold tabular-nums ${
                          item.rank === 1 ? 'text-[#D6F542]' : 'text-[#21131D]'
                        }`}
                      >
                        {item.votes}
                      </p>
                    </div>
                    <Link
                      to={`/candidates/${item.slug}`}
                      className={`py-2 px-4 rounded-full text-xs font-semibold ${
                        item.rank === 1
                          ? 'bg-[#D6F542] text-[#21131D]'
                          : 'bg-[#FFF8FB] border border-[#EEDDE6] text-[#21131D]'
                      }`}
                    >
                      Profil
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Full Table List */}
          <div className="bg-white rounded-3xl border border-[#EEDDE6] overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-[#EEDDE6] flex items-center justify-between text-xs text-[#74636E]">
              <span>Classement complet des candidates éligibles</span>
              <span className="tabular-nums font-semibold text-[#21131D]">
                Total cumulé des votes valides : {totalValidVotes}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EEDDE6] text-xs font-semibold text-[#74636E] bg-[#FFF8FB]">
                    <th className="py-3.5 px-6">{t.leaderboard.rank}</th>
                    <th className="py-3.5 px-6">N°</th>
                    <th className="py-3.5 px-6">{t.leaderboard.candidate}</th>
                    <th className="py-3.5 px-6">Région & Profession</th>
                    <th className="py-3.5 px-6 text-right">{t.leaderboard.votes}</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEDDE6] text-sm">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[#FFF8FB]/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-[#21131D] tabular-nums">
                        #{entry.rank}{' '}
                        {entry.isTied && (
                          <span className="text-xs font-normal text-[#74636E]">(ex æquo)</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-semibold text-[#A80D55] tabular-nums">
                        0{entry.number}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={entry.photoUrl}
                            alt={entry.name}
                            referrerPolicy="no-referrer"
                            style={{ objectPosition: entry.focalPoint }}
                            className="w-10 h-10 rounded-full object-cover border border-[#EEDDE6] shrink-0"
                          />
                          <span className="font-bold text-[#21131D]">{entry.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-[#74636E]">
                        {entry.region} · {locale === 'en' ? entry.roleEn : entry.roleFr}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-[#21131D] tabular-nums">
                        {entry.votes}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/candidates/${entry.slug}`}
                          className="inline-flex py-1.5 px-4 rounded-full border border-[#EEDDE6] text-xs font-semibold text-[#21131D] hover:bg-[#FFF8FB]"
                        >
                          Voir profil
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
