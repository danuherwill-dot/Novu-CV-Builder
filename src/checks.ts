import type { CV } from './types'
import { lines } from './format'

export interface Check { id: string; ok: boolean }

const BAD_EMAIL = /(sexy|gatinh|baby|princess|gamer|xxx|lindo|lindinha|fofo)/i

export function runChecks(cv: CV, fitsOnePage: boolean): Check[] {
  const p = cv.personal
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email)
  const local = p.email.split('@')[0] || ''
  const allBullets = cv.experience.flatMap(e => lines(e.bullets))
  const verbLike = (l: string) => /^[A-ZÀ-Ú][a-zà-ú]+(ei|ou|i|í|ámos|aram)\b/.test(l.trim().split(/\s+/).slice(0, 1).join(' ') + ' ')
  return [
    { id: 'name', ok: p.fullName.trim().split(/\s+/).length >= 2 },
    { id: 'contact', ok: emailOk && p.phone.replace(/\D/g, '').length >= 9 },
    { id: 'emailPro', ok: emailOk && !BAD_EMAIL.test(local) && (local.match(/\d/g) || []).length <= 4 && local.length <= 30 },
    { id: 'headline', ok: p.headline.trim().length >= 10 },
    { id: 'summary', ok: cv.summary.length >= 150 && cv.summary.length <= 450 },
    { id: 'education', ok: cv.education.some(e => e.school && (e.degree || e.field)) },
    { id: 'experience', ok: cv.experience.some(e => e.title || e.org) },
    { id: 'bullets', ok: cv.experience.length > 0 && cv.experience.every(e => lines(e.bullets).length >= 2) },
    { id: 'verbs', ok: allBullets.length > 0 && allBullets.filter(verbLike).length / allBullets.length >= 0.7 },
    { id: 'skills', ok: cv.skills.length >= 5 },
    { id: 'languages', ok: cv.languages.some(l => l.name && l.level) },
    { id: 'onePage', ok: fitsOnePage },
  ]
}

export const STEP_CHECKS: Record<string, string[]> = {
  personal: ['name', 'contact', 'emailPro', 'headline'],
  summary: ['summary'],
  education: ['education'],
  experience: ['experience', 'bullets', 'verbs'],
  skills: ['skills'],
  languages: ['languages'],
  extras: [],
  finish: ['onePage'],
}
