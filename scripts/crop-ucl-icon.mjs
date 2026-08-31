// One-off: src/assets/brand/UCL.png is the full "starball + UEFA Champions
// League" wordmark lockup. For a small square header icon we only want the
// starball itself, tightly cropped and padded, so it reads clearly at 36-48px
// instead of shrinking the whole tall lockup (which makes the ball a speck).
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcPath = path.join(__dirname, '../src/assets/brand/UCL.png')
const buf = readFileSync(srcPath)
const dataUrl = 'data:image/png;base64,' + buf.toString('base64')

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
})
const page = await browser.newPage()
await page.setContent('<canvas id="c"></canvas>')

const outDataUrl = await page.evaluate(async (dataUrl) => {
  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = dataUrl
  })
  const W = img.naturalWidth
  const H = img.naturalHeight
  const canvas = document.getElementById('c')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const { data } = ctx.getImageData(0, 0, W, H)

  const rowHasInk = new Array(H).fill(false)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 12) {
        rowHasInk[y] = true
        break
      }
    }
  }

  // Find the first gap (run of empty rows) of at least 15px after the
  // starball — that's the boundary before the "UEFA" wordmark starts.
  let ballEnd = H
  let y = 0
  // skip leading empty rows
  while (y < H && !rowHasInk[y]) y++
  let inBall = true
  let gapStart = -1
  for (; y < H; y++) {
    if (inBall && !rowHasInk[y]) {
      gapStart = y
      let gapLen = 0
      let yy = y
      while (yy < H && !rowHasInk[yy]) {
        gapLen++
        yy++
      }
      if (gapLen >= 15) {
        ballEnd = gapStart
        break
      }
    }
  }

  // bbox of ink within [0, ballEnd)
  let minX = W,
    maxX = 0,
    minY = ballEnd,
    maxY = 0
  for (let yy = 0; yy < ballEnd; yy++) {
    for (let xx = 0; xx < W; xx++) {
      if (data[(yy * W + xx) * 4 + 3] > 12) {
        if (xx < minX) minX = xx
        if (xx > maxX) maxX = xx
        if (yy < minY) minY = yy
        if (yy > maxY) maxY = yy
      }
    }
  }

  const bw = maxX - minX
  const bh = maxY - minY
  const pad = Math.round(Math.max(bw, bh) * 0.08)
  const size = Math.max(bw, bh) + pad * 2
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2

  const out = document.createElement('canvas')
  out.width = size
  out.height = size
  const octx = out.getContext('2d')
  octx.drawImage(img, cx - size / 2, cy - size / 2, size, size, 0, 0, size, size)
  return out.toDataURL('image/png')
}, dataUrl)

await browser.close()

const outBuf = Buffer.from(outDataUrl.split(',')[1], 'base64')
const outPath = path.join(__dirname, '../src/assets/brand/UCL-icon.png')
writeFileSync(outPath, outBuf)
console.log('wrote', outPath, outBuf.length, 'bytes')
