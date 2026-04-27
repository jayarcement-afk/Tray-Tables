import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const batchCsv = path.join(
  projectRoot,
  "data",
  "reports",
  "batches",
  "dish-images-batch-001.csv"
);

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

async function wikipediaImageUrl(query) {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search" +
    `&gsrsearch=${encodeURIComponent(query)}` +
    "&gsrlimit=5&prop=pageimages|info&piprop=original|thumbnail&pithumbsize=1600&inprop=url";
  const res = await fetch(url, { headers: { "User-Agent": "TrayTablesMediaBot/1.0" } });
  if (!res.ok) return null;
  const json = await res.json();
  const pages = Object.values(json?.query?.pages ?? {});
  for (const p of pages) {
    const candidate = p?.original?.source || p?.thumbnail?.source;
    if (typeof candidate === "string" && candidate.includes("upload.wikimedia.org")) {
      return candidate;
    }
  }
  return null;
}

async function main() {
  if (!fs.existsSync(batchCsv)) {
    console.error(`Missing batch CSV: ${batchCsv}`);
    process.exit(1);
  }
  const { headers, objs } = readCsvObjects(batchCsv);
  let found = 0;
  let missing = 0;

  for (const row of objs) {
    const q = `${row.city || ""} ${row.dish_name || ""} ${row.restaurant || ""} food`;
    let img = await wikipediaImageUrl(q);
    if (!img) {
      // fallback broader query
      img = await wikipediaImageUrl(`${row.dish_name || ""} food dish`);
    }
    if (img) {
      row.source_url = img;
      row.source_notes = "Wikipedia page image (auto)";
      found += 1;
    } else {
      row.source_url = "";
      row.source_notes = "No Wikipedia image found";
      missing += 1;
    }
  }

  writeCsvObjects(batchCsv, headers, objs);
  console.log(`Wikipedia fill complete. found=${found} missing=${missing}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
