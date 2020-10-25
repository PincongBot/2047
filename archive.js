// @ts-check

const fetch = require('node-fetch').default
const { JSDOM } = require('jsdom')

const BASE_URL = process.env.URL

const REQ_LIMIT = 23
const WAIT_TIME = 60 * 1000 // 60s

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
    throw new Error(text)
  }
}

JSDOM.fromURL(BASE_URL).then(async (dom) => {
  const document = dom.window.document
  /** @type {NodeListOf<HTMLAnchorElement>} */
  const articleLinks = document.querySelectorAll('a.threadlist_title')

  let i = 0
  for (const a of articleLinks) {
    const url = a.href
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
