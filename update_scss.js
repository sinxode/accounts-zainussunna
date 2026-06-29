const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/components/ui/NotificationCenter.module.scss',
  'frontend/src/components/ui/CommandPalette.module.scss',
  'frontend/src/components/layout/AppLayout.module.scss',
  'frontend/src/components/layout/Header.module.scss',
  'frontend/src/components/layout/Sidebar.module.scss',
  'frontend/src/components/layout/UserMenu.module.scss',
  'frontend/src/components/ui/Badge.module.scss',
  'frontend/src/components/ui/QuickActionCard.module.scss',
  'frontend/src/components/ui/Skeleton.module.scss',
  'frontend/src/components/ui/Modal.module.scss',
  'frontend/src/components/ui/DataTable.module.scss',
  'frontend/src/components/ui/EmptyState.module.scss',
  'frontend/src/components/ui/SearchInput.module.scss',
  'frontend/src/components/ui/PageContainer.module.scss',
  'frontend/src/components/ui/PageHeader.module.scss',
  'frontend/src/components/ui/Input.module.scss',
  'frontend/src/components/ui/StatCard.module.scss',
  'frontend/src/components/ui/Card.module.scss',
  'frontend/src/components/ui/Button.module.scss',
  'frontend/src/pages/reports/FinancialSummary.module.scss',
  'frontend/src/pages/reports/BorrowerReports.module.scss',
  'frontend/src/pages/settings/AuditLogs.module.scss',
  'frontend/src/pages/settings/GlobalSettings.module.scss',
  'frontend/src/pages/settings/UserManagement.module.scss',
  'frontend/src/pages/settings/AccountingPeriods.module.scss',
  'frontend/src/pages/reports/MonthlyReports.module.scss',
  'frontend/src/pages/reports/Analytics.module.scss',
  'frontend/src/pages/reports/StudentReports.module.scss',
  'frontend/src/components/reports/ChartCard.module.scss',
  'frontend/src/components/operations/CollectionWizard.module.scss',
  'frontend/src/components/operations/DepositDrawer.module.scss',
  'frontend/src/pages/Login.module.scss',
  'frontend/src/pages/events/EventDashboard.module.scss',
  'frontend/src/pages/students/AllStudents.module.scss',
  'frontend/src/pages/Operations.module.scss',
  'frontend/src/pages/Dashboard.module.scss'
];

const clrMap = {
  'clr\\("text", "muted"\\)': '$text-muted',
  'clr\\("text", "dim"\\)': '$text-muted',
  'clr\\("text", "main"\\)': '$text-primary',
  'clr\\("text", "secondary"\\)': '$text-secondary',
  'clr\\("bg", "main"\\)': '$bg-primary',
  'clr\\("bg", "surface-light"\\)': '$bg-secondary',
  'clr\\("bg", "surface"\\)': '$bg-secondary',
  'clr\\("border", "light"\\)': '$border-color',
  'clr\\("accent", "primary"\\)': '$primary',
  'clr\\("accent", "success"\\)': '$success',
  'clr\\("accent", "error"\\)': '$danger',
  'clr\\("accent", "warning"\\)': '$warning',
  'clr\\("accent", "info"\\)': '$info'
};

const spaceMap = {
  'space\\("xs"\\)': '0.25rem',
  'space\\("sm"\\)': '0.5rem',
  'space\\("md"\\)': '1rem',
  'space\\("lg"\\)': '1.5rem',
  'space\\("xl"\\)': '2rem',
  'space\\("xxl"\\)': '3rem'
};

const varMap = {
  '\\$bg-dark': '$bg-primary',
  '\\$text-main': '$text-primary',
  '\\$accent-primary': '$primary'
};

files.forEach(file => {
  const absolutePath = path.resolve(file);
  let content = fs.readFileSync(absolutePath, 'utf8');

  // Determine relative path to src/styles/design-system/variables
  const depth = file.split('/').length - 3; // frontend/src/ is depth 0
  const relPath = '../'.repeat(depth) + 'styles/design-system/variables';

  // Replace imports
  // Remove all existing design-system related imports first
  content = content.replace(/@import ['"].*design-system\/.*['"];?\n?/g, '');
  content = content.replace(/@import ['"].*\/styles\/mixins['"];?\n?/g, '');
  content = content.replace(/@import ['"].*\/styles\/variables['"];?\n?/g, '');
  
  // Add the single correct import at the top
  content = `@import '${relPath}';\n` + content;

  // Replace functions
  for (const [key, value] of Object.entries(clrMap)) {
    content = content.replace(new RegExp(key, 'g'), value);
  }
  for (const [key, value] of Object.entries(spaceMap)) {
    content = content.replace(new RegExp(key, 'g'), value);
  }
  for (const [key, value] of Object.entries(varMap)) {
    content = content.replace(new RegExp(key, 'g'), value);
  }

  // Clean up multiple variables imports if any (though we tried to remove them)
  // and handle potential double newlines at top
  content = content.replace(/^(@import '.*';\n)+/, `@import '${relPath}';\n`);

  fs.writeFileSync(absolutePath, content);
  console.log(`Updated ${file}`);
});
