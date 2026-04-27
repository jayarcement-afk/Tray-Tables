import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const dishBatch = path.join(
  projectRoot,
  "data",
  "reports",
  "batches",
  "dish-images-batch-001.csv"
);
const cityBatch = path.join(
  projectRoot,
  "data",
  "reports",
  "batches",
  "city-banners-batch-001.csv"
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

function unsplashSourceUrl(query, width, height) {
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(query)}`;
}

function fillDishBatch() {
  const { headers, objs } = readCsvObjects(dishBatch);
  let filled = 0;
  for (const row of objs) {
    if (String(row.source_url || "").trim()) continue;
    const q = `${row.search_query || ""} food dish restaurant plate`;
    row.source_url = unsplashSourceUrl(q, 1600, 1200);
    row.source_notes = "auto-filled (Unsplash Source query)";
    filled += 1;
  }
  writeCsvObjects(dishBatch, headers, objs);
  return filled;
}

function fillCityBatch() {
  const { headers, objs } = readCsvObjects(cityBatch);
  let filled = 0;
  for (const row of objs) {
    if (!String(row.image_url || "").trim()) {
      const q = `${row.city || ""} ${row.country || ""} skyline cityscape`;
      row.image_url = unsplashSourceUrl(q, 2400, 1200);
      filled += 1;
    }
    if (!String(row.attribution || "").trim()) {
      row.attribution = "Unsplash (auto query)";
    }
    if (!String(row.source_notes || "").trim()) {
      row.source_notes = "auto-filled (Unsplash Source query)";
    }
  }
  writeCsvObjects(cityBatch, headers, objs);
  return filled;
}

function main() {
  const dish = fillDishBatch();
  const city = fillCityBatch();
  console.log(`Filled ${dish} dish source URLs and ${city} city image URLs.`);
}

main();
