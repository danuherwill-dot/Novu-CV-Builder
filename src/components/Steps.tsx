import { useEffect, useRef, useState } from 'react'
import { useT } from '../i18n'
import { PHOTO_TEMPLATES, CV, Education, Experience, ExperienceKind, ExtraKind, TemplateId, uid } from '../types'
import { Area, Chips, Field, ItemCard, MonthYear, TagInput, Text, move } from './ui'
import { CVDocument } from './CVDocument'
import type { Check } from '../checks'

export interface StepProps { cv: CV; update: (fn: (cv: CV) => CV) => void }

export function PhotoBox({ cv, update, note }: StepProps & { note?: string }) {
  const t = useT()
  const p = cv.personal
  const set = (k: keyof typeof p, v: string | boolean) => update(c => ({ ...c, personal: { ...c.personal, [k]: v } }))
  const fileRef = useRef<HTMLInputElement>(null)

  const onFile = (f?: File) => {
    if (!f) return
    const img = new Image()
    const url = URL.createObjectURL(f)
    img.onload = () => {
      const size = 400
      const side = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      canvas.getContext('2d')!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      update(c => ({ ...c, personal: { ...c.personal, photo: canvas.toDataURL('image/jpeg', 0.85), showPhoto: true } }))
    }
    img.src = url
  }

  return (
      <div className="photo-box">
        <div className="photo-thumb">{p.photo ? <img src={p.photo} alt="" /> : <span aria-hidden="true">👤</span>}</div>
        <div className="photo-info">
          <strong>{note ?? t.fields.photo}</strong>
          <p className="field-hint">{t.fields.photoHint}</p>
          <div className="row">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { onFile(e.target.files?.[0]); e.target.value = '' }} />
            <button type="button" className="btn small" onClick={() => fileRef.current?.click()}>{t.fields.photoAdd}</button>
            {p.photo && <button type="button" className="btn small ghost" onClick={() => update(c => ({ ...c, personal: { ...c.personal, photo: '', showPhoto: false } }))}>{t.fields.photoRemove}</button>}
          </div>
          {p.photo && (
            <label className="check"><input type="checkbox" checked={p.showPhoto} onChange={e => set('showPhoto', e.target.checked)} /> {t.fields.photoShow}</label>
          )}
        </div>
      </div>
  )
}

export function PersonalStep({ cv, update }: StepProps) {
  const t = useT()
  const p = cv.personal
  const set = (k: keyof typeof p, v: string | boolean) => update(c => ({ ...c, personal: { ...c.personal, [k]: v } }))
  return (
    <div className="stack">
      <div className="grid2">
        <Text label={t.fields.fullName} value={p.fullName} onChange={v => set('fullName', v)} autoComplete="name" className="span2" />
        <Text label={t.fields.headline} value={p.headline} onChange={v => set('headline', v)} placeholder={t.fields.headlinePh} className="span2" />
        <Text label={t.fields.email} type="email" value={p.email} onChange={v => set('email', v)} autoComplete="email" />
        <Text label={t.fields.phone} type="tel" value={p.phone} onChange={v => set('phone', v)} autoComplete="tel" />
        <Text label={t.fields.city} value={p.city} onChange={v => set('city', v)} />
        <Text label={t.fields.linkedin} value={p.linkedin} onChange={v => set('linkedin', v)} />
        <Text label={t.fields.website} value={p.website} onChange={v => set('website', v)} className="span2" />
      </div>
      <PhotoBox cv={cv} update={update} />
    </div>
  )
}

export function SummaryStep({ cv, update }: StepProps) {
  const t = useT()
  return (
    <Area label={t.fields.summary} rows={7} max={450} value={cv.summary} placeholder={t.fields.summaryPh} onChange={v => update(c => ({ ...c, summary: v }))} />
  )
}

