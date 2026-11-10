import React from 'react';
import { buildNameFacts, missingLetterNote, nameFactsSummaryLines } from '../utils/nameFacts';
import { popularNameSlug } from '../data/popularNames';

interface NameFactsSectionProps {
  name: string;
}

const NameFactsSection: React.FC<NameFactsSectionProps> = ({ name }) => {
  const facts = buildNameFacts(name);
  return (
    <section className="facts-fade-in w-full max-w-md mx-auto mt-4 rounded-xl border-2 border-ink/15 bg-white/60 px-4 py-4 sm:px-5 text-[13px] leading-snug text-ink/80">
      <h2 className="text-base font-bold text-ink mb-1.5">The elements in {name}</h2>
      <div className="mb-2.5 font-medium text-muted">
        {nameFactsSummaryLines(facts).map((line, i) => (
          <p key={i} className={i === 0 ? 'font-bold text-ink' : undefined}>{line}</p>
        ))}
      </div>
      <ul className={facts.related.length > 0 ? 'space-y-1.5 mb-4' : 'space-y-1.5'}>
        {facts.lines.map(line => (
          <li key={line.symbol}>
            <span className="font-bold">{line.symbol}</span>
            {line.elementName ? (
              <> — {line.elementName}: {line.fact}</>
            ) : (
              <> — {missingLetterNote(line.symbol)}</>
            )}
          </li>
        ))}
      </ul>
      {facts.related.length > 0 && (
        <p className="text-muted font-medium">
          More names:{' '}
          {facts.related.map((n, i) => (
            <React.Fragment key={n}>
              {i > 0 && ', '}
              <a href={`/${popularNameSlug(n)}`} className="underline decoration-2 underline-offset-2 hover:text-ink">{n}</a>
            </React.Fragment>
          ))}
          {' · '}
          <a href="/names" className="underline decoration-2 underline-offset-2 hover:text-ink">All popular names</a>
        </p>
      )}
    </section>
  );
};

export default NameFactsSection;
