/**
 * Keeps entries together across A4 page breaks. Every unit (a job, a school entry, a short
 * section, or a section heading together with its first entry) that would be cut by a page
 * boundary is pushed down to the top of the next page, with a margin on continuation pages.
 */
const MM = 96 / 25.4
const PAGE = 297 * MM
const TOP = 13 * MM // space above content on pages 2+
const BOTTOM = 11 * MM // space kept free at the bottom of every page

interface Unit { first: HTMLElement; last: HTMLElement }

export function resetPagination(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-pg]').forEach(e => {
    e.style.marginTop = e.dataset.pg ?? ''
    delete e.dataset.pg
  })
}

function collect(root: HTMLElement): Unit[] {
  const units: Unit[] = []
  root.querySelectorAll<HTMLElement>('.cv-section').forEach(sec => {
    const h2 = sec.querySelector<HTMLElement>(':scope > h2')
    const entries = Array.from(sec.querySelectorAll<HTMLElement>(':scope > .cv-row, :scope > .cv-entry'))
    if (!entries.length) { units.push({ first: sec, last: sec }); return }
    entries.forEach((e, i) => units.push(i === 0 && h2 ? { first: h2, last: e } : { first: e, last: e }))
  })
  return units
}

export function paginate(root: HTMLElement) {
  resetPagination(root)
  const box = root.getBoundingClientRect()
  const k = box.width / root.offsetWidth || 1 // the live preview is drawn scaled down
  const origin = box.top
  for (const u of collect(root)) {
    const top = (u.first.getBoundingClientRect().top - origin) / k
    const bottom = (u.last.getBoundingClientRect().bottom - origin) / k
    const page = Math.max(0, Math.floor(top / PAGE))
    const limit = (page + 1) * PAGE - BOTTOM
    const tooTall = bottom - top > PAGE - TOP - BOTTOM
    if (tooTall || (bottom <= limit && top <= limit)) continue
    const delta = (page + 1) * PAGE + TOP - top
    if (delta <= 0) continue
    const el = u.first
    el.dataset.pg = el.style.marginTop
    el.style.marginTop = `calc(${getComputedStyle(el).marginTop} + ${delta}px)`
  }
}
