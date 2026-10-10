import React from 'react';
import { getAllElements } from '../data/elements';
import type { Element } from '../data/elements';
import { ELEMENT_POSITIONS } from '../utils/canvasTile';

interface PeriodicTableProps {
  litColors?: Map<string, string>;
}

const ELEMENTS_BY_SYMBOL = new Map(getAllElements().map(e => [e.symbol, e]));

const GRID: (Element | null)[][] = Array.from({ length: 9 }, () => new Array(18).fill(null));
for (const [symbol, row, col] of ELEMENT_POSITIONS) {
  GRID[row][col] = ELEMENTS_BY_SYMBOL.get(symbol) ?? null;
}

const PeriodicTable: React.FC<PeriodicTableProps> = ({ litColors = new Map() }) => {

  return (
    <div className="flex flex-col gap-0.5">
      {GRID.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-0.5">
          {row.map((element, colIndex) => {
            if (!element) return <div key={colIndex} className="w-10 h-10" />;
            const litColor = litColors.get(element.symbol);
            const isLit = litColor !== undefined;
            return (
              <div
                key={colIndex}
                className={`w-10 h-10 rounded-md flex flex-col items-center justify-center relative transition-colors duration-300 ${
                  isLit ? 'border-2 border-ink shadow-brutal-sm text-ink table-light z-10' : 'border border-ink/15 text-ink/30'
                }`}
                style={isLit ? { backgroundColor: litColor } : undefined}
              >
                <span className="absolute top-0 left-0.5 text-[5px] font-medium leading-none">
                  {element.atomicNumber}
                </span>
                <span className="text-sm font-bold leading-none">{element.symbol}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default PeriodicTable;
