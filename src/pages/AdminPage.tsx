import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  FileText,
  Activity,
  Download,
  AlertTriangle,
  PlusCircle,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EditionStatus } from '../config/centralConfig';

export const AdminPage: React.FC = () => {
  const { user, authToken, refreshConfigAndUser } = useApp();

  const [activeTab, setActiveTab] = useState<'edition' | 'candidates' | 'votes' | 'news' | 'audit'>('edition');
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Edition Config State
  const [editionStatus, setEditionStatus] = useState<EditionStatus>('voting_open');
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true);
  const [leaderboardMode, setLeaderboardMode] = useState('visible');
  const [configReason, setConfigReason] = useState('');

  // New Candidate Form State
  const [candName, setCandName] = useState('');
  const [candNumber, setCandNumber] = useState(7);
  const [candRegion, setCandRegion] = useState('Adamaoua');
  const [candCity, setCandCity] = useState('Ngaoundéré');
  const [candRoleFr, setCandRoleFr] = useState('');
  const [candAge, setCandAge] = useState(23);
  const [candBioFr, setCandBioFr] = useState('');
  const [candCauseFr, setCandCauseFr] = useState('');
  const [candMottoFr, setCandMottoFr] = useState('');
  const [candPhotoUrl, setCandPhotoUrl] = useState('/assets/aistudio/Laure_69cc1d06.jpg');
  const [candFocalPoint, setCandFocalPoint] = useState('center 18%');

  // Vote Invalidation State
  const [invalidationReasons, setInvalidationReasons] = useState<Record<string, string>>({});

  // News Form State
  const [newsTitleFr, setNewsTitleFr] = useState('');
  const [newsExcerptFr, setNewsExcerptFr] = useState('');
  const [newsContentFr, setNewsContentFr] = useState('');

  const fetchAdminOverview = useCallback(async () => {
    if (!authToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const d = await res.json();
        setErrorMsg(d.error || 'Accès non autorisé.');
        setOverview(null);
      } else {
        const data = await res.json();
        setOverview(data);
        setEditionStatus(data.config.editionStatus);
        setLeaderboardEnabled(data.config.publicLeaderboardEnabled);
        setLeaderboardMode(data.config.leaderboardMode);
        setCandNumber((data.candidates?.length || 6) + 1);
      }
    } catch {
      setErrorMsg('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchAdminOverview();
  }, [fetchAdminOverview]);

  if (!user || user.role === 'voter') {
    return (
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-16 text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-700">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#21131D]">
          Accès Administrateur Restreint (RBAC)
        </h1>
        <p className="text-sm text-[#74636E] max-w-lg mx-auto leading-relaxed">
          Cette section est strictement réservée aux membres habilités de l'organisation (Administrateur principal, Gestionnaire des candidates, Modérateur, Auditeur). Aucune inscription publique d'administrateur n'est autorisée.
        </p>
        <div className="pt-2">
          <Link
            to="/connexion"
            className="inline-flex py-3 px-6 rounded-full bg-[#A80D55] text-white text-xs sm:text-sm font-semibold"
          >
            Se connecter avec un compte habilité
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveEditionConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setActionSuccess('');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          reason: configReason,
          updates: {
            editionStatus,
            publicLeaderboardEnabled: leaderboardEnabled,
            leaderboardMode,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Échec de la mise à jour.');
      } else {
        setActionSuccess('Configuration de l’édition enregistrée et journalisée dans l’audit.');
        setConfigReason('');
        await fetchAdminOverview();
        await refreshConfigAndUser();
      }
    } catch {
      setErrorMsg('Erreur réseau.');
    }
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setActionSuccess('');
    try {
      const res = await fetch('/api/admin/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: candName,
          number: candNumber,
          region: candRegion,
          city: candCity,
          roleFr: candRoleFr,
          age: candAge,
          bioFr: candBioFr,
          causeFr: candCauseFr,
          mottoFr: candMottoFr,
          photoUrl: candPhotoUrl,
          focalPoint: candFocalPoint,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erreur lors de l'ajout.");
      } else {
        setActionSuccess(`Candidate n°0${data.candidate.number} (${data.candidate.name}) ajoutée.`);
        setCandName('');
        setCandRoleFr('');
        setCandBioFr('');
        setCandCauseFr('');
        setCandMottoFr('');
        await fetchAdminOverview();
      }
    } catch {
      setErrorMsg('Erreur réseau.');
    }
  };

  const handleToggleCandidateStatus = async (candId: string, nextStatus: string) => {
    setErrorMsg('');
    setActionSuccess('');
    try {
      const res = await fetch(`/api/admin/candidates/${candId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          status: nextStatus,
          reason: `Changement de statut vers ${nextStatus}`,
        }),
      });
      if (res.ok) {
        setActionSuccess('Statut de la candidate mis à jour.');
        await fetchAdminOverview();
      }
    } catch {
      setErrorMsg('Erreur réseau.');
    }
  };

  const handleInvalidateVote = async (voteId: string) => {
    const reason = (invalidationReasons[voteId] || '').trim();
    setErrorMsg('');
    setActionSuccess('');
    try {
      const res = await fetch(`/api/admin/votes/${voteId}/invalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Échec de l’invalidation.');
      } else {
        setActionSuccess(`Vote ${voteId} invalidé avec traçabilité dans le journal d'audit.`);
        await fetchAdminOverview();
        await refreshConfigAndUser();
      }
    } catch {
      setErrorMsg('Erreur réseau.');
    }
  };

  const handlePublishNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setActionSuccess('');
    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          titleFr: newsTitleFr,
          excerptFr: newsExcerptFr,
          contentFr: newsContentFr,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Erreur publication.');
      } else {
        setActionSuccess('Article publié et journalisé.');
        setNewsTitleFr('');
        setNewsExcerptFr('');
        setNewsContentFr('');
        await fetchAdminOverview();
      }
    } catch {
      setErrorMsg('Erreur réseau.');
    }
  };

  const handleExportCsvReport = () => {
    if (!overview?.candidates) return;
    const rows = [
      ['Numero', 'Nom', 'Region', 'Ville', 'Statut', 'Votes_Publics_Valides'].join(','),
      ...overview.candidates.map((c: any) =>
        [c.number, `"${c.name}"`, `"${c.region}"`, `"${c.city}"`, c.status, c.publicVotesCount].join(',')
      ),
    ].join('\n');

    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_scrutin_edition_20_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-10 sm:py-14 space-y-8">
      {/* Header */}
      <div className="bg-[#780938] text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D6F542]">
            <Shield className="w-4 h-4" />
            <span>Administration Sécurisée · Rôle actif : {user.role}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Pilotage de la 20ᵉ Édition — Miss Beauté Cameroun
          </h1>
          <p className="text-xs text-white/80">
            Conformément à la charte d'intégrité, aucun bouton d'ajout manuel de votes n'existe. Toute action sensible est journalisée.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsvReport}
          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full bg-[#D6F542] text-[#21131D] text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exporter le rapport CSV</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 font-medium">
          {errorMsg}
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-[#F1FACB] border border-[#D6F542] text-xs text-[#21131D] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#A80D55]" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-[#EEDDE6]">
        <button
          type="button"
          onClick={() => setActiveTab('edition')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'edition' ? 'bg-[#A80D55] text-white' : 'text-[#74636E] hover:text-[#21131D]'
          }`}
        >
          Édition & Statut Scrutin
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('candidates')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'candidates'
              ? 'bg-[#A80D55] text-white'
              : 'text-[#74636E] hover:text-[#21131D]'
          }`}
        >
          Candidates ({overview?.candidates?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('votes')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'votes' ? 'bg-[#A80D55] text-white' : 'text-[#74636E] hover:text-[#21131D]'
          }`}
        >
          Votes & Revue Anomalies ({overview?.votes?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('news')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'news' ? 'bg-[#A80D55] text-white' : 'text-[#74636E] hover:text-[#21131D]'
          }`}
        >
          Actualités
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'audit' ? 'bg-[#A80D55] text-white' : 'text-[#74636E] hover:text-[#21131D]'
          }`}
        >
          Journal d'audit ({overview?.auditLogs?.length || 0})
        </button>
      </div>

      {loading ? (
        <div className="h-72 bg-white rounded-3xl border border-[#EEDDE6] animate-pulse" />
      ) : (
        <>
          {/* TAB 1: EDITION & RULES */}
          {activeTab === 'edition' && (
            <div className="bg-white rounded-3xl border border-[#EEDDE6] p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-bold text-[#21131D]">
                Contrôle de l'état de la 20ᵉ Édition et de la publication du classement
              </h2>

              <form onSubmit={handleSaveEditionConfig} className="space-y-5 max-w-2xl">
                <div>
                  <label htmlFor="adm-status" className="block text-xs font-semibold text-[#21131D] mb-1.5">
                    État officiel de l'édition
                  </label>
                  <select
                    id="adm-status"
                    value={editionStatus}
                    onChange={(e) => setEditionStatus(e.target.value as EditionStatus)}
                    disabled={user.role !== 'super_admin'}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#EEDDE6] bg-[#FFF8FB] text-sm text-[#21131D]"
                  >
                    <option value="draft">draft (Brouillon)</option>
                    <option value="published">published (Présentation ouverte, vote non ouvert)</option>
                    <option value="voting_open">voting_open (Scrutin ouvert : 27/10/2026 - 01/12/2026)</option>
                    <option value="voting_closed">voting_closed (Scrutin clôturé)</option>
                    <option value="results_under_review">results_under_review (Résultats en revue d'audit)</option>
                    <option value="results_published">results_published (Résultats officiels validés)</option>
                    <option value="archived">archived (Édition archivée)</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="adm-lb-toggle"
                    type="checkbox"
                    checked={leaderboardEnabled}
                    onChange={(e) => setLeaderboardEnabled(e.target.checked)}
                    disabled={user.role !== 'super_admin'}
                    className="w-4 h-4 accent-[#A80D55]"
                  />
                  <label htmlFor="adm-lb-toggle" className="text-sm font-medium text-[#21131D]">
                    Autoriser l'affichage public du classement et des totaux de votes
                  </label>
                </div>

                <div>
                  <label htmlFor="adm-reason" className="block text-xs font-semibold text-[#21131D] mb-1.5">
                    Motif obligatoire pour le journal d'audit (minimum 8 caractères)
                  </label>
                  <input
                    id="adm-reason"
                    type="text"
                    required
                    minLength={8}
                    value={configReason}
                    onChange={(e) => setConfigReason(e.target.value)}
                    placeholder="Ex: Ouverture officielle du scrutin selon le calendrier validé"
                    disabled={user.role !== 'super_admin'}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#EEDDE6] bg-[#FFF8FB] text-sm text-[#21131D]"
                  />
                </div>

                {user.role === 'super_admin' ? (
                  <button
                    type="submit"
                    className="py-3 px-6 rounded-full bg-[#A80D55] text-white text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    Appliquer et journaliser la modification
                  </button>
                ) : (
                  <p className="text-xs text-amber-800">
                    Seul le rôle Administrateur Principal (super_admin) peut modifier l'état global du scrutin.
                  </p>
                )}
              </form>
            </div>
          )}

          {/* TAB 2: CANDIDATES MANAGEMENT */}
          {activeTab === 'candidates' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 bg-white rounded-3xl border border-[#EEDDE6] p-6 space-y-4">
                <h2 className="text-base font-bold text-[#21131D] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#A80D55]" />
                  <span>Candidates enregistrées</span>
                </h2>
                <div className="divide-y divide-[#EEDDE6] text-xs sm:text-sm">
                  {overview?.candidates?.map((c: any) => (
                    <div key={c.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={c.photoUrl}
                          alt={c.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-[#EEDDE6]"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-[#21131D] truncate">
                            n°0{c.number} — {c.name} ({c.region})
                          </p>
                          <p className="text-xs text-[#74636E] truncate">
                            {c.roleFr} · Votes valides : <strong>{c.publicVotesCount}</strong> · Statut :{' '}
                            <strong>{c.status}</strong>
                          </p>
                        </div>
                      </div>
                      {(user.role === 'super_admin' || user.role === 'candidate_manager') && (
                        <select
                          aria-label={`Statut de ${c.name}`}
                          value={c.status}
                          onChange={(e) => handleToggleCandidateStatus(c.id, e.target.value)}
                          className="px-3 py-1.5 rounded-full border border-[#EEDDE6] text-xs font-semibold text-[#21131D] bg-[#FFF8FB]"
                        >
                          <option value="eligible">Éligible</option>
                          <option value="suspended">Suspendue</option>
                          <option value="withdrawn">Retirée</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-white rounded-3xl border border-[#EEDDE6] p-6 space-y-4">
                <h2 className="text-base font-bold text-[#21131D] flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-[#A80D55]" />
                  <span>Ajouter une candidate autorisée</span>
                </h2>

                {user.role === 'super_admin' || user.role === 'candidate_manager' ? (
                  <form onSubmit={handleCreateCandidate} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#21131D] mb-1">Nom public</label>
                        <input
                          type="text"
                          required
                          value={candName}
                          onChange={(e) => setCandName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#EEDDE6]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#21131D] mb-1">Numéro</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={candNumber}
                          onChange={(e) => setCandNumber(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-[#EEDDE6]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#21131D] mb-1">Région</label>
                        <input
                          type="text"
                          required
                          value={candRegion}
                          onChange={(e) => setCandRegion(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#EEDDE6]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#21131D] mb-1">Ville</label>
                        <input
                          type="text"
                          value={candCity}
                          onChange={(e) => setCandCity(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#EEDDE6]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#21131D] mb-1">Profession (FR)</label>
                        <input
                          type="text"
                          required
                          value={candRoleFr}
                          onChange={(e) => setCandRoleFr(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#EEDDE6]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#21131D] mb-1">Âge indicatif</label>
                        <input
                          type="number"
                          value={candAge}
                          onChange={(e) => setCandAge(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-[#EEDDE6]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#21131D] mb-1">Devise officielle</label>
                      <input
                        type="text"
                        required
                        value={candMottoFr}
                        onChange={(e) => setCandMottoFr(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#EEDDE6]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#21131D] mb-1">Présentation & Projet</label>
                      <textarea
                        rows={3}
                        required
                        value={candBioFr}
                        onChange={(e) => setCandBioFr(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#EEDDE6]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#21131D] mb-1">Photo autorisée</label>
                        <select
                          value={candPhotoUrl}
                          onChange={(e) => setCandPhotoUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#EEDDE6]"
                        >
                          <option value="/assets/aistudio/Laure_69cc1d06.jpg">Portrait Laure</option>
                          <option value="/assets/aistudio/Nadia_7882f6b6.jpg">Portrait Nadia</option>
                          <option value="/assets/aistudio/belva_2d5c7ff1.jpg">Portrait Belva</option>
                          <option value="/assets/aistudio/Josephine_1da2964d.jpg">Portrait Joséphine</option>
                          <option value="/assets/aistudio/morelle_40314c3d.jpg">Portrait Morelle</option>
                          <option value="/assets/aistudio/synthia_bb504dc4.jpg">Portrait Synthia</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[#21131D] mb-1">Point focal portrait</label>
                        <input
                          type="text"
                          value={candFocalPoint}
                          onChange={(e) => setCandFocalPoint(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#EEDDE6]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-full bg-[#A80D55] text-white font-bold cursor-pointer"
                    >
                      Enregistrer la candidate
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-[#74636E]">
                    Votre rôle ({user.role}) est en lecture seule sur le catalogue des candidates.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: VOTES & ANOMALY REVIEW */}
          {activeTab === 'votes' && (
            <div className="bg-white rounded-3xl border border-[#EEDDE6] p-6 space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-[#21131D]">
                  Revue des votes & Procédure d'invalidation motivée
                </h2>
                <p className="text-xs text-[#74636E]">
                  Confidentialité : les adresses e-mails des votants ne sont jamais exposées (empreinte SHA-256 anonymisée uniquement). Aucun vote n'est supprimé : toute invalidation exige un motif consigné dans le journal d'audit.
                </p>
              </div>

              {overview?.votes?.length === 0 ? (
                <p className="text-xs text-[#74636E] py-6">
                  Aucun vote enregistré pour le moment.
                </p>
              ) : (
                <div className="divide-y divide-[#EEDDE6] text-xs">
                  {overview.votes.map((v: any) => (
                    <div key={v.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-bold text-[#21131D]">
                          Vote #{v.id} → Candidate n°0{v.candidateNumber} ({v.candidateName})
                        </p>
                        <p className="text-[#74636E] font-mono tabular-nums">
                          Empreinte votant : {v.voterAnonymizedId} · Clé idempotence : {v.idempotencyKey}
                        </p>
                        <p className="text-[#74636E] tabular-nums">
                          Horodatage serveur : {new Date(v.createdAt).toLocaleString('fr-FR')} · Statut :{' '}
                          <strong className={v.status === 'valid' ? 'text-emerald-700' : 'text-red-700'}>
                            {v.status}
                          </strong>
                        </p>
                        {v.invalidationReason && (
                          <p className="text-red-700 font-medium">
                            Motif d'invalidation : {v.invalidationReason} (par {v.invalidatedByAdminId})
                          </p>
                        )}
                      </div>

                      {v.status === 'valid' &&
                        (user.role === 'super_admin' || user.role === 'moderator') && (
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <input
                              type="text"
                              placeholder="Motif d'invalidation (min 10 car.)"
                              value={invalidationReasons[v.id] || ''}
                              onChange={(e) =>
                                setInvalidationReasons((prev) => ({
                                  ...prev,
                                  [v.id]: e.target.value,
                                }))
                              }
                              className="px-3 py-2 rounded-xl border border-[#EEDDE6] text-xs w-64"
                            />
                            <button
                              type="button"
                              onClick={() => handleInvalidateVote(v.id)}
                              className="inline-flex items-center gap-1 py-2 px-4 rounded-full bg-red-600 text-white font-semibold cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Invalider avec trace</span>
                            </button>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PUBLISH NEWS */}
          {activeTab === 'news' && (
            <div className="bg-white rounded-3xl border border-[#EEDDE6] p-6 sm:p-8 max-w-2xl space-y-4">
              <h2 className="text-base font-bold text-[#21131D] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#A80D55]" />
                <span>Publier un communiqué officiel</span>
              </h2>
              <form onSubmit={handlePublishNews} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#21131D] mb-1">Titre de l'actualité</label>
                  <input
                    type="text"
                    required
                    value={newsTitleFr}
                    onChange={(e) => setNewsTitleFr(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#EEDDE6]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#21131D] mb-1">Chapeau / Résumé court</label>
                  <input
                    type="text"
                    required
                    value={newsExcerptFr}
                    onChange={(e) => setNewsExcerptFr(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#EEDDE6]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#21131D] mb-1">Contenu complet</label>
                  <textarea
                    rows={5}
                    required
                    value={newsContentFr}
                    onChange={(e) => setNewsContentFr(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#EEDDE6]"
                  />
                </div>
                <button
                  type="submit"
                  className="py-3 px-6 rounded-full bg-[#A80D55] text-white font-bold cursor-pointer"
                >
                  Publier l'article
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-3xl border border-[#EEDDE6] p-6 space-y-4">
              <h2 className="text-base font-bold text-[#21131D] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#A80D55]" />
                <span>Journal d'audit inaltérable (Opérations serveur & Modération)</span>
              </h2>
              <div className="divide-y divide-[#EEDDE6] text-xs">
                {overview?.auditLogs?.map((log: any) => (
                  <div key={log.id} className="py-3.5 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-[#A80D55] font-mono">
                        [{log.action}] · Cible : {log.targetType}/{log.targetId}
                      </span>
                      <span className="text-[#74636E] tabular-nums">
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-[#21131D] font-medium">Motif : {log.reason}</p>
                    <p className="text-[#74636E]">
                      Acteur : {log.actorId} ({log.actorRole}) — {log.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
