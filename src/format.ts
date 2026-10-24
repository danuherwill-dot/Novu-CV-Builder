import type { Dict } from './i18n'
import type { DateFormat } from './types'

export function fmtDate(v: string, fmt: DateFormat, t: Dict): string {
  if (!v) return ''
  const [y, m] = v.split('-')
  if (!m) return y
  const mi = parseInt(m, 10) - 1
  if (fmt === 'numeric') return `${m}/${y}`
  return `${t.months[mi] ?? m} ${y}`
}

export function fmtRange(start: string, end: string, current: boolean, fmt: DateFormat, t: Dict): string {
  const a = fmtDate(start, fmt, t)
  const b = current ? t.cv.present : fmtDate(end, fmt, t)
  if (a && b) return `${a} – ${b}`
  return a || b
}

export const lines = (s: string) => s.split('\n').map(l => l.replace(/^[\s•\-–*]+/, '').trim()).filter(Boolean)

export const levelLabel = (lvl: string, t: Dict) => (lvl === 'native' ? t.cv.native : lvl ? `${t.cv.levelWord} ${lvl}` : '')

export const cleanUrl = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
