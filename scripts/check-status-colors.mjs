import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const TARGET_DIRS = ["components/ui", "components/shared"];

const FILE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);

const FORBIDDEN = /\b(bg|text|border|ring)-(red|yellow|blue|green)-(50|100|200|300|400|500|600|700|800|900)\b/g;

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip common large dirs, even if someone runs from repo root
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      out.push(...walk(full));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (FILE_EXTS.has(ext)) out.push(full);
    }
  }
  return out;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const matches = [];
  let m;
  while ((m = FORBIDDEN.exec(content)) !== null) {
    matches.push(m[0]);
  }
  return Array.from(new Set(matches));
}

const violations = [];

for (const relDir of TARGET_DIRS) {
  const absDir = path.join(ROOT, relDir);
  if (!fs.existsSync(absDir)) continue;
  for (const file of walk(absDir)) {
    const hits = scanFile(file);
    if (hits.length > 0) {
      violations.push({
        file: path.relative(ROOT, file),
        hits,
      });
    }
  }
}

if (violations.length > 0) {
  console.error("Encontrado uso direto de cores (red/yellow/blue/green) em components/ui ou components/shared.");
  console.error("Use tokens semânticos: bg-status-*, text-status-*-text, etc.");
  for (const v of violations) {
    console.error(`- ${v.file}: ${v.hits.join(", ")}`);
  }
  process.exit(1);
}

console.log("OK: nenhum uso direto de red/yellow/blue/green em components/ui e components/shared.");



