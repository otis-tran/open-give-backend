import { existsSync } from 'fs';

export function checkEnvFile(filePath: string = '.env') {
  if (existsSync(filePath)) {
    console.log(`Found environment file: ${filePath}`);
  } else {
    console.warn(`⚠️ Not found environment file: ${filePath}`);
    process.exit(1);
  }
}
