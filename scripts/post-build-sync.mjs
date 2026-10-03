import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const nextDir = path.join(root, '.next');
const distDir = path.join(root, 'dist');

try {
  if (fs.existsSync(nextDir)) {
    fs.cpSync(nextDir, distDir, { recursive: true });
    console.log('[post-build-sync] Synced .next -> dist successfully (routes-manifest.json verified: ' + fs.existsSync(path.join(distDir, 'routes-manifest.json')) + ')');
  }
} catch (err) {
  console.error('[post-build-sync] Warning syncing build output:', err);
}
