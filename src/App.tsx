/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { BubbleHeader } from './components/BubbleHeader';
import { Footer } from './components/Footer';
import { VoteModal } from './components/VoteModal';
import { HomePage } from './pages/HomePage';
import { CandidatesPage } from './pages/CandidatesPage';
import { CandidateProfilePage } from './pages/CandidateProfilePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AuthPage, AccountPage } from './pages/AuthAndAccountPages';
import { AdminPage } from './pages/AdminPage';
import {
  ContestPage,
  RulesPage,
  NewsListPage,
  NewsDetailPage,
  FaqPage,
  ContactPage,
  PrivacyPage,
  TermsPage,
  NotFoundPage,
} from './pages/InfoAndLegalPages';

function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ScrollToTopOnNavigate />
        <div className="min-h-screen flex flex-col bg-[#FFF8FB] text-[#21131D] overflow-x-hidden">
          <BubbleHeader />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/candidates" element={<CandidatesPage />} />
              <Route path="/candidates/:slug" element={<CandidateProfilePage />} />
              <Route path="/classement" element={<LeaderboardPage />} />
              <Route path="/concours" element={<ContestPage />} />
              <Route path="/reglement" element={<RulesPage />} />
              <Route path="/actualites" element={<NewsListPage />} />
              <Route path="/actualites/:slug" element={<NewsDetailPage />} />
              <Route path="/connexion" element={<AuthPage />} />
              <Route path="/mon-compte" element={<AccountPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/confidentialite" element={<PrivacyPage />} />
              <Route path="/conditions" element={<TermsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
          <VoteModal />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
