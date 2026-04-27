import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const reportsDir = path.join(projectRoot, "data", "reports");
const batchesDir = path.join(reportsDir, "batches");

const dishIn = path.join(reportsDir, "missing-dish-images.csv");
const cityIn = path.join(reportsDir, "missing-city-banners.csv");

const dishOut = path.join(batchesDir, "dish-images-batch-001.csv");
const cityOut = path.join(batchesDir, "city-banners-batch-001.csv");

const DISH_BATCH_SIZE = 100;
const CITY_BATCH_SIZE = 25;

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

function csvEscape(value) {
  const s = String(value ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toObjects(rows) {
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((r) => {
    const out = {};
    headers.forEach((h, idx) => {
      out[h] = r[idx] ?? "";
    });
    return out;
  });
}

function toCsv(headers, objects) {
  return [
    headers.join(","),
    ...objects.map((obj) => headers.map((h) => csvEscape(obj[h])).join(",")),
  ].join("\n");
}

function readCsvObjects(file) {
  const raw = fs.readFileSync(file, "utf8");
  const rows = parseCsv(raw);
  const headers = rows[0] ?? [];
  return { headers, objects: toObjects(rows) };
}

function writeCsvObjects(file, headers, objects) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${toCsv(headers, objects)}\n`, "utf8");
}

function main() {
  if (!fs.existsSync(dishIn) || !fs.existsSync(cityIn)) {
    console.error(
      "Missing reports. Run: npm run data:missing-media-report first."
    );
    process.exit(1);
  }

  const { headers: dishHeaders, objects: dishRows } = readCsvObjects(dishIn);
  const { headers: cityHeaders, objects: cityRows } = readCsvObjects(cityIn);

  const dishBatch = dishRows.slice(0, DISH_BATCH_SIZE);
  const cityBatch = cityRows.slice(0, CITY_BATCH_SIZE);

  writeCsvObjects(dishOut, dishHeaders, dishBatch);
  writeCsvObjects(cityOut, cityHeaders, cityBatch);

  console.log(
    `Prepared ${dishBatch.length} dish rows -> ${dishOut}\nPrepared ${cityBatch.length} city rows -> ${cityOut}`
  );
}

main();
