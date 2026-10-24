import { CV, Education, Experience, ExperienceKind, Extra, Language, emptyCV, uid } from './types'

/* ---------- 1. Reading files (all in the browser, nothing is uploaded) ---------- */

export async function readFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return readPdf(await file.arrayBuffer())
  if (name.endsWith('.docx')) {
    const mammoth = (await import('mammoth/mammoth.browser.js')) as unknown as { extractRawText: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> }
    return (await (mammoth.extractRawText ?? (mammoth as unknown as { default: typeof mammoth }).default.extractRawText)({ arrayBuffer: await file.arrayBuffer() })).value
  }
  if (name.endsWith('.txt') || name.endsWith('.md') || file.type.startsWith('text/')) return file.text()
  throw new Error('unsupported')
}

interface Frag { s: string; x: number; y: number; w: number }

function rowsToLines(items: Frag[]): string[] {
  const sorted = items.slice().sort((a, b) => b.y - a.y || a.x - b.x)
  const rows: { y: number; parts: Frag[] }[] = []
  for (const it of sorted) {
    const row = rows.find(r => Math.abs(r.y - it.y) < 2.5)
    if (row) row.parts.push(it)
    else rows.push({ y: it.y, parts: [it] })
  }
  return rows.map(r => {
    r.parts.sort((a, b) => a.x - b.x)
    let line = ''
    let end = 0
    for (const part of r.parts) {
      if (line && part.x - end > 14) line += '   '
      else if (line && part.x - end > 0.5 && !line.endsWith(' ') && !part.s.startsWith(' ')) line += ' '
      line += part.s
      end = part.x + part.w
    }
    return line
  })
}

/** Finds an empty vertical gutter (sidebar layouts) and returns its x, or null. */
function findGutter(items: Frag[], width: number): number | null {
  if (items.length < 20) return null
  const rowKeys = new Set(items.map(i => Math.round(i.y / 3)))
  const total = rowKeys.size
  let best: { from: number; to: number } | null = null
  let run: number | null = null
  for (let x = width * 0.28; x <= width * 0.8; x += 2) {
    const crossing = new Set(items.filter(i => i.x < x && i.x + i.w > x).map(i => Math.round(i.y / 3))).size
    if (crossing <= total * 0.1) { if (run === null) run = x; if (!best || x - run > best.to - best.from) best = { from: run, to: x } }
    else run = null
  }
  if (!best || best.to - best.from < 10) return null
  const mid = (best.from + best.to) / 2
  const left = items.filter(i => i.x + i.w / 2 < mid).length
  const right = items.length - left
  return left >= items.length * 0.15 && right >= items.length * 0.15 ? mid : null
}

async function readPdf(data: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const pdf = await pdfjs.getDocument({ data }).promise
  const out: string[] = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    const items: Frag[] = content.items
      .filter((i): i is typeof i & { str: string; transform: number[]; width: number } => 'str' in i && i.str.trim() !== '')
      .map(i => ({ s: i.str, x: i.transform[4], y: i.transform[5], w: i.width }))
    const gutter = findGutter(items, page.getViewport({ scale: 1 }).width)
    if (gutter === null) out.push(...rowsToLines(items))
    else {
      // columns are read one after the other; \f marks the column break for the parser
      out.push(...rowsToLines(items.filter(i => i.x + i.w / 2 < gutter)), '\f', ...rowsToLines(items.filter(i => i.x + i.w / 2 >= gutter)), '\f')
    }
    out.push('\f')
  }
  return out.join('\n')
}

/* ---------- 2. Understanding the text ---------- */

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()

type SectionId = 'contact' | 'profile' | 'education' | 'experience' | 'volunteer' | 'project' | 'club' | 'skills' | 'languages' | 'extras'

