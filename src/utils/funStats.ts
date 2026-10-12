export function getFunStatsLine(realCount: number, total: number): string {
  if (total === 0) return '';
  if (realCount === total) {
    return total === 1
      ? "100% real — the periodic table had you covered."
      : `All ${total} real — the periodic table had you covered.`;
  }
  if (realCount === 0) return "Zero real elements — you're beyond the known periodic table.";
  const pct = realCount / total;
  if (pct >= 0.75) return `${realCount} of ${total} real — practically a chemist.`;
  if (pct >= 0.5) return `${realCount} of ${total} real — more fact than fiction.`;
  return `${realCount} of ${total} real — science is still catching up to you.`;
}
