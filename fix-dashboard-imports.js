const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const extensions = ['.ts', '.tsx'];

// Map specific imports to their new locations
const replacements = [
  // Shared UI components (moved to app/shared/components/ui)
  { from: '@/app/shared/components/dashboard/shared/ranking-list', to: '@/app/shared/components/ui/ranking-list' },
  { from: '@/app/shared/components/dashboard/shared/stats-card', to: '@/app/shared/components/ui/stats-card' },
  
  // Institution components (moved to dashboard module)
  { from: '@/app/shared/components/dashboard/institution', to: '@/app/[tenant]/(dashboard)/dashboard/components/institution' },
  
  // Professor components (moved to professor module)
  { from: '@/app/shared/components/dashboard/professor', to: '@/app/[tenant]/(dashboard)/professor/dashboard/components' },
  
  // Main dashboard components
  { from: '@/app/shared/components/dashboard/dashboard-header', to: '@/app/[tenant]/(dashboard)/dashboard/components/dashboard-header' },
  { from: '@/app/shared/components/dashboard/dashboard-skeleton', to: '@/app/[tenant]/(dashboard)/dashboard/components/dashboard-skeleton' },
  { from: '@/app/shared/components/dashboard/organization-switcher', to: '@/app/[tenant]/(dashboard)/dashboard/components/organization-switcher' },
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next' && file !== 'dashboard') {
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
  let original = content;

  // Apply replacements in order (most specific first)
  for (const repl of replacements) {
    const regex = new RegExp(escapeRegExp(repl.from), 'g');
    if (regex.test(content)) {
      content = content.replace(regex, repl.to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated: ${path.relative(rootDir, filePath)}`);
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

console.log('Fixing dashboard imports...\n');
walk(path.join(rootDir, 'app'));
console.log('\n✅ All imports fixed!');
