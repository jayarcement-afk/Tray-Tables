import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const defaultBatchCsv = path.join(
  projectRoot,
  "data",
  "reports",
  "batches",
  "dish-images-batch-001.csv"
);
const WIKI_API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT =
  "TrayTablesMediaBot/1.1 (image enrichment; contact: github.com/jayarcement-afk/Tray-Tables)";
const MAX_CONCURRENCY = 1; // strict etiquette mode
const REQUESTS_PER_SECOND = 1; // strict etiquette mode
const MIN_REQUEST_INTERVAL_MS = Math.ceil(1000 / REQUESTS_PER_SECOND) + 250;
const MAX_RETRIES = 5;
let nextAllowedRequestAt = 0;

function parseArgs(argv) {
  const args = { csv: defaultBatchCsv };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--csv" && argv[i + 1]) {
      args.csv = path.resolve(argv[i + 1]);
      i += 1;
    }
  }
  return args;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let i = 0;
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }
    if (ch === "\r") {
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function readCsvObjects(file) {
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const headers = rows[0] ?? [];
  const objs = rows.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, i) => {
      o[h] = r[i] ?? "";
    });
    return o;
  });
  return { headers, objs };
}

function writeCsvObjects(file, headers, objs) {
  const out = [
    headers.join(","),
    ...objs.map((o) => headers.map((h) => csvEscape(o[h])).join(",")),
  ].join("\n");
  fs.writeFileSync(file, `${out}\n`, "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(value) {
  if (!value) return 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds * 1000);
  }
  const when = Date.parse(value);
  if (!Number.isNaN(when)) {
    return Math.max(0, when - Date.now());
  }
  return 0;
}

async function throttle() {
  const now = Date.now();
  if (now < nextAllowedRequestAt) {
    await sleep(nextAllowedRequestAt - now);
  }
  nextAllowedRequestAt = Date.now() + MIN_REQUEST_INTERVAL_MS;
}

async function fetchJsonWithRetry(url) {
  let lastErr = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    await throttle();
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) {
      return res.json();
    }
    if (res.status === 429) {
      const retryAfterMs = parseRetryAfterMs(res.headers.get("retry-after"));
      const backoffMs = Math.max(retryAfterMs, 500 * 2 ** attempt);
      await sleep(backoffMs);
      continue;
    }
    lastErr = new Error(`HTTP ${res.status} ${res.statusText}`);
    break;
  }
  if (lastErr) throw lastErr;
  return null;
}

async function searchCandidateTitles(query) {
  const url =
    `${WIKI_API}?action=opensearch&format=json` +
    `&search=${encodeURIComponent(query)}&limit=5&namespace=0`;
  const json = await fetchJsonWithRetry(url);
  const titles = Array.isArray(json?.[1]) ? json[1] : [];
  return titles.filter((t) => typeof t === "string" && t.trim());
}

async function searchCandidateTitlesGenerator(query) {
  const url =
    `${WIKI_API}?action=query&format=json&generator=search` +
    `&gsrsearch=${encodeURIComponent(query)}` +
    "&gsrlimit=5&gsrnamespace=0&prop=info&inprop=url";
  const json = await fetchJsonWithRetry(url);
  const pages = Object.values(json?.query?.pages ?? {});
  return pages
    .map((p) => p?.title)
    .filter((t) => typeof t === "string" && t.trim());
}

async function imageUrlForTitles(titles) {
  if (!titles.length) return null;
  // Batch lookup with pipe-separated titles per Wikipedia API recommendations.
  const titleParam = titles.join("|");
  const url =
    `${WIKI_API}?action=query&format=json` +
    `&titles=${encodeURIComponent(titleParam)}` +
    "&prop=pageimages|info&piprop=original|thumbnail&pithumbsize=1600&inprop=url";
  const json = await fetchJsonWithRetry(url);
  const pages = Object.values(json?.query?.pages ?? {});
  for (const p of pages) {
    const candidate = p?.original?.source || p?.thumbnail?.source;
    if (typeof candidate === "string" && candidate.includes("upload.wikimedia.org")) {
      return candidate;
    }
  }
  return null;
}

async function wikipediaImageUrlForRow(row) {
  const queries = [
    `${row.city || ""} ${row.dish_name || ""} ${row.restaurant || ""} food`,
    `${row.dish_name || ""} ${row.city || ""} food`,
    `${row.dish_name || ""} ${row.country || ""} cuisine`,
  ].map((q) => q.replace(/\s+/g, " ").trim());

  for (const query of queries) {
    if (!query) continue;
    const openSearchTitles = await searchCandidateTitles(query);
    const generatorTitles = await searchCandidateTitlesGenerator(query);
    const titles = Array.from(new Set([...openSearchTitles, ...generatorTitles]));
    const image = await imageUrlForTitles(titles);
    if (image) return image;
  }
  return null;
}

async function runWithConcurrency(items, worker, maxConcurrency) {
  let idx = 0;
  const pool = Array.from({ length: Math.min(maxConcurrency, items.length) }, async () => {
    while (idx < items.length) {
      const current = idx;
      idx += 1;
      await worker(items[current], current);
    }
  });
  await Promise.all(pool);
}

async function main() {
  const args = parseArgs(process.argv);
  const batchCsv = args.csv;
  if (!fs.existsSync(batchCsv)) {
    console.error(`Missing batch CSV: ${batchCsv}`);
    process.exit(1);
  }
  const { headers, objs } = readCsvObjects(batchCsv);
  let found = 0;
  let missing = 0;

  await runWithConcurrency(
    objs,
    async (row) => {
      const img = await wikipediaImageUrlForRow(row);
      if (img) {
        row.source_url = img;
        row.source_notes = "Wikipedia page image (auto, policy-limited)";
        found += 1;
      } else {
        row.source_url = "";
        row.source_notes = "No Wikipedia image found";
        missing += 1;
      }
    },
    MAX_CONCURRENCY
  );

  writeCsvObjects(batchCsv, headers, objs);
  console.log(
    `Wikipedia fill complete. found=${found} missing=${missing} concurrency=${MAX_CONCURRENCY} rps<=${REQUESTS_PER_SECOND}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
