const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const extensions = ['.ts', '.tsx'];

// Map of old paths to new paths
const replacements = [
  { from: '@/components/dashboard/shared/ranking-list', to: '@/app/shared/components/ui/ranking-list' },
  { from: '@/components/dashboard/shared/stats-card', to: '@/app/shared/components/ui/stats-card' },
  { from: '@/components/dashboard/shared', to: '@/app/shared/components/ui' },
  { from: '@/components/dashboard/institution', to: '@/app/[tenant]/(dashboard)/dashboard/components/institution' },
  { from: '@/components/dashboard/professor', to: '@/app/[tenant]/(dashboard)/professor/dashboard/components' },
  { from: '@/components/dashboard/dashboard-header', to: '@/app/[tenant]/(dashboard)/dashboard/components/dashboard-header' },
  { from: '@/components/dashboard/dashboard-skeleton', to: '@/app/[tenant]/(dashboard)/dashboard/components/dashboard-skeleton' },
  { from: '@/components/dashboard/organization-switcher', to: '@/app/[tenant]/(dashboard)/dashboard/components/organization-switcher' },
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        walk(filePath);
      }
    } else {
      if (extensions.includes(path.extname(file))) {
        processFile(filePath);
      }
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const repl of replacements) {
    const regex = new RegExp(escapeRegExp(repl.from), 'g');
    if (regex.test(content)) {
      content = content.replace(regex, repl.to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

console.log('Updating dashboard imports...');
walk(path.join(rootDir, 'app'));
walk(path.join(rootDir, 'components'));
console.log('Import update complete!');
