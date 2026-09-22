// After `vite build` (client) and `vite build --ssr` (server entry), render the
// page once and put the markup inside #root in dist/index.html. main.tsx then
// hydrates that markup instead of building the page from nothing.
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
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