export function EducationStep({ cv, update }: StepProps) {
  const t = useT()
  const set = (id: string, patch: Partial<Education>) => update(c => ({ ...c, education: c.education.map(e => (e.id === id ? { ...e, ...patch } : e)) }))
  const add = () => update(c => ({ ...c, education: [...c.education, { id: uid(), school: '', degree: '', field: '', start: '', end: '', current: false, grade: '', details: '' }] }))
  return (
    <div className="stack">
      {cv.education.map((e, i) => (
        <ItemCard key={e.id} title={e.school || `${t.steps[2].label} ${i + 1}`}
          onRemove={() => update(c => ({ ...c, education: c.education.filter(x => x.id !== e.id) }))}
          onUp={i > 0 ? () => update(c => ({ ...c, education: move(c.education, i, -1) })) : undefined}
          onDown={i < cv.education.length - 1 ? () => update(c => ({ ...c, education: move(c.education, i, 1) })) : undefined}>
          <Text className="span2" label={t.fields.school} value={e.school} onChange={v => set(e.id, { school: v })} />
          <Text label={t.fields.degree} value={e.degree} placeholder={t.fields.degreePh} onChange={v => set(e.id, { degree: v })} />
          <Text label={t.fields.field} value={e.field} placeholder={t.fields.fieldPh} onChange={v => set(e.id, { field: v })} />
          <MonthYear label={t.fields.start} value={e.start} onChange={v => set(e.id, { start: v })} />
          <div>
            <MonthYear label={t.fields.end} value={e.end} disabled={e.current} onChange={v => set(e.id, { end: v })} />
            <label className="check"><input type="checkbox" checked={e.current} onChange={ev => set(e.id, { current: ev.target.checked })} /> {t.fields.current}</label>
          </div>
          <Text className="span2" label={t.fields.grade} value={e.grade} onChange={v => set(e.id, { grade: v })} />
          <Area label={t.fields.details} rows={2} value={e.details} onChange={v => set(e.id, { details: v })} />
        </ItemCard>
      ))}
      <button type="button" className="btn add" onClick={add}>＋ {t.actions.addEdu}</button>
    </div>
  )
}

export function ExperienceStep({ cv, update }: StepProps) {
  const t = useT()
  const set = (id: string, patch: Partial<Experience>) => update(c => ({ ...c, experience: c.experience.map(e => (e.id === id ? { ...e, ...patch } : e)) }))
  const add = () => update(c => ({ ...c, experience: [...c.experience, { id: uid(), kind: 'project', title: '', org: '', location: '', start: '', end: '', current: false, bullets: '' }] }))
  const addVerb = (id: string, current: string, verb: string) => {
    const base = current.replace(/\s+$/, '')
    const lines = base.split('\n')
    const last = lines[lines.length - 1]
    set(id, { bullets: (base === '' ? '' : last.trim() === '' ? base.slice(0, base.lastIndexOf('\n') + 1) : base + '\n') + verb + ' ' })
  }
  return (
    <div className="stack">
      {cv.experience.map((e, i) => (
        <ItemCard key={e.id} title={e.title || e.org || `${t.steps[3].label} ${i + 1}`}
          onRemove={() => update(c => ({ ...c, experience: c.experience.filter(x => x.id !== e.id) }))}
          onUp={i > 0 ? () => update(c => ({ ...c, experience: move(c.experience, i, -1) })) : undefined}
          onDown={i < cv.experience.length - 1 ? () => update(c => ({ ...c, experience: move(c.experience, i, 1) })) : undefined}>
          <Field label={t.fields.kind} className="span2">
            <select value={e.kind} onChange={ev => set(e.id, { kind: ev.target.value as ExperienceKind })}>
              {(Object.keys(t.fields.kinds) as ExperienceKind[]).map(k => <option key={k} value={k}>{t.fields.kinds[k]}</option>)}
            </select>
          </Field>
          <Text label={t.fields.title} value={e.title} onChange={v => set(e.id, { title: v })} />
          <Text label={t.fields.org} value={e.org} onChange={v => set(e.id, { org: v })} />
          <Text className="span2" label={t.fields.location} value={e.location} onChange={v => set(e.id, { location: v })} />
          <MonthYear label={t.fields.start} value={e.start} onChange={v => set(e.id, { start: v })} />
          <div>
            <MonthYear label={t.fields.end} value={e.end} disabled={e.current} onChange={v => set(e.id, { end: v })} />
            <label className="check"><input type="checkbox" checked={e.current} onChange={ev => set(e.id, { current: ev.target.checked })} /> {t.fields.current}</label>
          </div>
          <div className="span2">
            <Area label={t.fields.bullets} rows={5} value={e.bullets} placeholder={t.fields.bulletsPh} onChange={v => set(e.id, { bullets: v })} />
            <div className="verbs">
              <span className="mini-title">{t.fields.verbs}</span>
              <div className="chip-row">
                {t.verbs.map(v => <button type="button" key={v} className="chip-btn" onClick={() => addVerb(e.id, e.bullets, v)}>{v}</button>)}
              </div>
            </div>
          </div>
        </ItemCard>
      ))}
      <button type="button" className="btn add" onClick={add}>＋ {t.actions.addExp}</button>
    </div>
  )
}

