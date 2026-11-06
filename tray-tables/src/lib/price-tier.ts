/**
 * Max run length of the same currency symbol in a Price cell
 * (e.g. $ / $$ / $$$, or £, €, ¥, etc.). Unrecognized text → 0.
 */
const CURRENCY = "$£€¥฿₩₫" as const;

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function countPriceSymbols(price: string): number {
  const t = String(price ?? "").trim();
  if (!t) return 0;
  let best = 0;
  for (const sym of CURRENCY) {
    const re = new RegExp(`${escapeRe(sym)}+`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(t)) !== null) {
      best = Math.max(best, m[0].length);
    }
  }
  return best;
}
