// @ts-check

const fetch = require('node-fetch').default
const fs = require('fs')
const path = require('path')

const { URL, OUT_DIR } = process.env
const TIMEOUT = 60 * 1000 // 60s

const date = new Date().toISOString()
const d = date.split('T')[0] // ISO8601 date: 2020-01-01
const file = path.join(OUT_DIR, `${d}.json`)

/** @type {{ date: string; success: boolean; statusCode?: number; }[]} */
let statusData = []
if (fs.existsSync(file)) { // load existing data
  statusData = JSON.parse(fs.readFileSync(file, 'utf-8'))
}

// eslint-disable-next-line no-void
void (async () => {
  let success = false
  let statusCode = 500

  try {
    const r = await fetch(URL, {
      timeout: TIMEOUT,
    })
    success = r.ok
    statusCode = r.status
  } finally {
    statusData.push({ date, success, statusCode })
    fs.writeFileSync(file, JSON.stringify(statusData))
  }

  // save to web.archive.org
  try {
    const saveURL = `${URL}?t=${date}`
    console.log(saveURL)

    const r = await fetch('https://web.archive.org/save/', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `url=${encodeURIComponent(saveURL)}&capture_all=on`,
      method: 'POST',
    })
    await r.text()
  } catch { }
})()