const HEADINGS: Record<SectionId, string[]> = {
  contact: ['contactos', 'contacto', 'dados pessoais', 'informacao pessoal', 'contact', 'contacts', 'personal details', 'personal information'],
  profile: ['perfil', 'perfil profissional', 'sobre mim', 'sobre', 'objetivo', 'objetivo profissional', 'resumo', 'resumo profissional', 'apresentacao', 'summary', 'profile', 'about me', 'about', 'objective', 'personal statement'],
  education: ['formacao', 'formacao academica', 'educacao', 'habilitacoes', 'habilitacoes literarias', 'percurso academico', 'escolaridade', 'education', 'academic background'],
  experience: ['experiencia', 'experiencia profissional', 'percurso profissional', 'historico profissional', 'experiencia de trabalho', 'work experience', 'experience', 'professional experience', 'employment'],
  volunteer: ['voluntariado', 'experiencia de voluntariado', 'volunteering', 'volunteer experience', 'volunteer'],
  project: ['projetos', 'projetos escolares', 'projectos', 'projects', 'projeto'],
  club: ['clubes', 'associacoes', 'atividades extracurriculares', 'atividades', 'extracurricular activities', 'activities'],
  skills: ['competencias', 'competencias tecnicas', 'aptidoes', 'conhecimentos', 'conhecimentos informaticos', 'competencias pessoais', 'skills', 'technical skills', 'soft skills', 'key skills'],
  languages: ['idiomas', 'linguas', 'competencias linguisticas', 'languages', 'language skills'],
  extras: ['informacao adicional', 'informacoes adicionais', 'outras informacoes', 'certificados', 'certificacoes', 'cursos', 'formacao complementar', 'premios', 'interesses', 'hobbies', 'outros', 'additional information', 'certifications', 'certificates', 'awards', 'interests', 'courses', 'other'],
}

const headingMap = new Map<string, SectionId>()
const headingMapNS = new Map<string, SectionId>()
for (const [id, list] of Object.entries(HEADINGS) as [SectionId, string[]][]) list.forEach(h => { headingMap.set(h, id); headingMapNS.set(h.replace(/ /g, ''), id) })

/** "P E R F I L" (letter-spaced headings in PDFs) -> "PERFIL" */
function despace(line: string): string {
  const tokens = line.trim().split(/ /).filter(Boolean)
  if (tokens.length >= 4 && tokens.filter(t => t.length === 1).length / tokens.length > 0.6) return line.trim().split(/\s{2,}/).map(w => w.replace(/ /g, '')).join(' ')
  return line
}

function headingOf(rawLine: string): SectionId | null {
  const spaced = despace(rawLine)
  const t = spaced.trim()
  if (!t || t.length > 40 || t.split(/\s+/).length > 5) return null
  const n = norm(t.replace(/[:：]$/, ''))
  return headingMap.get(n) ?? (spaced !== rawLine ? headingMapNS.get(n.replace(/ /g, '')) ?? null : null)
}

const MONTHS: Record<string, string> = { jan: '01', fev: '02', feb: '02', mar: '03', abr: '04', apr: '04', mai: '05', may: '05', jun: '06', jul: '07', ago: '08', aug: '08', set: '09', sep: '09', out: '10', oct: '10', nov: '11', dez: '12', dec: '12' }
const TOKEN = String.raw`(?:(?:0?[1-9]|1[0-2])[\/.-](?:19|20)\d{2}|(?:jan|fev|feb|mar|abr|apr|mai|may|jun|jul|ago|aug|set|sep|out|oct|nov|dez|dec)[a-zçÇ]{0,8}\.?\s+(?:de\s+)?(?:19|20)\d{2}|(?:19|20)\d{2})`
const NOW = String.raw`presente|atualidade|actualidade|atual|actual|present|current|hoje|now|em curso|ongoing`
const RANGE = new RegExp(String.raw`(${TOKEN})\s*(?:[-–—]|\ba\b|\bto\b|\baté\b|\bate\b)\s*(${TOKEN}|${NOW})`, 'i')

