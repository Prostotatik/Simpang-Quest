import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.env.URL || 'http://localhost:5273/'
const OUT = process.env.OUT || '.tmp/shot.png'
const W = Number(process.env.W || 1672)
const H = Number(process.env.H || 941)
const STEPS = process.env.STEPS ? JSON.parse(process.env.STEPS) : []

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [`--window-size=${W},${H}`, '--hide-scrollbars', '--force-device-scale-factor=1'],
  defaultViewport: { width: W, height: H },
})
const page = await browser.newPage()
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
page.on('requestfailed', (r) => logs.push(`[reqfail] ${r.url().slice(0, 110)} ${r.failure()?.errorText}`))

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 45000 })

for (const step of STEPS) {
  if (step.wait) await new Promise((r) => setTimeout(r, step.wait))
  if (step.click) {
    try {
      await page.click(step.click)
    } catch (e) {
      logs.push(`[step] click failed ${step.click}: ${e.message}`)
    }
  }
  if (step.clickText) {
    const ok = await page.evaluate((t) => {
      const el = [...document.querySelectorAll('button,a,[role=button]')]
        .find((n) => n.textContent.trim().toLowerCase().includes(t.toLowerCase()))
      if (el) { el.click(); return true }
      return false
    }, step.clickText)
    if (!ok) logs.push(`[step] no element with text "${step.clickText}"`)
  }
  if (step.clickXY) await page.mouse.click(step.clickXY[0], step.clickXY[1])
  if (step.js) {
    const out = await page.evaluate(step.js)
    if (out !== undefined) logs.push(`[js] ${JSON.stringify(out)}`)
  }
  if (step.hoverXY) await page.mouse.move(step.hoverXY[0], step.hoverXY[1])
}

await new Promise((r) => setTimeout(r, Number(process.env.SETTLE || 2500)))
fs.mkdirSync('.tmp', { recursive: true })
await page.screenshot({ path: OUT })
console.log(logs.join('\n') || '(no console output)')
await browser.close()
