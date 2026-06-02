// Restaurant Growth Grader — scoring engine.
// Fetches a restaurant website, runs concrete checks, computes a 0-100 online
// health grade across Search/SEO, Guest Experience, and Local Listings, and
// turns failures into an owner-friendly, revenue-framed fix list.
// Mirrors Owner.com's Grader dimensions; no phone gate (see teardown).

const strip = (s = '') => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
const find = (re, html) => { const m = html.match(re); return m ? m[1] : null }

export async function fetchSite(rawUrl) {
  let url = rawUrl.trim()
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  const u = new URL(url)
  let res, html = '', finalUrl = url, blocked = false
  try {
    res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GrowthGrader/1.0)' },
      signal: AbortSignal.timeout(12000),
    })
    finalUrl = res.url || url
    html = await res.text()
  } catch (e) {
    blocked = true
  }
  if (html && /access denied|are you human|cf-browser-verification|just a moment/i.test(html.slice(0, 4000))) blocked = true
  return { url: finalUrl, host: u.host, https: u.protocol === 'https:', html, blocked }
}

export function runChecks(site) {
  const html = site.html || ''
  const lower = html.toLowerCase()
  const text = strip(html)
  const title = find(/<title[^>]*>([^<]*)<\/title>/i, html)
  const h1 = find(/<h1[^>]*>([\s\S]*?)<\/h1>/i, html)
  const metaDesc = find(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i, html)
    || find(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i, html)
  const ogTitle = /property=["']og:title["']/i.test(html)
  const ogDesc = /property=["']og:description["']/i.test(html)
  const ogImage = /property=["']og:image["']/i.test(html)
  const viewport = /name=["']viewport["']/i.test(html)
  const favicon = /rel=["'][^"']*icon[^"']*["']/i.test(html) || /apple-touch-icon|favicon\./i.test(lower)
  const tel = /href=["']tel:/i.test(html) || /(\(\d{3}\)\s?\d{3}[-\s]?\d{4})|(\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b)/.test(text)
  const timeRange = /\d{1,2}(:\d{2})?\s?(a\.?m\.?|p\.?m\.?)\s?(–|-|—|to|until|till)\s?\d{1,2}(:\d{2})?\s?(a\.?m\.?|p\.?m\.?)/i
  const dayWord = /\b(mon|tue|wed|thu|fri|sat|sun|daily|everyday|every day|7 ?days)\b/i
  const hasTime = /\d{1,2}(:\d{2})?\s?(a\.?m\.?|p\.?m\.?)/i
  const hours = timeRange.test(text) || /openinghours/i.test(lower) || (dayWord.test(text) && hasTime.test(text))
  const streetSuffix = /\b\d{1,6}\s+([a-z0-9.'’-]+\s){0,4}(st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ln|lane|way|ct|court|pl|place|cir|circle|hwy|highway|ter|terrace|plaza|pkwy|parkway|trail|loop|row|sq|square|route|rte|suite|ste)\b/i
  const cityStateZip = /,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\.?\s+\d{5}/i
  const address = streetSuffix.test(text) || cityStateZip.test(text) || /postaladdress|streetaddress/i.test(lower)
  const ordering = /(order online|order now|order ahead|start order|order pickup|order delivery)/i.test(text)
    || /(doordash|ubereats|uber eats|grubhub|toasttab|toast|chownow|owner\.com|clover|slice|seamless)/i.test(lower)
  const social = /(facebook\.com|instagram\.com|tiktok\.com|twitter\.com|x\.com\/)/i.test(lower)
  const imgs = (html.match(/<img\b/gi) || []).length
  const imgsAlt = (html.match(/<img\b[^>]*\balt=["'][^"']+["']/gi) || []).length
  const altRatio = imgs ? imgsAlt / imgs : 1
  const jsonld = /application\/ld\+json/i.test(html)
  const schemaRestaurant = /"@type"\s*:\s*"(restaurant|localbusiness|foodestablishment)"/i.test(html)
  const enoughText = text.length > 600
  const cta = ordering
  const keywordsInTitle = title ? /(pizza|restaurant|cafe|kitchen|grill|bar|taco|sushi|bbq|diner|eatery|bistro|menu|food)/i.test(title) : false

  // dimension: { name, weight(max points), checks:[{label, ok, pts, critical, fix}] }
  const dims = [
    {
      name: 'Search & SEO', weight: 40, checks: [
        c('Page title is present', !!title, 6, true, 'Add a clear <title> with your restaurant name and city.'),
        c('Title includes a keyword/cuisine', keywordsInTitle, 4, false, 'Put your cuisine and city in the title, e.g. "Joe’s Pizza | New York Pizzeria".'),
        c('H1 headline exists', !!h1, 5, true, 'Add one H1 headline that says who you are and where.'),
        c('Meta description (>80 chars)', !!metaDesc && metaDesc.length > 80, 5, false, 'Write a 1-2 sentence meta description with cuisine + neighborhood.'),
        c('Open Graph title/description', ogTitle && ogDesc, 5, false, 'Add og:title and og:description so links preview well when shared.'),
        c('Open Graph image', ogImage, 4, false, 'Add an og:image (a great food photo) for social/link previews.'),
        c('HTTPS secure', site.https, 5, true, 'Serve the site over HTTPS so Google and customers trust it.'),
        c('Structured data (schema.org)', jsonld, 6, false, 'Add Restaurant JSON-LD so Google can read hours, menu, and rating.'),
      ],
    },
    {
      name: 'Guest Experience', weight: 40, checks: [
        c('Phone number on site', tel, 7, true, 'Show a tappable phone number in the header and footer.'),
        c('Operating hours on site', hours, 6, true, 'List your hours so guests can plan and Google can index them.'),
        c('Address on site', address, 5, true, 'Show your full address; it powers maps and local SEO.'),
        c('Online ordering call-to-action', cta, 8, true, 'Add a prominent "Order Online" button above the fold.'),
        c('Enough page content', enoughText, 4, false, 'Add a short About section describing the food and story.'),
        c('Mobile viewport set', viewport, 4, true, 'Add a responsive viewport meta tag; most guests are on phones.'),
        c('Social media links', social, 3, false, 'Link Instagram and Facebook so guests can follow you.'),
        c('Favicon present', favicon, 3, false, 'Add a favicon so the tab and bookmarks look professional.'),
      ],
    },
    {
      name: 'Local Listings', weight: 20, checks: [
        c('Restaurant schema type', schemaRestaurant, 6, false, 'Mark up the page as a Restaurant/LocalBusiness for rich results.'),
        c('Name, address, phone present', tel && address, 6, true, 'Keep Name/Address/Phone consistent on-site and on Google.'),
        c('Image alt text coverage', altRatio >= 0.6, 4, false, 'Add alt text to food photos so they rank in image search.'),
        c('Links to maps/listings', /(google\.com\/maps|goo\.gl\/maps|yelp\.com)/i.test(lower), 4, false, 'Link your Google Maps and Yelp listings from the site.'),
      ],
    },
  ]
  return dims
}

function c(label, ok, pts, critical, fix) { return { label, ok: !!ok, pts, critical: !!critical, fix } }

export function score(dims) {
  let total = 0, max = 0
  const out = dims.map((d) => {
    const dMax = d.checks.reduce((s, x) => s + x.pts, 0)
    const dGot = d.checks.reduce((s, x) => s + (x.ok ? x.pts : 0), 0)
    // normalize each dimension to its display weight
    const norm = Math.round((dGot / dMax) * d.weight)
    total += norm; max += d.weight
    return { name: d.name, score: norm, max: d.weight, checks: d.checks }
  })
  const grade = Math.round((total / max) * 100)
  const tier = grade >= 85 ? 'Excellent' : grade >= 70 ? 'Good' : grade >= 50 ? 'Fair' : 'Needs Work'
  const fails = dims.flatMap((d) => d.checks.filter((x) => !x.ok))
  const critFails = fails.filter((x) => x.critical).length
  // heuristic revenue-at-risk: each critical gap ~ $420/mo, each minor ~ $130/mo
  const revenueAtRisk = critFails * 420 + (fails.length - critFails) * 130
  const fixes = fails
    .sort((a, b) => (b.critical - a.critical) || (b.pts - a.pts))
    .slice(0, 8)
    .map((x, i) => ({ priority: i + 1, title: x.fix, area: x.label, critical: x.critical }))
  return { grade, tier, dimensions: out, revenueAtRisk, fixes, problemCount: fails.length }
}

// Optional: use Gemini to rewrite fixes in a warmer, owner-friendly voice.
export async function aiNarrative(business, result) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  const prompt = `You are an expert restaurant growth advisor. A restaurant's website scored ${result.grade}/100 (${result.tier}). These are the issues found:\n${result.fixes.map((f) => '- ' + f.area + ': ' + f.title).join('\n')}\nWrite a punchy 2-sentence summary for the owner (no jargon, encouraging but honest), then return the single highest-impact action. Keep under 60 words.`
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: AbortSignal.timeout(15000),
    })
    const j = await r.json()
    return j?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null
  } catch { return null }
}

export async function grade(rawUrl) {
  const site = await fetchSite(rawUrl)
  if (!site.html && site.blocked) {
    return { error: 'blocked', business: { url: site.url, host: site.host },
      note: 'We could not read this site (it blocked our crawler or is down). Owner.com hits the same wall and unfairly lowers the grade; a real fix is to detect this and tell the owner instead of scoring them as broken.' }
  }
  const dims = runChecks(site)
  const result = score(dims)
  const ai = await aiNarrative(site, result)
  return { business: { url: site.url, host: site.host, title: find(/<title[^>]*>([^<]*)<\/title>/i, site.html) }, ...result, ai, aiPowered: !!ai }
}
