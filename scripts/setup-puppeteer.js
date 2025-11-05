/**
 * Setup Puppeteer for Render.com deployment
 *
 * This script installs Chrome during the build process on Render.
 * It only runs in production environments, not during local development.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Only install Chrome in production (Render)
if (process.env.RENDER || process.env.NODE_ENV === 'production') {
  console.log('📦 Installing Chrome for Puppeteer on Render...');

  try {
    // Create cache directory if it doesn't exist
    const cacheDir = process.env.PUPPETEER_CACHE_DIR || '/opt/render/.cache/puppeteer';
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
      console.log(`✅ Created cache directory: ${cacheDir}`);
    }

    // Install Chrome browser for Puppeteer
    execSync('npx puppeteer browsers install chrome', {
      stdio: 'inherit',
      env: {
        ...process.env,
        PUPPETEER_CACHE_DIR: cacheDir
      }
    });

    console.log('✅ Chrome installed successfully for PDF generation');

    // List installed browsers to verify
    console.log('📋 Listing installed browsers...');
    execSync('npx puppeteer browsers list', { stdio: 'inherit' });

  } catch (error) {
    console.error('❌ Failed to install Chrome:', error.message);
    console.log('⚠️  PDF export may not work without Chrome');
    // Don't fail the build, just warn
    process.exit(0); // Exit successfully to not block deployment
  }
} else {
  console.log('⏭️  Skipping Chrome installation (local development)');
}
