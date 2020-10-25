// @ts-check

const fetch = require('node-fetch').default
const { JSDOM } = require('jsdom')

const BASE_URL = process.env.URL

const REQ_LIMIT = 19
const WAIT_TIME = 60 * 1000 // 60s

const date = +new Date()

const archive = async (url) => {
  console.log(url)
  const r = await fetch('https://web.archive.org/save/', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `url=${encodeURIComponent(url)}&capture_all=on&capture_outlinks=on`,
    method: 'POST',
  })
  const text = await r.text()

  if (!r.ok) {
    throw new Error(r.status + ' ' + r.statusText)
  }
}

JSDOM.fromURL(BASE_URL).then(async (dom) => {
  const document = dom.window.document
  /** @type {NodeListOf<HTMLAnchorElement>} */
  const articleLinks = document.querySelectorAll('a.threadlist_title')
  const urls = [...articleLinks].map(a => a.href)
  const urlsD = urls.map(url => url + '?t=' + date)
  urls.push(...urlsD)

  let i = 0
  for (const url of urls) {
    try {
      await archive(url)
    } catch (err) {
      console.error(err)
    }

    i++
    if (i >= REQ_LIMIT) {
      await new Promise((resolve) => {
        setTimeout(resolve, WAIT_TIME)
      })
      i = 0
    }
  }
})
