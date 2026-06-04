const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const modules = [
  'erp-locations',
  'erp-users',
  'erp-apps',
  'erp-centers',
  'erp-academics',
  'chronogest-schedules',
  'chronogest-requests'
];

const dataSourcePath = path.join(__dirname, 'src/config/data-source.ts');
const originalDataSource = fs.readFileSync(dataSourcePath, 'utf8');

try {
  for (const mod of modules) {
    console.log(`Generating migration for ${mod}...`);
    // Rewrite data-source.ts to only include entities of the current module
    const tempDataSource = originalDataSource.replace(
      `entities: ['src/**/*.entity{.ts,.js}']`,
      `entities: ['src/modules/${mod}/**/*.entity{.ts,.js}']`
    );
    fs.writeFileSync(dataSourcePath, tempDataSource);

    // Create the infrastructure/migrations directory
    const migrationsDir = path.join(__dirname, `src/modules/${mod}/infrastructure/migrations`);
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    // Run TypeORM CLI
    try {
      execSync(`npm run typeorm -- migration:generate src/modules/${mod}/infrastructure/migrations/${mod.replace('-', '')}Initial -d src/config/data-source.ts`, { stdio: 'inherit' });
    } catch (e) {
      console.log(`Nothing to generate or error for ${mod}`);
    }
  }
} finally {
  // Restore original data-source.ts
  fs.writeFileSync(dataSourcePath, originalDataSource);
}
