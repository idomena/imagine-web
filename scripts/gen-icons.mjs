/**
 * Generates PNG icons for Imagine using only Node.js built-ins (zlib).
 * Outputs:
 *   public/apple-touch-icon.png  — 180×180 (iOS Add to Home Screen)
 *   public/icon-192.png          — 192×192 (Android PWA manifest)
 *   public/icon-512.png          — 512×512 (Android PWA manifest, large)
 *   public/favicon-32.png        — 32×32  (browser tab)
 */

import zlib from 'node:zlib'
import fs   from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir    = path.dirname(fileURLToPath(import.meta.url))
const OUT      = path.resolve(__dir, '..', 'public')

// ── Brand colours ─────────────────────────────────────────────────────────────
const TEAL  = [14, 143, 130]   // #0e8f82 — logo teal
const WHITE = [255, 255, 255]

// ── Pure-JS PNG encoder ───────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td  = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function encodePNG(w, h, getPixel) {
  const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 2  // 8-bit RGB

  // Raw scanlines (filter byte 0 = None, then RGB triples)
  const raw = Buffer.alloc((1 + w * 3) * h)
  let p = 0
  for (let y = 0; y < h; y++) {
    raw[p++] = 0
    for (let x = 0; x < w; x++) {
      const [r, g, b] = getPixel(x, y)
      raw[p++] = r; raw[p++] = g; raw[p++] = b
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 })

  return Buffer.concat([
    SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Shape helpers ─────────────────────────────────────────────────────────────

/** Serif capital "I" — horizontal bars top & bottom, vertical stem */
function inSerifI(x, y, W, H) {
  const mg  = Math.round(W * 0.20)           // margin from edge
  const bar = Math.round(H * 0.09)           // bar thickness
  const stW = Math.round(W * 0.18)           // stem width
  const stX = Math.round((W - stW) / 2)
  const top = mg, bot = H - mg

  const inTop  = y >= top           && y < top + bar  && x >= mg  && x < W - mg
  const inBot  = y >= bot - bar     && y < bot         && x >= mg  && x < W - mg
  const inStem = x >= stX           && x < stX + stW  && y >= top && y < bot

  return inTop || inBot || inStem
}

/** Rounded rectangle test (for teal background on small icons) */
function inRoundRect(x, y, W, H, r) {
  if (x < 0 || x >= W || y < 0 || y >= H) return false
  const cx = x < r ? r : x >= W - r ? W - r - 1 : x
  const cy = y < r ? r : y >= H - r ? H - r - 1 : y
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}

// ── Icon generators ───────────────────────────────────────────────────────────

/** Light background + teal "I" (180, 192, 512) */
function lightIcon(w, h) {
  return encodePNG(w, h, (x, y) => inSerifI(x, y, w, h) ? TEAL : WHITE)
}

/** Teal rounded-square background + white "I" (favicon 32) */
function darkIcon(w, h) {
  const r = Math.round(w * 0.22)
  return encodePNG(w, h, (x, y) => {
    if (!inRoundRect(x, y, w, h, r)) return WHITE
    return inSerifI(x, y, w, h) ? WHITE : TEAL
  })
}

// ── Write files ───────────────────────────────────────────────────────────────

const files = [
  ['apple-touch-icon.png', lightIcon(180, 180)],
  ['icon-192.png',         lightIcon(192, 192)],
  ['icon-512.png',         lightIcon(512, 512)],
  ['favicon-32.png',       darkIcon(32, 32)],
]

for (const [name, buf] of files) {
  const dest = path.join(OUT, name)
  fs.writeFileSync(dest, buf)
  console.log(`✓ ${dest}  (${buf.length} bytes)`)
}

console.log('\nDone — all icons written to public/')
