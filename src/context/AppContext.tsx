import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CentralConfig, DEFAULT_CENTRAL_CONFIG } from '../config/centralConfig';
import { UserSession, Candidate } from '../data/initialData';
import { fetchCurrentUserSession } from '../services/dataService';
import frDict from '../i18n/fr.json';
import enDict from '../i18n/en.json';

type Locale = 'fr' | 'en';

interface VotingStateInfo {
  open: boolean;
  code: string;
  messageFr: string;
  messageEn: string;
}

interface AppContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: typeof frDict;
  config: CentralConfig;
  votingState: VotingStateInfo;
  serverTimeIso: string;
  user: UserSession | null;
  authToken: string | null;
  setAuthSession: (token: string | null, user: UserSession | null) => void;
  refreshConfigAndUser: () => Promise<void>;
  activeVoteCandidate: Candidate | null;
  openVoteModal: (candidate: Candidate) => void;
  closeVoteModal: () => void;
  voteSuccessTrigger: number;
  notifyVoteRecorded: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('eclat_locale');
    return saved === 'en' ? 'en' : 'fr';
  });

  const [config, setConfig] = useState<CentralConfig>(DEFAULT_CENTRAL_CONFIG);
  const [votingState, setVotingState] = useState<VotingStateInfo>({
    open: true,
    code: 'VOTING_OPEN',
    messageFr: 'Scrutin ouvert',
    messageEn: 'Voting open',
  });
  const [serverTimeIso, setServerTimeIso] = useState<string>(new Date().toISOString());

  // Store auth token in memory (or sessionStorage for tab reload persistence without exposing secrets)
  const [authToken, setAuthToken] = useState<string | null>(() => sessionStorage.getItem('eclat_session_token'));
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeVoteCandidate, setActiveVoteCandidate] = useState<Candidate | null>(null);
  const [voteSuccessTrigger, setVoteSuccessTrigger] = useState(0);

  const setLocale = (loc: Locale) => {
    setLocaleState(loc);
    localStorage.setItem('eclat_locale', loc);
    document.documentElement.lang = loc;
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setAuthSession = useCallback((token: string | null, usr: UserSession | null) => {
    setAuthToken(token);
    setUser(usr);
    if (token) {
      sessionStorage.setItem('eclat_session_token', token);
    } else {
      sessionStorage.removeItem('eclat_session_token');
    }
  }, []);

  const refreshConfigAndUser = useCallback(async () => {
    try {
      const cfgRes = await fetch('/api/config');
      const contentType = cfgRes.headers.get('content-type') || '';
      if (cfgRes.ok && contentType.includes('application/json')) {
        const data = await cfgRes.json();
        if (data.config) setConfig(data.config);
        if (data.votingState) setVotingState(data.votingState);
        if (data.serverTimeIso) setServerTimeIso(data.serverTimeIso);
      }

      if (authToken) {
        const meData = await fetchCurrentUserSession(authToken);
        if (meData?.user) {
          setUser(meData.user);
        }
      }
    } catch {
      // Static host fallback uses DEFAULT_CENTRAL_CONFIG
    }
  }, [authToken]);

  useEffect(() => {
    refreshConfigAndUser();
  }, [refreshConfigAndUser]);

  const openVoteModal = (candidate: Candidate) => {
    setActiveVoteCandidate(candidate);
  };

  const closeVoteModal = () => {
    setActiveVoteCandidate(null);
  };

  const notifyVoteRecorded = () => {
    setVoteSuccessTrigger((prev) => prev + 1);
    refreshConfigAndUser();
  };

  const t = locale === 'en' ? enDict : frDict;

  return (
    <AppContext.Provider
      value={{
        locale,
        setLocale,
        t,
        config,
        votingState,
        serverTimeIso,
        user,
        authToken,
        setAuthSession,
        refreshConfigAndUser,
        activeVoteCandidate,
        openVoteModal,
        closeVoteModal,
        voteSuccessTrigger,
        notifyVoteRecorded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
