import React from 'react';
import ElementTile from './ElementTile';
import { getAllElements } from '../data/elements';

interface PeriodicTableProps {
  highlightedSymbols?: string[];
}

const PeriodicTable: React.FC<PeriodicTableProps> = ({ highlightedSymbols = [] }) => {
  const realElements = getAllElements();

  const renderPeriodicTable = () => {
    const row1 = new Array(18).fill(null);
    row1[0] = realElements.find(e => e.symbol === 'H');
    row1[17] = realElements.find(e => e.symbol === 'He');

    const row2 = new Array(18).fill(null);
    row2[0] = realElements.find(e => e.symbol === 'Li');
    row2[1] = realElements.find(e => e.symbol === 'Be');
    row2[12] = realElements.find(e => e.symbol === 'B');
    row2[13] = realElements.find(e => e.symbol === 'C');
    row2[14] = realElements.find(e => e.symbol === 'N');
    row2[15] = realElements.find(e => e.symbol === 'O');
    row2[16] = realElements.find(e => e.symbol === 'F');
    row2[17] = realElements.find(e => e.symbol === 'Ne');

    const row3 = new Array(18).fill(null);
    row3[0] = realElements.find(e => e.symbol === 'Na');
    row3[1] = realElements.find(e => e.symbol === 'Mg');
    row3[12] = realElements.find(e => e.symbol === 'Al');
    row3[13] = realElements.find(e => e.symbol === 'Si');
    row3[14] = realElements.find(e => e.symbol === 'P');
    row3[15] = realElements.find(e => e.symbol === 'S');
    row3[16] = realElements.find(e => e.symbol === 'Cl');
    row3[17] = realElements.find(e => e.symbol === 'Ar');

    const row4 = new Array(18).fill(null);
    row4[0] = realElements.find(e => e.symbol === 'K');
    row4[1] = realElements.find(e => e.symbol === 'Ca');
    row4[2] = realElements.find(e => e.symbol === 'Sc');
    row4[3] = realElements.find(e => e.symbol === 'Ti');
    row4[4] = realElements.find(e => e.symbol === 'V');
    row4[5] = realElements.find(e => e.symbol === 'Cr');
    row4[6] = realElements.find(e => e.symbol === 'Mn');
    row4[7] = realElements.find(e => e.symbol === 'Fe');
    row4[8] = realElements.find(e => e.symbol === 'Co');
    row4[9] = realElements.find(e => e.symbol === 'Ni');
    row4[10] = realElements.find(e => e.symbol === 'Cu');
    row4[11] = realElements.find(e => e.symbol === 'Zn');
    row4[12] = realElements.find(e => e.symbol === 'Ga');
    row4[13] = realElements.find(e => e.symbol === 'Ge');
    row4[14] = realElements.find(e => e.symbol === 'As');
    row4[15] = realElements.find(e => e.symbol === 'Se');
    row4[16] = realElements.find(e => e.symbol === 'Br');
    row4[17] = realElements.find(e => e.symbol === 'Kr');

    const row5 = new Array(18).fill(null);
    row5[0] = realElements.find(e => e.symbol === 'Rb');
    row5[1] = realElements.find(e => e.symbol === 'Sr');
    row5[2] = realElements.find(e => e.symbol === 'Y');
    row5[3] = realElements.find(e => e.symbol === 'Zr');
    row5[4] = realElements.find(e => e.symbol === 'Nb');
    row5[5] = realElements.find(e => e.symbol === 'Mo');
    row5[6] = realElements.find(e => e.symbol === 'Tc');
    row5[7] = realElements.find(e => e.symbol === 'Ru');
    row5[8] = realElements.find(e => e.symbol === 'Rh');
    row5[9] = realElements.find(e => e.symbol === 'Pd');
    row5[10] = realElements.find(e => e.symbol === 'Ag');
    row5[11] = realElements.find(e => e.symbol === 'Cd');
    row5[12] = realElements.find(e => e.symbol === 'In');
    row5[13] = realElements.find(e => e.symbol === 'Sn');
    row5[14] = realElements.find(e => e.symbol === 'Sb');
    row5[15] = realElements.find(e => e.symbol === 'Te');
    row5[16] = realElements.find(e => e.symbol === 'I');
    row5[17] = realElements.find(e => e.symbol === 'Xe');

    const row6 = new Array(18).fill(null);
    row6[0] = realElements.find(e => e.symbol === 'Cs');
    row6[1] = realElements.find(e => e.symbol === 'Ba');
    row6[2] = null;
    row6[3] = realElements.find(e => e.symbol === 'Hf');
    row6[4] = realElements.find(e => e.symbol === 'Ta');
    row6[5] = realElements.find(e => e.symbol === 'W');
    row6[6] = realElements.find(e => e.symbol === 'Re');
    row6[7] = realElements.find(e => e.symbol === 'Os');
    row6[8] = realElements.find(e => e.symbol === 'Ir');
    row6[9] = realElements.find(e => e.symbol === 'Pt');
    row6[10] = realElements.find(e => e.symbol === 'Au');
    row6[11] = realElements.find(e => e.symbol === 'Hg');
    row6[12] = realElements.find(e => e.symbol === 'Tl');
    row6[13] = realElements.find(e => e.symbol === 'Pb');
    row6[14] = realElements.find(e => e.symbol === 'Bi');
    row6[15] = realElements.find(e => e.symbol === 'Po');
    row6[16] = realElements.find(e => e.symbol === 'At');
    row6[17] = realElements.find(e => e.symbol === 'Rn');

    const row7 = new Array(18).fill(null);
    row7[0] = realElements.find(e => e.symbol === 'Fr');
    row7[1] = realElements.find(e => e.symbol === 'Ra');
    row7[2] = null;
    row7[3] = realElements.find(e => e.symbol === 'Rf');
    row7[4] = realElements.find(e => e.symbol === 'Db');
    row7[5] = realElements.find(e => e.symbol === 'Sg');
    row7[6] = realElements.find(e => e.symbol === 'Bh');
    row7[7] = realElements.find(e => e.symbol === 'Hs');
    row7[8] = realElements.find(e => e.symbol === 'Mt');
    row7[9] = realElements.find(e => e.symbol === 'Ds');
    row7[10] = realElements.find(e => e.symbol === 'Rg');
    row7[11] = realElements.find(e => e.symbol === 'Cn');
    row7[12] = realElements.find(e => e.symbol === 'Nh');
    row7[13] = realElements.find(e => e.symbol === 'Fl');
    row7[14] = realElements.find(e => e.symbol === 'Mc');
    row7[15] = realElements.find(e => e.symbol === 'Lv');
    row7[16] = realElements.find(e => e.symbol === 'Ts');
    row7[17] = realElements.find(e => e.symbol === 'Og');

    const lanthanidesRow = new Array(18).fill(null);
    lanthanidesRow[2] = realElements.find(e => e.symbol === 'La');
    lanthanidesRow[3] = realElements.find(e => e.symbol === 'Ce');
    lanthanidesRow[4] = realElements.find(e => e.symbol === 'Pr');
    lanthanidesRow[5] = realElements.find(e => e.symbol === 'Nd');
    lanthanidesRow[6] = realElements.find(e => e.symbol === 'Pm');
    lanthanidesRow[7] = realElements.find(e => e.symbol === 'Sm');
    lanthanidesRow[8] = realElements.find(e => e.symbol === 'Eu');
    lanthanidesRow[9] = realElements.find(e => e.symbol === 'Gd');
    lanthanidesRow[10] = realElements.find(e => e.symbol === 'Tb');
    lanthanidesRow[11] = realElements.find(e => e.symbol === 'Dy');
    lanthanidesRow[12] = realElements.find(e => e.symbol === 'Ho');
    lanthanidesRow[13] = realElements.find(e => e.symbol === 'Er');
    lanthanidesRow[14] = realElements.find(e => e.symbol === 'Tm');
    lanthanidesRow[15] = realElements.find(e => e.symbol === 'Yb');
    lanthanidesRow[16] = realElements.find(e => e.symbol === 'Lu');

    const actinidesRow = new Array(18).fill(null);
    actinidesRow[2] = realElements.find(e => e.symbol === 'Ac');
    actinidesRow[3] = realElements.find(e => e.symbol === 'Th');
    actinidesRow[4] = realElements.find(e => e.symbol === 'Pa');
    actinidesRow[5] = realElements.find(e => e.symbol === 'U');
    actinidesRow[6] = realElements.find(e => e.symbol === 'Np');
    actinidesRow[7] = realElements.find(e => e.symbol === 'Pu');
    actinidesRow[8] = realElements.find(e => e.symbol === 'Am');
    actinidesRow[9] = realElements.find(e => e.symbol === 'Cm');
    actinidesRow[10] = realElements.find(e => e.symbol === 'Bk');
    actinidesRow[11] = realElements.find(e => e.symbol === 'Cf');
    actinidesRow[12] = realElements.find(e => e.symbol === 'Es');
    actinidesRow[13] = realElements.find(e => e.symbol === 'Fm');
    actinidesRow[14] = realElements.find(e => e.symbol === 'Md');
    actinidesRow[15] = realElements.find(e => e.symbol === 'No');
    actinidesRow[16] = realElements.find(e => e.symbol === 'Lr');

    const allRows = [row1, row2, row3, row4, row5, row6, row7, lanthanidesRow, actinidesRow];

    return allRows.map((row, rowIndex) => (
      <div key={rowIndex} className="flex gap-0.5">
        {row.map((element, colIndex) => {
          const isLit = !!element && highlightedSymbols.includes(element.symbol);
          return (
            <div
              key={colIndex}
              className={`w-10 h-10 table-bg-tile${isLit ? ' table-bg-tile-lit' : ''}`}
            >
              {element ? (
                <ElementTile
                  element={element}
                  isHighlighted={false}
                  animationDelay={0}
                  size="sm"
                />
              ) : (
                <div className="w-10 h-10" />
              )}
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="flex flex-col gap-0.5">
      {renderPeriodicTable()}
    </div>
  );
};

export default PeriodicTable;
