/**
 * Setup Puppeteer for Render.com deployment
 *
 * This script installs Chrome during the build process on Render.
 * It only runs in production environments, not during local development.
 */

const { execSync } = require('child_process');

// Only install Chrome in production (Render)
if (process.env.RENDER || process.env.NODE_ENV === 'production') {
  console.log('📦 Installing Chrome for Puppeteer on Render...');

  try {
    // Install Chrome browser for Puppeteer
    execSync('npx puppeteer browsers install chrome', {
      stdio: 'inherit',
      env: {
        ...process.env,
        PUPPETEER_CACHE_DIR: '/opt/render/.cache/puppeteer'
      }
    });

    console.log('✅ Chrome installed successfully for PDF generation');
  } catch (error) {
    console.error('❌ Failed to install Chrome:', error.message);
    console.log('⚠️  PDF export may not work without Chrome');
    // Don't fail the build, just warn
  }
} else {
  console.log('⏭️  Skipping Chrome installation (local development)');
}