function toDate(tok: string): string {
  const y = tok.match(/(?:19|20)\d{2}/)?.[0]
  if (!y) return ''
  const num = tok.match(/^(0?[1-9]|1[0-2])[\/.-]/)
  if (num) return `${y}-${num[1].padStart(2, '0')}`
  const word = norm(tok.replace(y, '')).replace(/^de /, '')
  const m = MONTHS[word.slice(0, 3)]
  return m ? `${y}-${m}` : y
}

interface Dated { text: string; start: string; end: string; current: boolean }

function splitDate(line: string): Dated | null {
  const m = line.match(RANGE)
  if (!m) return null
  const cur = new RegExp(`^(${NOW})$`, 'i').test(m[2].trim())
  const text = (line.slice(0, m.index) + ' ' + line.slice((m.index ?? 0) + m[0].length)).replace(/[()\[\]]/g, ' ').replace(/\s+/g, ' ').replace(/^[\s,;·|–—-]+|[\s,;·|–—-]+$/g, '')
  return { text, start: toDate(m[1]), end: cur ? '' : toDate(m[2]), current: cur }
}

const BULLET = /^[\s›»•●▪◦‣⁃\-–—*·▪►■●]+/
const isBullet = (l: string) => /^\s*[•●▪◦‣⁃\-–—*·▪►■●]\s*/.test(l)
const clean = (l: string) => l.replace(BULLET, '').replace(/(?<! ) {2}(?! )/g, ' ').trim()

const SCHOOL = /(escola|universidade|instituto|faculdade|col[eé]gio|academia|conservat[oó]rio|polit[eé]cnico|school|university|college|institute|agrupamento|centro de forma)/i
const SEP = /\s+[—–|·@]\s+|\s+-\s+|\s{3,}/

function splitHeader(h: string): [string, string] {
  const parts = h.split(SEP).map(s => s.trim()).filter(Boolean)
  if (parts.length >= 2) return [parts[0], parts.slice(1).join(' · ')]
  const at = h.match(/^(.*?)\s+(?:at|na|no|em|@)\s+(.+)$/i)
  if (at) return [at[1], at[2]]
  const comma = h.match(/^(.*?),\s+(.+)$/)
  if (comma && comma[1].split(' ').length <= 5) return [comma[1], comma[2]]
  return [h, '']
}

/** Description lines ("Organizei 300 cabazes…") are not titles. */
function looksLikeSentence(l: string): boolean {
  const words = l.split(/\s+/)
  return l.length > 75 || /[.;]$/.test(l) || (words.length >= 4 && /^\p{L}+(ei|ou|ámos|aram)$/u.test(words[0]))
}

interface Block { header: string; start: string; end: string; current: boolean; body: string[] }

/** Splits a section into entries; every line that contains a date range starts one. */
function toBlocks(lines: string[]): Block[] {
  const blocks: Block[] = []
  let loose: string[] = [] // plain lines seen before the first dated line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const d = splitDate(line)
    if (d) {
      let header = d.text
      const cur = blocks[blocks.length - 1]
      if (!header.trim() || header.trim().length < 3) {
        // date sits alone: the title is above it (up to 2 capitalised lines) or, failing that, below it
        const src = cur ? cur.body : loose
        const taken: string[] = []
        while (src.length && taken.length < 2 && !isBullet(src[src.length - 1]) && /^[A-ZÀ-Ú0-9]/.test(clean(src[src.length - 1])) && !looksLikeSentence(clean(src[src.length - 1]))) taken.unshift(clean(src.pop()!))
        if (taken.length) header = taken.length === 2 ? taken[0] + (SEP.test(taken[0]) && !SCHOOL.test(taken[1]) ? ' ' : ' — ') + taken[1] : taken[0]
        else if (lines[i + 1] && !splitDate(lines[i + 1]) && !isBullet(lines[i + 1])) header = clean(lines[++i])
      }
      blocks.push({ header: clean(header), start: d.start, end: d.end, current: d.current, body: [] })
    } else if (blocks.length) blocks[blocks.length - 1].body.push(line)
    else loose.push(line)
  }
  // undated entries (e.g. a single "Escola ... " line): keep as one block
  if (!blocks.length && loose.length) {
    const first = clean(loose[0])
    blocks.push({ header: first, start: '', end: '', current: false, body: loose.slice(1) })
  }
  return blocks
}

