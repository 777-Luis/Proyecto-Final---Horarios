import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const packageJsonPath = join(process.cwd(), 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

packageJson.scripts['typeorm'] = 'ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js';
packageJson.scripts['migration:generate'] = 'npm run typeorm -- migration:generate -d src/config/data-source.ts';
packageJson.scripts['migration:run'] = 'npm run typeorm -- migration:run -d src/config/data-source.ts';
packageJson.scripts['migration:revert'] = 'npm run typeorm -- migration:revert -d src/config/data-source.ts';

writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
