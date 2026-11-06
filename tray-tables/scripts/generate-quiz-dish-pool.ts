/**
 * Writes src/data/quiz-dish-pool.generated.json for the slim Vercel bundle on
 * /api/games/guess-dish-country/round. Run via prebuild (tsx).
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { serializeQuizPoolForStatic } from "../src/lib/guess-dish-country-round-impl";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "src/data/quiz-dish-pool.generated.json");

const dishes = serializeQuizPoolForStatic();
writeFileSync(
  outPath,
  JSON.stringify({ generated: new Date().toISOString(), dishes }, null, 2),
  "utf8"
);
console.log("Wrote quiz pool:", outPath, "entries:", dishes.length);