function parseExperience(lines: string[], baseKind: ExperienceKind): Experience[] {
  return toBlocks(lines).filter(b => b.header || b.body.length).map(b => {
    let kind = baseKind
    let [title, org] = splitHeader(b.header)
    const bullets: string[] = []
    for (const raw of b.body) {
      const l = clean(raw)
      if (!l) continue
      if (!org && !isBullet(raw) && l.length < 70 && !bullets.length) org = l
      else if (!bullets.length && !isBullet(raw) && l.length < 30 && /^[A-ZÀ-Ú]/.test(l) && !/[.:;]$/.test(l)) org += ' ' + l // wrapped header
      else bullets.push(l)
    }
    const hint = `${title} ${org}`
    if (kind === 'job') {
      if (/volunt/i.test(hint)) kind = 'volunteer'
      else if (/(clube|associa[cç]|teatro|grupo de|n[uú]cleo)/i.test(hint)) kind = 'club'
      else if (/(projeto|projecto|feira|concurso|project)/i.test(hint)) kind = 'project'
    }
    return { id: uid(), kind, title, org, location: '', start: b.start, end: b.end, current: b.current, bullets: bullets.join('\n') }
  })
}

function parseEducation(lines: string[]): Education[] {
  return toBlocks(lines).filter(b => b.header || b.body.length).map(b => {
    const parts = b.header.split(SEP).map(s => s.trim()).filter(Boolean)
    let school = parts.find(p => SCHOOL.test(p)) ?? ''
    const rest = parts.filter(p => p !== school)
    const extra: string[] = []
    let grade = ''
    for (const raw of b.body) {
      const l = clean(raw)
      if (!l) continue
      if (!school && SCHOOL.test(l)) school = l
      else if (/(m[eé]dia|nota|classifica|grade|gpa|valores)/i.test(l) && !grade) grade = l
      else extra.push(l)
    }
    if (!school && rest.length > 1) school = rest.pop()!
    const [degree, field] = rest.length > 1 ? [rest[0], rest.slice(1).join(' — ')] : [rest[0] ?? '', '']
    return { id: uid(), school, degree, field, start: b.start, end: b.end, current: b.current, grade, details: extra.slice(0, 3).join(' ') }
  })
}

const NATIVE = /(nativ|materna|native|mother|bilingu)/i
function levelOf(text: string): string {
  const cefr = text.match(/\b([ABC][12])\b/i)
  if (cefr) return cefr[1].toUpperCase()
  if (NATIVE.test(text)) return 'native'
  if (/(fluente|fluent|proficien|avan[cç]ad|advanced|excelente)/i.test(text)) return 'C1'
  if (/(interm[eé]di|intermediate|bom|good|independente)/i.test(text)) return 'B1'
  if (/(b[aá]sico|basic|elementar|beginner|iniciante)/i.test(text)) return 'A2'
  return ''
}

