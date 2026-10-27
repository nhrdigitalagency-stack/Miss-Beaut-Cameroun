import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Candidate } from '../data/initialData';
import { CandidateCard } from '../components/CandidateCard';

export const CandidatesPage: React.FC = () => {
  const { t, config, voteSuccessTrigger } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params
  const [rawSearch, setRawSearch] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q') || '');
  const [selectedRegion, setSelectedRegion] = useState(searchParams.get('region') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'number');
  const [page, setPage] = useState(Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1));

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showPublicVotes, setShowPublicVotes] = useState(true);
  const [loading, setLoading] = useState(true);

  // Sync rawSearch when URL param changes externally (e.g. from BubbleHeader quick search)
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    setRawSearch(urlQ);
    setDebouncedSearch(urlQ);
  }, [searchParams]);

  // Debounce search input (250ms) to avoid requesting on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(rawSearch);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  // Keep filters preserved in URL
  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (debouncedSearch.trim()) nextParams.set('q', debouncedSearch.trim());
    if (selectedRegion !== 'all') nextParams.set('region', selectedRegion);
    if (sortBy !== 'number') nextParams.set('sort', sortBy);
    if (page > 1) nextParams.set('page', String(page));
    setSearchParams(nextParams, { replace: true });
  }, [debouncedSearch, selectedRegion, sortBy, page, setSearchParams]);

  // Fetch candidates with AbortController to cancel obsolete requests
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({
      q: debouncedSearch,
      region: selectedRegion,
      sort: sortBy,
      page: String(page),
      pageSize: '6',
    });

    fetch(`/api/candidates?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data.candidates || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
        setRegions(data.regions || []);
        setShowPublicVotes(Boolean(data.showPublicVotes));
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error(err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedSearch, selectedRegion, sortBy, page, voteSuccessTrigger]);

  const handleResetFilters = () => {
    setRawSearch('');
    setDebouncedSearch('');
    setSelectedRegion('all');
    setSortBy('number');
    setPage(1);
  };

  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-10 sm:py-14 space-y-10">
      {/* Page Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#A80D55]">
          <span>{config.contestName}</span>
          <span aria-hidden="true">·</span>
          <span>{config.editionLabel}</span>
          {config.demoMode && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#74636E] font-normal">{t.banner.demoBadge}</span>
            </>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#21131D] tracking-tight">
          {t.candidates.catalogTitle}
        </h1>
        <p className="text-sm sm:text-base text-[#74636E] max-w-2xl">
          {t.candidates.catalogSubtitle}
        </p>
      </div>

      {/* Search & Filter Control Panel */}
      <div className="bg-white rounded-3xl border border-[#EEDDE6] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search Input */}
          <div className="md:col-span-6">
            <label htmlFor="candidate-search" className="block text-xs font-semibold text-[#21131D] mb-1.5">
              {t.candidates.searchLabel}
            </label>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#74636E] absolute left-3.5 pointer-events-none" />
              <input
                id="candidate-search"
                type="search"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                placeholder={t.nav.searchPlaceholder}
                className="w-full pl-10 pr-10 py-2.5 rounded-full border border-[#EEDDE6] bg-[#FFF8FB] text-sm text-[#21131D] placeholder-[#74636E] focus:outline-2 focus:outline-[#A80D55]"
              />
              {rawSearch && (
                <button
                  type="button"
                  onClick={() => setRawSearch('')}
                  aria-label={t.candidates.clearSearch}
                  className="absolute right-3 p-1 text-[#74636E] hover:text-[#21131D]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Region Filter */}
          <div className="md:col-span-3">
            <label htmlFor="region-select" className="block text-xs font-semibold text-[#21131D] mb-1.5">
              Région représentée
            </label>
            <select
              id="region-select"
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 rounded-full border border-[#EEDDE6] bg-white text-sm text-[#21131D] focus:outline-2 focus:outline-[#A80D55]"
            >
              <option value="all">{t.candidates.filterRegion}</option>
              {regions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Select */}
          <div className="md:col-span-3">
            <label htmlFor="sort-select" className="block text-xs font-semibold text-[#21131D] mb-1.5">
              {t.candidates.sortBy}
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 rounded-full border border-[#EEDDE6] bg-white text-sm text-[#21131D] focus:outline-2 focus:outline-[#A80D55]"
            >
              <option value="number">{t.candidates.sortNumber}</option>
              <option value="name">{t.candidates.sortName}</option>
              {showPublicVotes && <option value="votes">{t.candidates.sortVotes}</option>}
            </select>
          </div>
        </div>

        {/* Status Bar & Reset */}
        <div className="pt-2 border-t border-[#EEDDE6] flex flex-wrap items-center justify-between gap-3 text-xs text-[#74636E]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#A80D55]" />
            <span className="tabular-nums">
              <strong className="text-[#21131D]">{totalCount}</strong> {t.candidates.resultsCount}
            </span>
          </div>

          {(rawSearch || selectedRegion !== 'all' || sortBy !== 'number') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 font-semibold text-[#A80D55] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.candidates.resetFilters}</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Grid or Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-[460px] rounded-3xl bg-white border border-[#EEDDE6] animate-pulse p-5"
            />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EEDDE6] p-12 text-center max-w-lg mx-auto space-y-4">
          <h2 className="text-xl font-bold text-[#21131D]">{t.candidates.noResultsTitle}</h2>
          <p className="text-sm text-[#74636E]">{t.candidates.noResultsDesc}</p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="py-2.5 px-6 rounded-full bg-[#A80D55] text-white text-xs font-semibold"
          >
            {t.candidates.resetFilters}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                showPublicVotes={showPublicVotes}
              />
            ))}
          </div>

          {/* Server-backed Pagination */}
          {totalPages > 1 && (
            <div className="pt-6 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-full text-xs font-semibold tabular-nums transition-colors ${
                    p === page
                      ? 'bg-[#A80D55] text-white'
                      : 'bg-white border border-[#EEDDE6] text-[#21131D] hover:bg-[#FFF8FB]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
