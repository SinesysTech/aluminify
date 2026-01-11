import fs from 'node:fs';
import path from 'node:path';

/**
 * Color audit script
 *
 * Outputs:
 * - docs/CORES_USADAS.md (human-readable)
 * - docs/cores-audit.json (full occurrences with file + line)
 */

const WORKSPACE_ROOT = path.resolve(process.cwd());

const TARGET_DIRS = ['app', 'components', 'lib', 'backend', 'public'];
const IGNORE_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'coverage',
  '.turbo',
  '.vercel',
  '.cache',
]);

// Keep docs out (but still scan app/(landing) HTML etc).
const IGNORE_PATH_CONTAINS = ['/docs/', '\\docs\\'];

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.css',
  '.html',
  '.md',
  '.svg',
  '.json',
]);

/** @type {RegExp} */
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const RGB_RE = /\brgba?\([^)]*\)/g;
const HSL_RE = /\bhsla?\([^)]*\)/g;
const OKLCH_RE = /\boklch\([^)]*\)/g;

// Tailwind arbitrary colors: bg-[#...] etc (including variants like hover:bg-[#...])
const TW_ARBITRARY_RE =
  /(?:^|\s)(?:[a-z-]+:)*((?:bg|text|border|ring|stroke|fill)-\[#(?:[0-9a-fA-F]{3,8})\])(?=$|\s|["'`<>])/g;

// Tailwind semantic tokens mapped from globals.css (@theme inline mapping)
// Includes variants like dark:hover:bg-background.
const TW_SEMANTIC_RE =
  /(?:^|\s)(?:[a-z-]+:)*((?:bg|text|border|ring|stroke|fill)-(?:background|foreground|card|card-foreground|popover|popover-foreground|primary|primary-foreground|secondary|secondary-foreground|muted|muted-foreground|accent|accent-foreground|destructive|destructive-foreground|border|input|ring|chart-[1-5]|sidebar(?:-[a-z-]+)?|status-(?:error|warning|info|success)(?:-[a-z-]+)?))(?=$|\s|["'`<>])/g;

const CSS_VAR_DEF_RE = /^\s*(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/;
const CSS_VAR_REF_RE = /var\((--[a-zA-Z0-9-]+)(?:\s*,[^)]*)?\)/g;

function shouldIgnorePath(p) {
  return IGNORE_PATH_CONTAINS.some((part) => p.includes(part));
}

function walkDir(absDir, outFiles) {
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.name.startsWith('.')) continue;
    const abs = path.join(absDir, ent.name);
    if (ent.isDirectory()) {
      if (IGNORE_DIRS.has(ent.name)) continue;
      walkDir(abs, outFiles);
      continue;
    }
    const ext = path.extname(ent.name).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext)) continue;
    if (shouldIgnorePath(abs)) continue;
    outFiles.push(abs);
  }
}

function addOccurrence(map, key, occ) {
  if (!map[key]) map[key] = [];
  map[key].push(occ);
}

function scanFile(absPath, result) {
  let content;
  try {
    content = fs.readFileSync(absPath, 'utf8');
  } catch {
    return;
  }

  const rel = path.relative(WORKSPACE_ROOT, absPath).replace(/\\/g, '/');
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const line = lines[i];

    // CSS variables
    if (rel.endsWith('.css')) {
      const m = line.match(CSS_VAR_DEF_RE);
      if (m) {
        const [, varName, varValue] = m;
        addOccurrence(result.cssVariables.definitions, varName, {
          file: rel,
          line: lineNo,
          value: varValue.trim(),
          text: line.trim(),
        });
      }
    }

    // CSS var references (any text file)
    for (const m of line.matchAll(CSS_VAR_REF_RE)) {
      const varName = m[1];
      addOccurrence(result.cssVariables.references, varName, {
        file: rel,
        line: lineNo,
        text: line.trim(),
      });
    }

    // Raw colors
    for (const m of line.matchAll(HEX_RE)) {
      addOccurrence(result.colors.hex, m[0], { file: rel, line: lineNo, text: line.trim() });
    }
    for (const m of line.matchAll(RGB_RE)) {
      addOccurrence(result.colors.rgb, m[0], { file: rel, line: lineNo, text: line.trim() });
    }
    for (const m of line.matchAll(HSL_RE)) {
      addOccurrence(result.colors.hsl, m[0], { file: rel, line: lineNo, text: line.trim() });
    }
    for (const m of line.matchAll(OKLCH_RE)) {
      addOccurrence(result.colors.oklch, m[0], { file: rel, line: lineNo, text: line.trim() });
    }

    // Tailwind classes
    for (const m of line.matchAll(TW_ARBITRARY_RE)) {
      addOccurrence(result.tailwind.arbitrary, m[1], { file: rel, line: lineNo, text: line.trim() });
    }
    for (const m of line.matchAll(TW_SEMANTIC_RE)) {
      addOccurrence(result.tailwind.semantic, m[1], { file: rel, line: lineNo, text: line.trim() });
    }
  }
}

function formatTopOccurrences(occs, max = 20) {
  if (!occs || occs.length === 0) return '';
  const shown = occs.slice(0, max);
  const hidden = occs.length - shown.length;
  const lines = shown.map((o) => `- \`${o.file}:${o.line}\`  ${o.text}`);
  if (hidden > 0) lines.push(`- ... +${hidden} ocorrências`);
  return lines.join('\n');
}

