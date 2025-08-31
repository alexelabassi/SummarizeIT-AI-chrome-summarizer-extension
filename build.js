import { copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

async function copyStaticFiles() {
  const filesToCopy = [
    { src: 'ext/manifest.json', dest: 'dist/manifest.json' },
    { src: 'ext/popup/index.html', dest: 'dist/popup.html' },
    { src: 'ext/popup/popup.css', dest: 'dist/popup.css' },
    { src: 'ext/options/index.html', dest: 'dist/options.html' },
    { src: 'ext/options/options.css', dest: 'dist/options.css' },
    { src: 'ext/content/toast.css', dest: 'dist/toast.css' }
  ];

  // Create assets directory
  if (!existsSync('dist/assets')) {
    await mkdir('dist/assets', { recursive: true });
  }

  // Copy icon placeholders
  const iconFiles = [
    'ext/assets/icon-16.png',
    'ext/assets/icon-32.png', 
    'ext/assets/icon-48.png',
    'ext/assets/icon-128.png'
  ];

  for (const iconFile of iconFiles) {
    const dest = iconFile.replace('ext/', 'dist/');
    await copyFile(iconFile, dest);
  }

  // Copy other static files
  for (const file of filesToCopy) {
    await copyFile(file.src, file.dest);
  }

  console.log('✅ Static files copied to dist/');
}

copyStaticFiles().catch(console.error);