function parseLanguages(input: string[]): Language[] {
  const out: Language[] = []
  // "Inglês" on one line and "Nível B2" on the next: join them
  const lines: string[] = []
  for (const l of input) {
    if (lines.length && /^\s*(n[ií]vel\s+)?([ABC][12]|l[ií]ngua materna|nativ[oa]?|fluente|b[aá]sico|interm[eé]dio|avan[cç]ado)\s*$/i.test(l) && !/\d{4}/.test(l)) lines[lines.length - 1] += ' - ' + l.trim()
    else lines.push(l)
  }
  for (const raw of lines) {
    for (const chunk of raw.replace(BULLET, '').split(/\s{3,}|;|\||\s[·•▪]\s|,\s+(?=[A-ZÀ-Ú])/)) {
      const c = chunk.trim()
      if (!c) continue
      const name = c.split(/\s*[-–—:(,]\s*/)[0].trim()
      if (!name || name.split(' ').length > 3 || name.length > 24 || /\d/.test(name) || /(condu|interesse|categoria|certific|n[ií]vel)/i.test(name)) continue
      if (out.some(l => l.name.toLowerCase() === name.toLowerCase())) continue
      out.push({ id: uid(), name: name.charAt(0).toUpperCase() + name.slice(1), level: levelOf(c) })
    }
  }
  return out.slice(0, 8)
}

function parseSkills(input: string[]): string[] {
  const set = new Set<string>()
  // a line starting in lowercase continues the previous one ("Atendimento ao" / "público")
  const lines: string[] = []
  for (const raw of input) {
    const l = clean(raw).replace(/^[^:,;·|]{2,28}:\s*/, '') // "Soft skills: a, b"
    if (lines.length && /^[a-zà-ú]/.test(l)) lines[lines.length - 1] += ' ' + l
    else lines.push(l)
  }
  for (const l of lines) {
    for (const s of l.split(/[,;·|•▪►■●]|\s{3,}/)) {
      const t = s.trim().replace(/\.$/, '')
      if (t.length >= 2 && t.length <= 40 && !/^\d+$/.test(t)) set.add(t)
    }
  }
  return [...set].slice(0, 30)
}

function parseExtras(input: string[]): Extra[] {
  const out: Extra[] = []
  // narrow columns wrap lines: glue continuations back together
  const lines: string[] = []
  for (const raw of input) {
    const l = clean(raw)
    if (!l) continue
    if (lines.length && (/[—–:-]$/.test(lines[lines.length - 1]) || /^[a-zà-ú(]|^[A-Z] \(/.test(l))) lines[lines.length - 1] += ' ' + l
    else lines.push(l)
  }
  for (const l of lines) {
    let kind: Extra['kind'] = 'other'
    if (/carta de condu|driving licen/i.test(l)) kind = 'licence'
    else if (/(certific|curso|course|diploma|workshop|cambridge|dele|delf)/i.test(l)) kind = 'certificate'
    else if (/(pr[eé]mio|award|quadro de (honra|m[eé]rito)|distin)/i.test(l)) kind = 'award'
    else if (/^(interesses|hobbies|interests|passatempos)/i.test(l)) kind = 'interests'
    if (kind === 'interests') {
      const [, rest] = l.split(/:\s*/)
      out.push({ id: uid(), kind, title: 'Interesses', detail: rest ?? l.replace(/^(interesses|hobbies|interests|passatempos)\s*/i, '') })
    } else {
      const [title, ...rest] = l.split(/\s+[—–-]\s+|:\s+/)
      out.push({ id: uid(), kind, title: title.trim(), detail: rest.join(' — ').trim() })
    }
  }
  return out.slice(0, 12)
}

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
const PHONE = /(?:\+?\d{2,3}[\s.-]?)?(?:9\d{2}[\s.-]?\d{3}[\s.-]?\d{3}|\d{3}[\s.-]?\d{3}[\s.-]?\d{3})/
const LINKEDIN = /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/[^\s,;|]+/i
const URL_RE = /(?:https?:\/\/|www\.)[^\s,;|]+/i

export interface ImportResult { cv: CV; found: { education: number; experience: number; skills: number; languages: number; extras: number; summary: boolean; contact: boolean; sections: number } }

export function parseCV(text: string, fileName = 'CV importado'): ImportResult {
  const sections = new Map<SectionId, string[][]>()
  const head: string[] = []
  let count = 0
  // \f separates PDF columns/pages: every chunk starts "outside" any section
  for (const chunk of text.replace(/\r/g, '').split('\f')) {
    let cur: SectionId | null = null
    for (const raw of chunk.split('\n')) {
      const line = raw.replace(/\u00a0/g, ' ').trimEnd()
      if (!line.trim()) continue
      const h = headingOf(line)
      if (h) { cur = h; if (h !== 'contact') count++; if (!sections.has(h)) sections.set(h, []); sections.get(h)!.push([]); continue }
      if (!cur) head.push(line)
      else { const arr = sections.get(cur)!; arr[arr.length - 1].push(line) }
    }
  }
  head.push(...(sections.get('contact') ?? []).flat())
  const sec = (id: SectionId) => (sections.get(id) ?? []).flat()

  const cv = emptyCV(fileName.replace(/\.[^.]+$/, '') || 'CV importado')
  const p = cv.personal

  // header: contacts, name, headline
  const headText = head.join('\n')
  p.email = headText.match(EMAIL)?.[0] ?? ''
  p.linkedin = headText.match(LINKEDIN)?.[0] ?? ''
  const phone = headText.replace(EMAIL, ' ').match(PHONE)?.[0]
  p.phone = phone ? phone.trim() : ''
  p.website = (headText.replace(LINKEDIN, ' ').match(URL_RE)?.[0] ?? '')
  const isContact = (l: string) => EMAIL.test(l) || LINKEDIN.test(l) || URL_RE.test(l) || (PHONE.test(l) && /\d{9}|\d{3}[\s.-]\d{3}/.test(l)) || /\d{4}-\d{3}/.test(l)
  const textual = head.flatMap(l => l.split(/\s+[|·•]\s+|\s{3,}/)).map(l => l.replace(/\s{2,}/g, ' ').trim()).filter(l => l)
  const nameLine = textual.find(l => !isContact(l) && !/\d/.test(l) && l.split(' ').length >= 2 && l.split(' ').length <= 5 && l.length <= 50)
  p.fullName = nameLine ?? ''
  const after = textual.slice(nameLine ? textual.indexOf(nameLine) + 1 : 0)
  p.headline = after.find(l => !isContact(l) && l.length <= 140 && l.length >= 6) ?? ''
  const cityLine = textual.find(l => /\d{4}-\d{3}/.test(l)) ?? textual.find(l => /^[A-ZÀ-Ú][\p{L} -]+,\s*(Portugal|Lisboa|Porto)$/u.test(l))
  p.city = cityLine ? cityLine.replace(/.*\d{4}-\d{3}\s*/, '').replace(/,\s*Portugal$/i, '').trim() : ''
  if (!p.city) { const c = textual.find(l => /^[A-ZÀ-Ú][\p{L} ]{2,25}$/u.test(l) && l !== p.fullName && l !== p.headline && l.split(' ').length <= 3); p.city = c ?? '' }

  const summaryLines = sec('profile').map(clean).filter(Boolean)
  cv.summary = summaryLines.join(' ').replace(/\s+/g, ' ').trim().slice(0, 600)

  cv.education = parseEducation(sec('education'))
  cv.experience = [
    ...parseExperience(sec('experience'), 'job'),
    ...parseExperience(sec('project'), 'project'),
    ...parseExperience(sec('volunteer'), 'volunteer'),
    ...parseExperience(sec('club'), 'club'),
  ]
  cv.skills = parseSkills(sec('skills'))
  cv.languages = parseLanguages(sec('languages'))
  cv.extras = parseExtras(sec('extras'))

  // nothing recognisable: keep the text so the user doesn't lose it
  if (count === 0 && textual.length) cv.summary = textual.filter(l => !isContact(l) && l !== p.fullName).join(' ').slice(0, 600)

  return {
    cv,
    found: { education: cv.education.length, experience: cv.experience.length, skills: cv.skills.length, languages: cv.languages.length, extras: cv.extras.length, summary: !!cv.summary, contact: !!(p.email || p.phone), sections: count },
  }
}
