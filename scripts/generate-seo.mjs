import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')
const baseUrl = process.env.VITE_SITE_URL || ''

const staticPaths = [
  '',
  '/about',
  '/projects',
  '/blog',
  '/contact',
  '/projects/code/diff',
  '/projects/code/formatter',
]

if (!fs.existsSync(distDir)) {
  console.warn('dist not found, skipping SEO files')
  process.exit(0)
}

if (baseUrl) {
  const normalizedBase = baseUrl.replace(/\/$/, '')
  const urls = staticPaths.map((p) => `${normalizedBase}${p || '/'}`)
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8')
  console.log('sitemap.xml written')
}

const robotsTxt =
  baseUrl && baseUrl.startsWith('http')
    ? `User-agent: *
Allow: /

Sitemap: ${baseUrl.replace(/\/$/, '')}/sitemap.xml
`
    : `User-agent: *
Allow: /
`
fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf8')
console.log('robots.txt written')
