import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const defaultCsv = path.join(
  projectRoot,
  "data",
  "reports",
  "batches",
  "city-banners-batch-001.csv"
);
const bannerFile = path.join(projectRoot, "src", "lib", "city-banners.ts");

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

function csvToObjects(file) {
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] ?? "";
    });
    return obj;
  });
}

function parseArgs(argv) {
  const args = { csv: defaultCsv, limit: 25 };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--csv" && argv[i + 1]) {
      args.csv = path.resolve(argv[i + 1]);
      i += 1;
    } else if (a === "--limit" && argv[i + 1]) {
      args.limit = Math.max(1, Number(argv[i + 1]) || 25);
      i += 1;
    }
  }
  return args;
}

function parseExistingKeys(src) {
  const keys = new Set();
  const re = /^\s*(?:"([^"]+)"|([a-zA-Z0-9_-]+))\s*:\s*\{/gm;
  let m;
  while ((m = re.exec(src))) {
    keys.add(m[1] || m[2]);
  }
  return keys;
}

function esc(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function main() {
  const args = parseArgs(process.argv);
  if (!fs.existsSync(args.csv)) {
    console.error(`CSV not found: ${args.csv}`);
    process.exit(1);
  }

  const rows = csvToObjects(args.csv)
    .filter((r) => String(r.image_url || "").trim() && String(r.attribution || "").trim())
    .slice(0, args.limit);
  if (rows.length === 0) {
    console.log("No rows with image_url + attribution found.");
    return;
  }

  const src = fs.readFileSync(bannerFile, "utf8");
  const existing = parseExistingKeys(src);

  const additions = rows
    .map((r) => ({
      slug: String(r.slug || "").trim(),
      imageUrl: String(r.image_url || "").trim(),
      attribution: String(r.attribution || "").trim(),
    }))
    .filter((r) => r.slug && r.imageUrl && r.attribution && !existing.has(r.slug));

  if (additions.length === 0) {
    console.log("All candidate banner slugs already exist.");
    return;
  }

  const insertText = additions
    .map(
      (r) =>
        `  "${esc(r.slug)}": {\n` +
        `    url: "${esc(r.imageUrl)}",\n` +
        `    attribution: "${esc(r.attribution)}",\n` +
        "  },\n"
    )
    .join("");

  const marker = "};\n\nexport function getCityBanner";
  const idx = src.indexOf(marker);
  if (idx === -1) {
    throw new Error("Could not find CITY_BANNERS closing marker.");
  }

  const next = `${src.slice(0, idx)}${insertText}${src.slice(idx)}`;
  fs.writeFileSync(bannerFile, next, "utf8");

  console.log(`Added ${additions.length} banner entries from ${args.csv}`);
}

main();
