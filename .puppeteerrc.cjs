/**
 * Puppeteer Configuration for Render.com
 *
 * This tells Puppeteer where to cache and find Chrome
 */

const path = require('path');

module.exports = {
  // Cache directory for downloaded browsers
  cacheDirectory: process.env.PUPPETEER_CACHE_DIR || path.join(__dirname, '.cache', 'puppeteer'),
};
