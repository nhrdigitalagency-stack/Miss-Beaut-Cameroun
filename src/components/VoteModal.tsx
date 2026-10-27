import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, AlertCircle, ShieldCheck, Lock, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

export const VoteModal: React.FC = () => {
  const {
    activeVoteCandidate,
    closeVoteModal,
    t,
    config,
    votingState,
    user,
    authToken,
    notifyVoteRecorded,
  } = useApp();
  const navigate = useNavigate();

  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingTimeout, setCheckingTimeout] = useState(false);
  const [resultState, setResultState] = useState<{
    status: 'idle' | 'recorded' | 'already_used' | 'unverified' | 'closed' | 'error' | 'paid_disabled';
    message: string;
    voteId?: string;
    recordedAt?: string;
  }>({ status: 'idle', message: '' });

  const [paidQuantity, setPaidQuantity] = useState<number>(1);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Generate a fresh idempotency key per modal session
  useEffect(() => {
    if (activeVoteCandidate) {
      const randomPart = Math.random().toString(36).substring(2, 11);
      setIdempotencyKey(`idem_${activeVoteCandidate.id}_${Date.now()}_${randomPart}`);
      setResultState({ status: 'idle', message: '' });
      setPaidQuantity(1);
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }
  }, [activeVoteCandidate]);

  // Close on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeVoteCandidate) {
        closeVoteModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeVoteCandidate, closeVoteModal]);

  if (!activeVoteCandidate) return null;

  const handleConfirmFreeVote = async () => {
    if (!user || !authToken) {
      closeVoteModal();
      navigate('/connexion');
      return;
    }

    setSubmitting(true);
    setResultState({ status: 'idle', message: '' });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          candidateId: activeVoteCandidate.id,
          voteType: 'free_verified',
          idempotencyKey,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (res.ok && data.code === 'VOTE_RECORDED') {
        setResultState({
          status: 'recorded',
          message: data.message,
          voteId: data.vote?.id,
          recordedAt: data.vote?.createdAt,
        });
        notifyVoteRecorded();
      } else if (data.code === 'FREE_VOTE_ALREADY_USED') {
        setResultState({
          status: 'already_used',
          message: data.error,
        });
        notifyVoteRecorded();
      } else if (data.code === 'ACCOUNT_UNVERIFIED') {
        setResultState({
          status: 'unverified',
          message: data.error,
        });
      } else if (data.code === 'VOTING_CLOSED' || data.code === 'VOTING_NOT_OPEN') {
        setResultState({
          status: 'closed',
          message: data.error,
        });
      } else {
        setResultState({
          status: 'error',
          message: data.error || 'Une erreur temporaire est survenue côté serveur.',
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      // On timeout or network drop, NEVER encourage a blind second vote: check idempotency key first!
      setCheckingTimeout(true);
      try {
        const checkRes = await fetch(`/api/votes/status/${encodeURIComponent(idempotencyKey)}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.found) {
            setResultState({
              status: 'recorded',
              message: `Vote confirmé après vérification d'idempotence pour ${checkData.vote.candidateName}.`,
              voteId: checkData.vote.id,
              recordedAt: checkData.vote.createdAt,
            });
            notifyVoteRecorded();
            setCheckingTimeout(false);
            setSubmitting(false);
            return;
          }
        }
      } catch {
        // Fallback if network is still unreachable
      }
      setCheckingTimeout(false);
      setResultState({
        status: 'error',
        message:
          "Délai réseau dépassé. Nous avons vérifié votre clé d'idempotence : aucun vote n'a été débité. Vous pouvez réessayer en toute sécurité avec la même clé.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttemptPaidVote = async () => {
    if (!user || !authToken) {
      closeVoteModal();
      navigate('/connexion');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          candidateId: activeVoteCandidate.id,
          voteType: 'paid_pack',
          quantity: paidQuantity,
          idempotencyKey: `${idempotencyKey}_paid`,
        }),
      });
      const data = await res.json();
      setResultState({
        status: 'paid_disabled',
        message: data.error,
      });
    } catch {
      setResultState({
        status: 'error',
        message: 'Erreur de communication avec le serveur.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeVoteModal}
          className="fixed inset-0 bg-[#21131D]/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="vote-modal-title"
          className="relative w-full max-w-lg bg-white rounded-3xl border border-[#EEDDE6] shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EEDDE6]">
            <div>
              <p className="text-xs font-semibold text-[#A80D55]">
                {config.contestName} · {config.editionLabel}
              </p>
              <h2 id="vote-modal-title" className="text-xl font-bold text-[#21131D] mt-0.5">
                {t.voteModal.title}
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeVoteModal}
              aria-label={t.voteModal.closeBtn}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#74636E] hover:text-[#21131D] hover:bg-[#FFF8FB] border border-[#EEDDE6]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Candidate Summary Block */}
          <div className="mt-5 flex items-center gap-4 p-4 rounded-2xl bg-[#FFF8FB] border border-[#EEDDE6]">
            <img
              src={activeVoteCandidate.photoUrl}
              alt={activeVoteCandidate.name}
              referrerPolicy="no-referrer"
              style={{ objectPosition: activeVoteCandidate.focalPoint }}
              className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-[#EEDDE6]"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#A80D55] tabular-nums">
                Candidate n°0{activeVoteCandidate.number} · {activeVoteCandidate.region}
              </p>
              <p className="text-lg font-bold text-[#21131D] truncate">
                {activeVoteCandidate.name}
              </p>
              <p className="text-xs text-[#74636E] truncate">
                {activeVoteCandidate.roleFr}
              </p>
            </div>
          </div>

          {/* Rules Summary */}
          <div className="mt-4 space-y-2 text-xs text-[#74636E] bg-white p-4 rounded-2xl border border-[#EEDDE6]">
            <p className="font-semibold text-[#21131D]">{t.voteModal.summaryHeader}</p>
            <p>• {t.voteModal.freeVoteRuleText}</p>
            <p>• {t.voteModal.paidVoteRuleText}</p>
            <p className="text-[11px] text-[#74636E] pt-1 font-mono tabular-nums">
              Clé d'idempotence serveur : {idempotencyKey}
            </p>
          </div>

          {/* Dynamic State Content */}
          <div className="mt-5">
            {!votingState.open ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
                <div>
                  <p className="font-semibold">Scrutin indisponible</p>
                  <p className="text-xs mt-1">{votingState.messageFr}</p>
                </div>
              </div>
            ) : !user ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#FFF8FB] border border-[#EEDDE6] text-sm text-[#21131D]">
                  <p className="font-semibold">Connexion requise pour voter</p>
                  <p className="text-xs text-[#74636E] mt-1">
                    Conformément au règlement de la 20ᵉ Édition, vous devez disposer d'un compte avec adresse e-mail vérifiée pour valider votre 1er vote gratuit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeVoteModal();
                    navigate('/connexion');
                  }}
                  className="w-full py-3.5 px-6 rounded-full bg-[#A80D55] hover:bg-[#780938] text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                  Se connecter / Créer un compte vérifié
                </button>
              </div>
            ) : !user.emailVerified ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-sm">
                  <p className="font-semibold">Adresse e-mail non vérifiée</p>
                  <p className="text-xs mt-1">
                    Votre compte ({user.email}) doit être vérifié avec votre code à 6 chiffres avant d'enregistrer un vote.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeVoteModal();
                    navigate('/mon-compte');
                  }}
                  className="w-full py-3 px-6 rounded-full bg-[#A80D55] text-white font-semibold text-sm"
                >
                  Vérifier mon compte maintenant
                </button>
              </div>
            ) : resultState.status === 'recorded' ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-[#F1FACB] border border-[#D6F542] text-[#21131D] space-y-2"
              >
                <div className="flex items-center gap-2 font-bold text-base">
                  <CheckCircle2 className="w-5 h-5 text-[#A80D55] shrink-0" />
                  <span>Vote enregistré côté serveur</span>
                </div>
                <p className="text-xs leading-relaxed">{resultState.message}</p>
                {resultState.voteId && (
                  <p className="text-[11px] font-mono tabular-nums text-[#74636E] pt-1">
                    Référence serveur : {resultState.voteId} · {resultState.recordedAt}
                  </p>
                )}
              </motion.div>
            ) : user.freeVoteUsedInEdition || resultState.status === 'already_used' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#FFF8FB] border border-[#EEDDE6] text-xs text-[#21131D] space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-sm text-[#A80D55]">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>{t.voteModal.alreadyUsedFreeTitle}</span>
                  </div>
                  <p className="text-[#74636E]">{t.voteModal.alreadyUsedFreeDesc}</p>
                </div>

                {/* Paid Voting Option (2nd vote onwards = 100 XAF) */}
                <div className="p-4 rounded-2xl border border-[#EEDDE6] bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#21131D]">
                      Votes supplémentaires (100 XAF / vote)
                    </span>
                    <span className="text-xs font-medium text-[#780938]">
                      Dès le 2ᵉ vote
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <label htmlFor="paid-qty" className="text-xs text-[#74636E]">
                      Quantité de votes supplémentaires :
                    </label>
                    <input
                      id="paid-qty"
                      type="number"
                      min={1}
                      max={100}
                      value={paidQuantity}
                      onChange={(e) => setPaidQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-24 px-3 py-1.5 rounded-xl border border-[#EEDDE6] text-sm font-semibold text-[#21131D] text-right tabular-nums"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#EEDDE6] text-sm">
                    <span className="text-[#74636E]">{t.voteModal.totalAmountLabel} :</span>
                    <strong className="text-base font-bold text-[#A80D55] tabular-nums">
                      {paidQuantity * config.paidVotePriceXaf} XAF
                    </strong>
                  </div>

                  {!config.paidVotingEnabled || !config.paymentProviderConfigured ? (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#74636E] space-y-1.5">
                      <div className="flex items-center gap-1.5 font-semibold text-[#21131D]">
                        <Lock className="w-3.5 h-3.5 text-[#A80D55]" />
                        <span>{t.voteModal.paidDisabledTitle}</span>
                      </div>
                      <p>{t.voteModal.paidDisabledDesc}</p>
                      <p className="text-[11px] font-medium text-[#780938]">
                        {t.voteModal.neverAskPinNotice}
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleAttemptPaidVote}
                      className="w-full py-3 px-5 rounded-full bg-[#A80D55] text-white text-sm font-semibold"
                    >
                      Procéder au paiement sécurisé ({paidQuantity * config.paidVotePriceXaf} XAF)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#74636E] leading-relaxed bg-[#FFF8FB] p-3.5 rounded-2xl border border-[#EEDDE6]">
                  {t.voteModal.nonModifiableWarning}
                </p>

                {resultState.status === 'error' && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900">
                    {resultState.message}
                  </div>
                )}

                <button
                  type="button"
                  disabled={submitting || checkingTimeout}
                  onClick={handleConfirmFreeVote}
                  className="w-full py-3.5 px-6 rounded-full bg-[#D6F542] hover:bg-[#c8e832] disabled:opacity-60 text-[#21131D] font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting || checkingTimeout ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>
                        {checkingTimeout
                          ? "Vérification de la clé d'idempotence..."
                          : 'Validation serveur en cours...'}
                      </span>
                    </>
                  ) : (
                    <span>
                      {t.voteModal.confirmFreeBtn} (0 XAF)
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#EEDDE6] flex justify-end">
            <button
              type="button"
              onClick={closeVoteModal}
              className="py-2 px-5 rounded-full border border-[#EEDDE6] text-xs font-medium text-[#74636E] hover:text-[#21131D]"
            >
              {t.voteModal.closeBtn}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