function sortedKeysByCount(obj) {
  return Object.keys(obj).sort((a, b) => (obj[b]?.length ?? 0) - (obj[a]?.length ?? 0));
}

function writeOutputs(result) {
  const outJsonPath = path.join(WORKSPACE_ROOT, 'docs', 'cores-audit.json');
  const outMdPath = path.join(WORKSPACE_ROOT, 'docs', 'CORES_USADAS.md');

  fs.mkdirSync(path.dirname(outJsonPath), { recursive: true });
  fs.writeFileSync(outJsonPath, JSON.stringify(result, null, 2), 'utf8');

  const md = [];
  md.push(`# Auditoria de Cores (auto-gerado)\n`);
  md.push(`- Gerado em: \`${new Date(result.generatedAt).toISOString()}\``);
  md.push(`- Arquivos analisados: **${result.scannedFiles}**`);
  md.push(`- Pastas analisadas: \`${TARGET_DIRS.join(', ')}\``);
  md.push(`\n> Observação: este relatório lista **todas as ocorrências** no JSON em \`docs/cores-audit.json\`.\n`);

  md.push(`## 1) Tokens/Variáveis CSS (definições)\n`);
  const varKeys = sortedKeysByCount(result.cssVariables.definitions);
  for (const k of varKeys) {
    md.push(`### \`${k}\` (definições: ${result.cssVariables.definitions[k].length})\n`);
    md.push(formatTopOccurrences(result.cssVariables.definitions[k], 50));
    md.push('');
  }

  md.push(`## 2) Tokens/Variáveis CSS (referências via var(--...))\n`);
  const varRefKeys = sortedKeysByCount(result.cssVariables.references);
  for (const k of varRefKeys) {
    md.push(`### \`${k}\` (referências: ${result.cssVariables.references[k].length})\n`);
    md.push(formatTopOccurrences(result.cssVariables.references[k], 50));
    md.push('');
  }

  md.push(`## 3) Cores hardcoded (HEX)\n`);
  const hexKeys = sortedKeysByCount(result.colors.hex);
  for (const k of hexKeys) {
    md.push(`### \`${k}\` (ocorrências: ${result.colors.hex[k].length})\n`);
    md.push(formatTopOccurrences(result.colors.hex[k], 30));
    md.push('');
  }

  md.push(`## 4) Cores hardcoded (RGB/RGBA)\n`);
  const rgbKeys = sortedKeysByCount(result.colors.rgb);
  for (const k of rgbKeys) {
    md.push(`### \`${k}\` (ocorrências: ${result.colors.rgb[k].length})\n`);
    md.push(formatTopOccurrences(result.colors.rgb[k], 30));
    md.push('');
  }

  md.push(`## 5) Cores hardcoded (HSL/HSLA)\n`);
  const hslKeys = sortedKeysByCount(result.colors.hsl);
  for (const k of hslKeys) {
    md.push(`### \`${k}\` (ocorrências: ${result.colors.hsl[k].length})\n`);
    md.push(formatTopOccurrences(result.colors.hsl[k], 30));
    md.push('');
  }

  md.push(`## 6) Cores hardcoded (OKLCH)\n`);
  const oklchKeys = sortedKeysByCount(result.colors.oklch);
  for (const k of oklchKeys) {
    md.push(`### \`${k}\` (ocorrências: ${result.colors.oklch[k].length})\n`);
    md.push(formatTopOccurrences(result.colors.oklch[k], 30));
    md.push('');
  }

  md.push(`## 7) Tailwind: cores arbitrárias (bg/text/... [#...])\n`);
  const twArbKeys = sortedKeysByCount(result.tailwind.arbitrary);
  for (const k of twArbKeys) {
    md.push(`### \`${k}\` (ocorrências: ${result.tailwind.arbitrary[k].length})\n`);
    md.push(formatTopOccurrences(result.tailwind.arbitrary[k], 30));
    md.push('');
  }

  md.push(`## 8) Tailwind: tokens semânticos (bg-background, text-muted-foreground, ...)\n`);
  const twSemKeys = sortedKeysByCount(result.tailwind.semantic);
  for (const k of twSemKeys) {
    md.push(`### \`${k}\` (ocorrências: ${result.tailwind.semantic[k].length})\n`);
    md.push(formatTopOccurrences(result.tailwind.semantic[k], 30));
    md.push('');
  }

  fs.writeFileSync(outMdPath, md.join('\n'), 'utf8');
  return { outJsonPath, outMdPath };
}

function main() {
  /** @type {string[]} */
  const files = [];
  for (const dir of TARGET_DIRS) {
    const abs = path.join(WORKSPACE_ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    walkDir(abs, files);
  }

  const result = {
    generatedAt: Date.now(),
    scannedFiles: files.length,
    colors: {
      hex: {},
      rgb: {},
      hsl: {},
      oklch: {},
    },
    tailwind: {
      arbitrary: {},
      semantic: {},
    },
    cssVariables: {
      definitions: {},
      references: {},
    },
  };

  for (const f of files) scanFile(f, result);

  const { outJsonPath, outMdPath } = writeOutputs(result);
  console.log(`OK: ${path.relative(WORKSPACE_ROOT, outMdPath)}`);
  console.log(`OK: ${path.relative(WORKSPACE_ROOT, outJsonPath)}`);
}

main();
