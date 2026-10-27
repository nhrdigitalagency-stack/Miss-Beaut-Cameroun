import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, KeyRound, UserCheck, LogOut, History } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthPage: React.FC = () => {
  const { t, user, setAuthSession, refreshConfigAndUser } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la connexion.');
      } else {
        setAuthSession(data.token, data.user);
        await refreshConfigAndUser();
        navigate('/mon-compte');
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  const quickLoginDemoAccount = async (demoEmail: string, demoPass: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPass }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuthSession(data.token, data.user);
        await refreshConfigAndUser();
        if (data.user.role !== 'voter') {
          navigate('/admin');
        } else {
          navigate('/mon-compte');
        }
      } else {
        setError(data.error || 'Échec connexion rapide.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#EEDDE6] p-6 sm:p-9 space-y-6 shadow-xs">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#A80D55]">Parcours sécurisé</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#21131D]">{t.auth.title}</h1>
            <p className="text-xs sm:text-sm text-[#74636E]">{t.auth.subtitle}</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#FFF8FB] border border-[#EEDDE6] rounded-full">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                mode === 'login'
                  ? 'bg-[#A80D55] text-white'
                  : 'text-[#74636E] hover:text-[#21131D]'
              }`}
            >
              {t.auth.loginTab}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                mode === 'register'
                  ? 'bg-[#A80D55] text-white'
                  : 'text-[#74636E] hover:text-[#21131D]'
              }`}
            >
              {t.auth.registerTab}
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900">
              {error}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="auth-name" className="block text-xs font-semibold text-[#21131D] mb-1.5">
                  {t.auth.nameLabel}
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Marie-Claire Atangana"
                  className="w-full px-4 py-3 rounded-2xl border border-[#EEDDE6] bg-[#FFF8FB] text-sm text-[#21131D] focus:outline-2 focus:outline-[#A80D55]"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-[#21131D] mb-1.5">
                {t.auth.emailLabel}
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.cm"
                className="w-full px-4 py-3 rounded-2xl border border-[#EEDDE6] bg-[#FFF8FB] text-sm text-[#21131D] focus:outline-2 focus:outline-[#A80D55]"
              />
            </div>

            <div>
              <label htmlFor="auth-pass" className="block text-xs font-semibold text-[#21131D] mb-1.5">
                {t.auth.passwordLabel}
              </label>
              <input
                id="auth-pass"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl border border-[#EEDDE6] bg-[#FFF8FB] text-sm text-[#21131D] focus:outline-2 focus:outline-[#A80D55]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-full bg-[#D6F542] hover:bg-[#c8e832] text-[#21131D] font-bold text-sm transition-colors cursor-pointer"
            >
              {loading
                ? 'Traitement en cours...'
                : mode === 'login'
                ? t.auth.submitLogin
                : t.auth.submitRegister}
            </button>
          </form>
        </div>

        {/* Quick Role Access Column */}
        <div className="lg:col-span-5 bg-[#780938] text-white rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D6F542]">
              <KeyRound className="w-4 h-4" />
              <span>Accès Rapide</span>
            </div>
            <h2 className="text-lg font-bold">{t.auth.demoAccountsTitle}</h2>
            <p className="text-xs text-white/80 leading-relaxed">
              Connexion rapide aux différents espaces de la plateforme (Votant vérifié, Administrateur principal, Gestionnaire des candidates, Modérateur) :
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <button
              type="button"
              onClick={() => quickLoginDemoAccount('votant@exemple.cm', 'Vote2026!')}
              className="w-full text-left p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-colors cursor-pointer"
            >
              <p className="font-bold text-[#D6F542]">Compte Votant Vérifié</p>
              <p className="text-white/85">votant@exemple.cm · Éligible au 1er vote gratuit</p>
            </button>

            <button
              type="button"
              onClick={() => quickLoginDemoAccount('admin@eclat-cameroun.org', 'Admin2026!')}
              className="w-full text-left p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-colors cursor-pointer"
            >
              <p className="font-bold text-[#D6F542]">Administrateur Principal (super_admin)</p>
              <p className="text-white/85">admin@eclat-cameroun.org · Accès complet & statut édition</p>
            </button>

            <button
              type="button"
              onClick={() => quickLoginDemoAccount('candidates@eclat-cameroun.org', 'Manager2026!')}
              className="w-full text-left p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-colors cursor-pointer"
            >
              <p className="font-bold text-white">Gestionnaire des Candidates (candidate_manager)</p>
              <p className="text-white/80">candidates@eclat-cameroun.org · Profils & Actualités</p>
            </button>

            <button
              type="button"
              onClick={() => quickLoginDemoAccount('moderateur@eclat-cameroun.org', 'Mod2026!')}
              className="w-full text-left p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-colors cursor-pointer"
            >
              <p className="font-bold text-white">Modérateur Scrutin (moderator)</p>
              <p className="text-white/80">moderateur@eclat-cameroun.org · Revue & Invalidation tracée</p>
            </button>
          </div>

          {user && (
            <div className="pt-3 border-t border-white/15 text-xs">
              Connecté en tant que : <strong>{user.fullName}</strong> ({user.role})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const AccountPage: React.FC = () => {
  const { t, user, authToken, setAuthSession, refreshConfigAndUser } = useApp();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyErr, setVerifyErr] = useState('');
  const [votesHistory, setVotesHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authToken) {
      navigate('/connexion');
      return;
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        setVotesHistory(data.votesHistory || []);
        if (data.user?.verificationCode && !data.user.emailVerified) {
          setCode(data.user.verificationCode);
        }
        setLoading(false);
      })
      .catch(() => {
        setAuthSession(null, null);
        navigate('/connexion');
      });
  }, [authToken, navigate, setAuthSession]);

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyErr('');
    setVerifyMsg('');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyErr(data.error || 'Code invalide');
      } else {
        setVerifyMsg(data.message);
        await refreshConfigAndUser();
      }
    } catch {
      setVerifyErr('Erreur réseau');
    }
  };

  const handleLogout = async () => {
    if (authToken) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    }
    setAuthSession(null, null);
    navigate('/');
  };

  if (loading || !user) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 py-12">
        <div className="h-64 bg-white rounded-3xl border border-[#EEDDE6] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-[#EEDDE6] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#A80D55]">
            <UserCheck className="w-4 h-4" />
            <span>Rôle : {user.role}</span>
            <span aria-hidden="true">·</span>
            <span>
              {user.emailVerified ? 'Adresse e-mail vérifiée' : 'En attente de vérification'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#21131D]">{user.fullName}</h1>
          <p className="text-sm text-[#74636E]">{user.email}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full border border-[#EEDDE6] text-xs font-semibold text-[#21131D] hover:bg-[#FFF8FB] self-start sm:self-auto cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#A80D55]" />
          <span>{t.auth.logout}</span>
        </button>
      </div>

      {/* Email Verification Box if Unverified */}
      {!user.emailVerified && (
        <div className="bg-[#FFF8FB] rounded-3xl border border-[#A80D55] p-6 sm:p-8 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#21131D]">{t.auth.verifyTitle}</h2>
            <p className="text-xs sm:text-sm text-[#74636E]">{t.auth.verifyDesc}</p>
            {user.verificationCode && (
              <p className="text-xs font-semibold text-[#A80D55] pt-1">
                Votre code de vérification :{' '}
                <span className="font-mono text-sm bg-white px-2.5 py-1 rounded-lg border border-[#EEDDE6]">
                  {user.verificationCode}
                </span>
              </p>
            )}
          </div>

          {verifyErr && (
            <p className="text-xs text-red-700 font-medium">{verifyErr}</p>
          )}
          {verifyMsg && (
            <p className="text-xs text-emerald-800 font-medium">{verifyMsg}</p>
          )}

          <form onSubmit={handleVerifyEmail} className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-40 px-4 py-2.5 rounded-full border border-[#EEDDE6] bg-white text-sm font-mono font-bold text-[#21131D]"
            />
            <button
              type="submit"
              className="py-2.5 px-6 rounded-full bg-[#D6F542] text-[#21131D] text-xs sm:text-sm font-bold cursor-pointer"
            >
              {t.auth.verifyBtn}
            </button>
          </form>
        </div>
      )}

      {/* Personal Voting Eligibility Status */}
      <div className="bg-white rounded-3xl border border-[#EEDDE6] p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#21131D]">
          <ShieldCheck className="w-5 h-5 text-[#A80D55]" />
          <h2>Statut de votre droit de vote (20ᵉ Édition)</h2>
        </div>
        <p className="text-xs sm:text-sm text-[#74636E]">
          {user.freeVoteUsedInEdition
            ? 'Votre 1er vote gratuit pour la 20ᵉ Édition a été utilisé et enregistré côté serveur. À partir du 2ᵉ vote, le tarif réglementaire est de 100 XAF par vote.'
            : 'Votre 1er vote gratuit (0 XAF) est disponible pour cette édition dès que votre adresse e-mail est vérifiée.'}
        </p>
      </div>

      {/* Personal Vote History */}
      <div className="bg-white rounded-3xl border border-[#EEDDE6] p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#21131D]">
          <History className="w-5 h-5 text-[#A80D55]" />
          <h2>Historique personnel de vos votes enregistrés</h2>
        </div>

        {votesHistory.length === 0 ? (
          <p className="text-xs sm:text-sm text-[#74636E]">
            Vous n'avez encore enregistré aucun vote pour cette édition.
          </p>
        ) : (
          <div className="divide-y divide-[#EEDDE6] text-xs sm:text-sm">
            {votesHistory.map((v) => (
              <div key={v.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-[#21131D]">
                    Candidate n°0{v.candidateNumber} — {v.candidateName}
                  </p>
                  <p className="text-xs text-[#74636E] font-mono tabular-nums">
                    Réf: {v.id} · Clé idempotence: {v.idempotencyKey}
                  </p>
                  {v.status === 'invalidated' && (
                    <p className="text-xs text-red-700 mt-1">
                      Invalidé par modération — Motif : {v.invalidationReason}
                    </p>
                  )}
                </div>
                <div className="text-left sm:text-right">
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      v.status === 'valid' ? 'text-[#A80D55]' : 'text-red-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {v.status === 'valid' ? 'Vote valide (Serveur)' : 'Vote invalidé'}
                  </span>
                  <p className="text-xs text-[#74636E] tabular-nums">
                    {new Date(v.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
