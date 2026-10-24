import { useCallback, useMemo, useState } from 'react'
import { dicts, LangContext } from './i18n'
import { useDrafts, hasContent } from './store'
import { runChecks, STEP_CHECKS } from './checks'
import { sampleCV, emptyCV } from './types'
import { Home } from './components/Home'
import { Preview } from './components/Preview'
import { TipsCard } from './components/TipsCard'
import { Logo } from './components/ui'
import { downloadPdf } from './exportPdf'
import { ImportModal } from './components/ImportModal'
import type { ImportResult } from './importCV'
import { EducationStep, ExperienceStep, ExtrasStep, FinishStep, LanguagesStep, PersonalStep, SkillsStep, SummaryStep } from './components/Steps'
import type { TipBlock } from './i18n/pt'

const t = dicts.pt

export default function App() {
  const d = useDrafts()
  const { cv, update } = d
  const [view, setView] = useState<'home' | 'edit'>(import.meta.env.DEV && location.search.includes('demo=') ? 'edit' : 'home')
  const [step, setStep] = useState(0)
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [fits, setFits] = useState(true)
  const [guide, setGuide] = useState(false)
  const [busy, setBusy] = useState(false)
  const [importing, setImporting] = useState(false)
  const [note, setNote] = useState<ImportResult['found'] | null>(null)
  const onFit = useCallback((f: boolean) => setFits(f), [])

  const checks = useMemo(() => runChecks(cv, fits), [cv, fits])
  const stepId = t.steps[step].id
  const stepChecks = checks.filter(c => (STEP_CHECKS[stepId] ?? []).includes(c.id))

  const fileBase = () => (cv.personal.fullName || 'CV').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '')

  const printPdf = () => {
    const prev = document.title
    document.title = `${fileBase()}_CV`
    const restore = () => { document.title = prev; window.removeEventListener('afterprint', restore) }
    window.addEventListener('afterprint', restore)
    window.print()
  }

  const exportPdf = async () => {
    if (busy) return
    setBusy(true)
    try {
      await downloadPdf(`${fileBase()}_CV.pdf`, `${cv.personal.fullName || 'CV'} - CV`)
    } catch {
      alert(t.finish.pdfError)
      printPdf()
    } finally { setBusy(false) }
  }

  const backup = () => {
    const blob = new Blob([JSON.stringify(cv, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `primeiro-cv-${(cv.personal.fullName || 'rascunho').toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const start = () => { setView('edit'); setStep(0); setTab('edit') }
  const loadExample = () => {
    if (hasContent(cv) && !confirm(t.actions.confirmLoad)) return
    const ex = sampleCV()
    update(c => ({ ...ex, id: c.id, name: c.name }))
    start()
  }

  const onImported = (r: ImportResult) => {
    d.create(r.cv)
    setImporting(false)
    setNote(r.found)
    start()
  }

  let body: React.ReactNode
  const props = { cv, update }
  switch (stepId) {
    case 'personal': body = <PersonalStep {...props} />; break
    case 'summary': body = <SummaryStep {...props} />; break
    case 'education': body = <EducationStep {...props} />; break
    case 'experience': body = <ExperienceStep {...props} />; break
    case 'skills': body = <SkillsStep {...props} />; break
    case 'languages': body = <LanguagesStep {...props} />; break
    case 'extras': body = <ExtrasStep {...props} />; break
    default: body = <FinishStep {...props} checks={checks} fits={fits} onExport={exportPdf} onPrint={printPdf} busy={busy} onBackup={backup} />
  }
  const tip = (t.tips as Record<string, TipBlock>)[stepId]

  return (
    <LangContext.Provider value={t}>
      <div id="app-root">
        {view === 'home' ? (
          <Home cv={cv} docs={d.docs} onStart={() => { if (!hasContent(cv) && d.docs.filter(hasContent).length) d.create(); start() }}
            onExample={loadExample} onImportCV={() => setImporting(true)} onOpen={id => { d.open(id); start() }} onDelete={d.remove}
            onImport={json => { try { d.importDoc(json); start() } catch { alert(t.home.importError) } }} />
        ) : (
          <div className="shell">
            <header className="topbar">
              <button className="brand" onClick={() => setView('home')} aria-label={t.nav.home}><Logo size={34} /></button>
              <input className="draft-name" aria-label={t.header.draftName} value={cv.name} onChange={e => update(c => ({ ...c, name: e.target.value }))} />
              <span className={`saved ${d.saved}`} title={d.saved === 'saved' ? t.header.saved : t.header.saveError}>{d.saved === 'saved' ? '✓' : '!'}<em>{d.saved === 'saved' ? t.header.saved : t.header.saveError}</em></span>
              <button className="btn small ghost" onClick={() => setGuide(true)}>{t.header.guide}</button>
              <button className="btn small primary" disabled={busy} onClick={exportPdf}>{busy ? '…' : t.header.export}</button>
            </header>

            <nav className="stepper" aria-label="Passos">
              {t.steps.map((s, i) => (
                <button key={s.id} className={`step ${i === step ? 'on' : ''} ${i < step ? 'past' : ''}`} onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined}>
                  <span className="num">{i + 1}</span><span className="lbl">{s.label}</span>
                </button>
              ))}
            </nav>

            <div className={`work tab-${tab}`}>
              <section className="editor" aria-label={t.steps[step].label}>
                {note && (
                  <div className="import-note" role="status">
                    <div>
                      <strong>✓ {t.import.banner}</strong>
                      <p>
                        {note.sections === 0 ? t.import.nothing : <>{t.import.found}: {(['education', 'experience', 'skills', 'languages', 'extras'] as const).filter(k => note[k] > 0).map(k => `${note[k]} ${t.import.items[k]}`).join(' · ')}.</>} {t.import.review}
                      </p>
                      <div className="row"><button className="btn small primary" onClick={() => { setStep(t.steps.length - 1); setNote(null) }}>{t.import.pickTemplate}</button><button className="btn small ghost" onClick={() => setNote(null)}>{t.import.dismiss}</button></div>
                    </div>
                  </div>
                )}
                <div className="card form-card">
                  <div className="step-title"><small>{t.nav.step} {step + 1} {t.nav.of} {t.steps.length}</small><h1>{t.steps[step].label}</h1></div>
                  <TipsCard tip={tip} checks={stepChecks} />
                  {body}
                </div>
                <div className="nav-row">
                  <button className="btn" disabled={step === 0} onClick={() => { setStep(step - 1); window.scrollTo(0, 0) }}>← {t.nav.back}</button>
                  {step < t.steps.length - 1 && <button className="btn primary" onClick={() => { setStep(step + 1); window.scrollTo(0, 0) }}>{t.nav.next} →</button>}
                </div>
                {step === t.steps.length - 1 && (
                  <div className="danger-zone">
                    <button className="btn small ghost" onClick={() => setImporting(true)}>{t.import.short}</button>
                    <button className="btn small ghost" onClick={loadExample}>{t.actions.loadExample}</button>
                    <button className="btn small ghost" onClick={d.duplicate}>{t.actions.duplicate}</button>
                    <button className="btn small ghost" onClick={() => d.create()}>{t.actions.newDraft}</button>
                    <button className="btn small ghost danger" onClick={() => { if (confirm(t.actions.confirmClear)) update(c => ({ ...emptyCV(c.name), id: c.id })) }}>{t.actions.clear}</button>
                  </div>
                )}
              </section>
              <section className="preview-col" aria-label={t.nav.preview}>
                <Preview cv={cv} onFit={onFit} />
                {!fits && <p className="notice warn">{t.finish.pages}</p>}
              </section>
            </div>

            <div className="tabbar" role="tablist">
              <button role="tab" aria-selected={tab === 'edit'} className={tab === 'edit' ? 'on' : ''} onClick={() => { setTab('edit'); window.scrollTo(0, 0) }}>✎ {t.nav.edit}</button>
              <button role="tab" aria-selected={tab === 'preview'} className={tab === 'preview' ? 'on' : ''} onClick={() => { setTab('preview'); window.scrollTo(0, 0) }}>👁 {t.nav.preview}</button>
            </div>
          </div>
        )}

        {importing && <ImportModal onClose={() => setImporting(false)} onImported={onImported} />}
        {guide && (
          <div className="modal" role="dialog" aria-modal="true" aria-label={t.guide.title} onClick={() => setGuide(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="drafts-head"><h2>{t.guide.title}</h2><button className="icon-btn" aria-label="Fechar" onClick={() => setGuide(false)}>✕</button></div>
              <dl>{t.guide.sections.map(s => <div key={s.t}><dt>{s.t}</dt><dd>{s.d}</dd></div>)}</dl>
            </div>
          </div>
        )}
        {/* keep the preview mounted on the home screen too so print root stays valid */}
      </div>
    </LangContext.Provider>
  )
}
