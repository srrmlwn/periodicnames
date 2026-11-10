import React from 'react';
import Header from './Header';
import PeriodicTable from './PeriodicTable';
import { POPULAR_BOY_NAMES, POPULAR_GIRL_NAMES, POPULAR_NAMES_YEAR, popularNameSlug } from '../data/popularNames';

interface NameListProps {
  title: string;
  names: string[];
}

const NameList: React.FC<NameListProps> = ({ title, names }) => (
  <div className="mb-6">
    <h2 className="text-lg font-bold text-ink mb-2">{title}</h2>
    <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm font-medium">
      {[...names].sort((a, b) => a.localeCompare(b)).map(n => (
        <li key={n}>
          <a href={`/${popularNameSlug(n)}`} className="underline decoration-2 underline-offset-2 text-muted hover:text-ink">{n}</a>
        </li>
      ))}
    </ul>
  </div>
);

const PopularNamesPage: React.FC = () => (
  <div className="min-h-screen">
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
      <PeriodicTable />
    </div>

    <div className="relative z-10 flex flex-col" style={{ minHeight: '100dvh' }}>
      <div className="px-4 pt-4 shrink-0">
        <Header />
      </div>

      <main className="mx-auto w-full max-w-2xl px-6 py-10 flex-1">
        <a href="/" className="nb-btn bg-white text-sm px-3 py-1.5 mb-8">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Periodic Names
        </a>

        <div className="nb-card px-6 py-7 sm:px-8 sm:py-8">
          <h1 className="text-3xl font-bold text-ink mb-2">Popular names in the periodic table</h1>
          <p className="text-sm font-medium text-muted mb-8">
            The 100 most popular girl and boy names in the US ({POPULAR_NAMES_YEAR}, Social Security Administration), each spelled with
            periodic table elements. Pick a name to see it, or go back and type any name.
          </p>
          <NameList title="Girl names" names={POPULAR_GIRL_NAMES} />
          <NameList title="Boy names" names={POPULAR_BOY_NAMES} />
        </div>
      </main>
    </div>
  </div>
);

export default PopularNamesPage;
