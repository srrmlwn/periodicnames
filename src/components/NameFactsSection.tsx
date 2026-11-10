import React from 'react';
import { buildNameFacts, missingLetterNote, nameFactsSummary } from '../utils/nameFacts';
import { popularNameSlug } from '../data/popularNames';

interface NameFactsSectionProps {
  name: string;
}

const NameFactsSection: React.FC<NameFactsSectionProps> = ({ name }) => {
  const facts = buildNameFacts(name);
  return (
    <section className="w-full max-w-xl mx-auto nb-card px-5 py-5 sm:px-6 text-sm text-ink">
      <h2 className="text-lg font-bold mb-2">The elements in {name}</h2>
      <p className="mb-3 text-muted font-medium">{nameFactsSummary(facts)}</p>
      <ul className="space-y-1.5 mb-4">
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
