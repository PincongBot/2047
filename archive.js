// @ts-check
/// <reference lib="es2019"/>

const fetch = require('node-fetch').default
const { JSDOM } = require('jsdom')

const BASE_URL_LIST = process.env.URL.split(', ')

const REQ_LIMIT = 19
const WAIT_TIME = 60 * 1000 // 60s

const date = +new Date()

/**
 * @param {string} url 
 */
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

/**
 * @param {string[]} urls 
 */
const archiveURLs = async (urls) => {
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
}

/**
 * @param {JSDOM} dom 
 */
const findUrls = async (dom) => {
  const document = dom.window.document
  /** @type {NodeListOf<HTMLAnchorElement>} */
  const articleLinks = document.querySelectorAll('a.threadlist_title')
  const urls = [...articleLinks].map(a => a.href)
  const urlsD = urls.map(url => url + '?t=' + date)
  urls.push(...urlsD)
  return urls
}

Promise.all(
  BASE_URL_LIST.map(baseUrl =>
    JSDOM.fromURL(baseUrl).then(findUrls)
  )
).then(l => l.flat())
  .then(urls => archiveURLs(urls))