export function SkillsStep({ cv, update }: StepProps) {
  const t = useT()
  const add = (s: string) => update(c => (c.skills.some(x => x.toLowerCase() === s.toLowerCase()) ? c : { ...c, skills: [...c.skills, s] }))
  const sug = (list: string[]) => list.filter(s => !cv.skills.includes(s))
  return (
    <div className="stack">
      <Chips items={cv.skills} onRemove={i => update(c => ({ ...c, skills: c.skills.filter((_, j) => j !== i) }))} />
      <TagInput onAdd={add} placeholder={t.fields.skillPh} />
      <div className="verbs">
        <span className="mini-title">{t.fields.skillSuggest}</span>
        <div className="chip-row">
          {[...sug(t.skillSuggestions.tech), ...sug(t.skillSuggestions.soft)].map(s => <button type="button" key={s} className="chip-btn" onClick={() => add(s)}>＋ {s}</button>)}
        </div>
      </div>
    </div>
  )
}

export function LanguagesStep({ cv, update }: StepProps) {
  const t = useT()
  return (
    <div className="stack">
      {cv.languages.map(l => (
        <div className="lang-row" key={l.id}>
          <Text label={t.fields.langName} value={l.name} onChange={v => update(c => ({ ...c, languages: c.languages.map(x => (x.id === l.id ? { ...x, name: v } : x)) }))} />
          <Field label={t.fields.langLevel}>
            <select value={l.level} onChange={e => update(c => ({ ...c, languages: c.languages.map(x => (x.id === l.id ? { ...x, level: e.target.value } : x)) }))}>
              <option value="">—</option>
              <option value="native">{t.fields.native}</option>
              {t.levels.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <button type="button" className="icon-btn danger" aria-label={t.actions.remove} onClick={() => update(c => ({ ...c, languages: c.languages.filter(x => x.id !== l.id) }))}>✕</button>
        </div>
      ))}
      <button type="button" className="btn add" onClick={() => update(c => ({ ...c, languages: [...c.languages, { id: uid(), name: '', level: '' }] }))}>＋ {t.actions.addLang}</button>
    </div>
  )
}

export function ExtrasStep({ cv, update }: StepProps) {
  const t = useT()
  const set = (id: string, patch: object) => update(c => ({ ...c, extras: c.extras.map(x => (x.id === id ? { ...x, ...patch } : x)) }))
  return (
    <div className="stack">
      {cv.extras.map((x, i) => (
        <ItemCard key={x.id} title={x.title || t.fields.extraKinds[x.kind]}
          onRemove={() => update(c => ({ ...c, extras: c.extras.filter(y => y.id !== x.id) }))}
          onUp={i > 0 ? () => update(c => ({ ...c, extras: move(c.extras, i, -1) })) : undefined}
          onDown={i < cv.extras.length - 1 ? () => update(c => ({ ...c, extras: move(c.extras, i, 1) })) : undefined}>
          <Field label={t.fields.extraKind}>
            <select value={x.kind} onChange={e => set(x.id, { kind: e.target.value as ExtraKind })}>
              {(Object.keys(t.fields.extraKinds) as ExtraKind[]).map(k => <option key={k} value={k}>{t.fields.extraKinds[k]}</option>)}
            </select>
          </Field>
          <Text label={t.fields.extraTitle} value={x.title} onChange={v => set(x.id, { title: v })} />
          <Text className="span2" label={t.fields.extraDetail} value={x.detail} onChange={v => set(x.id, { detail: v })} />
        </ItemCard>
      ))}
      <button type="button" className="btn add" onClick={() => update(c => ({ ...c, extras: [...c.extras, { id: uid(), kind: 'certificate', title: '', detail: '' }] }))}>＋ {t.actions.addExtra}</button>
    </div>
  )
}

function Thumb({ cv }: { cv: CV }) {
  const ref = useRef<HTMLDivElement>(null)
  const [k, setK] = useState(0.2)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => el.clientWidth && setK(el.clientWidth / (210 * 96 / 25.4)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return <div className="tpl-thumb" ref={ref} aria-hidden="true"><div className="tpl-scale" style={{ transform: `scale(${k})` }}><CVDocument cv={cv} /></div></div>
}

const ACCENTS = ['#2563eb', '#0f1630', '#0ea5e9', '#0d9488', '#059669', '#65a30d', '#ca8a04', '#ea580c', '#e11d48', '#be185d', '#7c3aed', '#475569']

/** Very light picks would make white header text unreadable, so darken them. */
function readable(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  if (lum <= 0.62) return hex
  const k = 0.62 / lum
  const h = (v: number) => Math.round(v * k).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

export function FinishStep({ cv, update, checks, fits, onExport, onPrint, busy, onBackup }: StepProps & { checks: Check[]; fits: boolean; onExport: () => void; onPrint: () => void; busy: boolean; onBackup: () => void }) {
  const t = useT()
  const f = t.finish
  const done = checks.filter(c => c.ok).length
  const pct = Math.round((done / checks.length) * 100)
  const set = (patch: Partial<CV['settings']>) => update(c => ({ ...c, settings: { ...c.settings, ...patch } }))
  const verdict = pct >= 90 ? f.scoreGood : pct >= 60 ? f.scoreMid : f.scoreLow
  return (
    <div className="stack">
      <div className="score">
        <div className="ring" style={{ ['--p' as string]: pct }} role="img" aria-label={`${pct}%`}><span>{pct}%</span></div>
        <div><strong>{f.score}</strong><p>{verdict}</p></div>
      </div>
      <ul className="checklist big">
        {checks.map(c => <li key={c.id} className={c.ok ? 'ok' : ''}><span className="tick" aria-hidden="true">{c.ok ? '✓' : ''}</span><span>{(t.checks as Record<string, string>)[c.id]}</span></li>)}
      </ul>
      <p className={`notice ${fits ? 'good' : 'warn'}`}>{fits ? f.pageOk : f.pages}</p>

      <div className="mini-title">{f.template}</div>
      <div className="tpl-grid">
        {(Object.keys(f.templates) as TemplateId[]).map(id => (
          <button type="button" key={id} className={`tpl ${cv.settings.template === id ? 'on' : ''}`} onClick={() => { set({ template: id }); if (PHOTO_TEMPLATES.includes(id) && cv.personal.photo) update(c => ({ ...c, personal: { ...c.personal, showPhoto: true } })) }} aria-pressed={cv.settings.template === id}>
            <Thumb cv={{ ...cv, settings: { ...cv.settings, template: id } }} />
            <strong>{f.templates[id].name}{PHOTO_TEMPLATES.includes(id) && <span className="badge">{t.fields.withPhoto}</span>}</strong>
            <small>{f.templates[id].desc}</small>
          </button>
        ))}
      </div>

      {(PHOTO_TEMPLATES.includes(cv.settings.template) || cv.personal.photo) && <PhotoBox cv={cv} update={update} note={!cv.personal.photo ? t.fields.photoNeeded : undefined} />}

      <div className="mini-title">{f.accent}</div>
      <div className="swatches">
        {ACCENTS.map(a => <button type="button" key={a} className={`sw ${cv.settings.accent === a ? 'on' : ''}`} style={{ background: a }} aria-label={a} aria-pressed={cv.settings.accent === a} onClick={() => set({ accent: a })} />)}
        <label className={`sw custom ${ACCENTS.includes(cv.settings.accent) ? '' : 'on'}`} style={{ background: ACCENTS.includes(cv.settings.accent) ? undefined : cv.settings.accent }} title={f.customColor}>
          <span aria-hidden="true">＋</span>
          <input type="color" aria-label={f.customColor} value={cv.settings.accent} onChange={e => set({ accent: readable(e.target.value) })} />
        </label>
      </div>

      <div className="grid2">
        <Field label={f.dateFormat}>
          <select value={cv.settings.dateFormat} onChange={e => set({ dateFormat: e.target.value as 'short' | 'numeric' })}>
            <option value="short">{f.short}</option>
            <option value="numeric">{f.numeric}</option>
          </select>
        </Field>
        <label className="check pad"><input type="checkbox" checked={cv.settings.compact} onChange={e => set({ compact: e.target.checked })} /> {f.compact}</label>
      </div>

      <div className="export-box">
        <strong>{f.exportTitle}</strong>
        <p>{f.exportHow}</p>
        <div className="row">
          <button type="button" className="btn primary big" disabled={busy} onClick={onExport}>{busy ? f.generating : `⬇ ${f.exportBtn}`}</button>
          <button type="button" className="btn ghost" onClick={onPrint}>{f.printAlt}</button>
          <button type="button" className="btn ghost" onClick={onBackup}>{t.actions.download}</button>
        </div>
        <p className="field-hint">{f.backup}</p>
      </div>

      <div className="final">
        <strong>{f.final}</strong>
        <ul>{f.finalList.map(i => <li key={i}><label className="check"><input type="checkbox" /> {i}</label></li>)}</ul>
      </div>
    </div>
  )
}
