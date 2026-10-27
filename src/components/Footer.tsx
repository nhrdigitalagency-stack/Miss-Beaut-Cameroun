import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { t, config, locale } = useApp();

  return (
    <footer className="bg-[#780938] text-white mt-20 border-t border-[#A80D55]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/15">
          {/* Column 1: Brand */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={config.logoUrl}
                alt={config.contestName}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover border border-[#D6F542]"
              />
              <div>
                <p className="font-bold text-lg tracking-tight text-white">
                  {config.contestName}
                </p>
                <p className="text-xs text-[#F1FACB]">
                  {config.editionLabel}
                </p>
              </div>
            </div>
            <p className="text-sm text-white/80 leading-relaxed max-w-md">
              {locale === 'en' ? config.sloganEn : config.sloganFr}
            </p>
            <p className="text-xs text-white/75 leading-relaxed bg-black/20 p-3.5 rounded-2xl border border-white/10">
              {t.footer.disclaimer}
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold text-[#D6F542] tracking-wide">
              {t.footer.linksTitle}
            </h3>
            <ul className="space-y-2.5 text-sm text-white/85">
              <li>
                <Link to="/candidates" className="hover:text-[#D6F542] transition-colors">
                  {t.nav.candidates}
                </Link>
              </li>
              <li>
                <Link to="/classement" className="hover:text-[#D6F542] transition-colors">
                  {t.nav.leaderboard}
                </Link>
              </li>
              <li>
                <Link to="/concours" className="hover:text-[#D6F542] transition-colors">
                  {t.nav.contest}
                </Link>
              </li>
              <li>
                <Link to="/actualites" className="hover:text-[#D6F542] transition-colors">
                  {t.nav.news}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#D6F542] transition-colors">
                  {t.nav.faq}
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-[#D6F542] transition-colors">
                  Administration
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Rules */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#D6F542] tracking-wide">
              {t.footer.legalTitle}
            </h3>
            <ul className="space-y-2.5 text-sm text-white/85">
              <li>
                <Link to="/reglement" className="hover:text-[#D6F542] transition-colors">
                  {t.footer.rules}
                </Link>
              </li>
              <li>
                <Link to="/confidentialite" className="hover:text-[#D6F542] transition-colors">
                  {t.footer.privacy}
                </Link>
              </li>
              <li>
                <Link to="/conditions" className="hover:text-[#D6F542] transition-colors">
                  {t.footer.terms}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#D6F542] transition-colors">
                  {t.footer.contact}
                </Link>
              </li>
            </ul>
            <div className="pt-2 text-xs text-white/75 space-y-1">
              <p>Fuseau de référence : {config.timeZone}</p>
              <p>Ouverture : 27/10/2026 · Clôture : 01/12/2026</p>
              <p>Tarification : 1er vote gratuit · Dès le 2ᵉ vote : 100 XAF</p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
          <p>
            © {new Date().getFullYear()} {config.contestName} — {config.editionLabel}. {t.footer.rights}
          </p>
          <p>{config.organizerName}</p>
        </div>
      </div>
    </footer>
  );
};
