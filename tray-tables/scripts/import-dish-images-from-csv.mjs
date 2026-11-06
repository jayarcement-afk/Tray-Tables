import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const defaultCsv = path.join(
  projectRoot,
  "data",
  "reports",
  "batches",
  "dish-images-batch-001.csv"
);
const imageDir = path.join(projectRoot, "public", "Images");

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
  const args = { csv: defaultCsv, limit: 100, overwrite: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--csv" && argv[i + 1]) {
      args.csv = path.resolve(argv[i + 1]);
      i += 1;
    } else if (a === "--limit" && argv[i + 1]) {
      args.limit = Math.max(1, Number(argv[i + 1]) || 100);
      i += 1;
    } else if (a === "--overwrite") {
      args.overwrite = true;
    }
  }
  return args;
}

function safeFilename(name, fallbackId) {
  const raw = String(name || "").trim();
  const file = raw || `${fallbackId}.jpg`;
  return file.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_");
}

async function downloadToFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
}

function runReindex() {
  const result = spawnSync("npm", ["run", "data:dish-images"], {
    cwd: projectRoot,
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error("Failed to regenerate dish image index");
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (!fs.existsSync(args.csv)) {
    console.error(`CSV not found: ${args.csv}`);
    process.exit(1);
  }

  fs.mkdirSync(imageDir, { recursive: true });

  const rows = csvToObjects(args.csv)
    .filter((r) => String(r.source_url || "").trim())
    .slice(0, args.limit);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const id = String(row.id || "").trim();
    const sourceUrl = String(row.source_url || "").trim();
    const filename = safeFilename(row.expected_filename, id || "dish-image");
    const dest = path.join(imageDir, filename);

    if (fs.existsSync(dest) && !args.overwrite) {
      skipped += 1;
      continue;
    }

    try {
      await downloadToFile(sourceUrl, dest);
      downloaded += 1;
      console.log(`downloaded: ${filename}`);
    } catch (err) {
      failed += 1;
      console.warn(`failed: ${filename} <- ${sourceUrl} (${err.message})`);
    }
  }

  if (downloaded > 0 || args.overwrite) {
    runReindex();
  }

  console.log(
    `done. downloaded=${downloaded} skipped=${skipped} failed=${failed} csv=${args.csv}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
