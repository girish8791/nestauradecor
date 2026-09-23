// After `vite build` (client) and `vite build --ssr` (server entry), render the
// page once and put the markup inside #root in dist/index.html. main.tsx then
// hydrates that markup instead of building the page from nothing.
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const { render } = await import(pathToFileURL(`${root}dist-ssr/entry-server.js`).href)

const file = `${root}dist/index.html`
const html = readFileSync(file, 'utf8')
const slot = '<div id="root"></div>'
if (!html.includes(slot)) throw new Error(`prerender: ${slot} not found in dist/index.html`)
writeFileSync(file, html.replace(slot, `<div id="root">${render()}</div>`))
rmSync(`${root}dist-ssr`, { recursive: true, force: true })
console.log('prerender: dist/index.html now carries the rendered page')

// The Caddyfile's Content-Security-Policy allows each inline script by hash.
// An edited script with a stale hash would be blocked in the browser, so the
// build stops here instead.
const policy = readFileSync(`${root}Caddyfile`, 'utf8')
// browsers see the script after CRLF is normalised to LF, and hash that
for (const [, code] of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
  const hash = `sha256-${createHash('sha256').update(code.replaceAll('\r\n', '\n'), 'utf8').digest('base64')}`
  if (!policy.includes(hash)) throw new Error(`prerender: add '${hash}' to script-src in the Caddyfile (an inline script changed)`)
}
console.log('prerender: inline scripts match the Caddyfile policy')
