import { useRef } from 'react'
import { useT } from '../i18n'
import { CV } from '../types'
import { hasContent } from '../store'
import { Logo } from './ui'

interface Props {
  cv: CV
  docs: CV[]
  onStart: () => void
  onExample: () => void
  onImportCV: () => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onImport: (json: string) => void
}

export function Home({ cv, docs, onStart, onExample, onImportCV, onOpen, onDelete, onImport }: Props) {
  const t = useT()
  const fileRef = useRef<HTMLInputElement>(null)
  const date = (n: number) => new Date(n).toLocaleDateString(t.lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const real = docs.filter(hasContent)

  const readFile = (f?: File) => {
    if (!f) return
    f.text().then(onImport).catch(() => alert(t.home.importError))
  }

  return (
    <div className="home">
      <header className="home-top"><Logo size={44} /></header>
      <section className="hero">
        <h1>{t.home.title}<br /><span>{t.home.titleHi}</span></h1>
        <p>{t.home.sub}</p>
        <div className="row center">
          <button className="btn primary big" onClick={onStart}>{hasContent(cv) ? t.home.continue : t.home.start} →</button>
          <button className="btn ghost-light big" onClick={onImportCV}>{t.import.button}</button>
          <button className="btn ghost-light big" onClick={onExample}>{t.home.example}</button>
        </div>
      </section>

      <section className="features">
        {t.home.features.map(f => (
          <div className="feature" key={f.t}><strong>{f.t}</strong><p>{f.d}</p></div>
        ))}
      </section>

      <section className="drafts card">
        <div className="drafts-head">
          <h2>{t.home.drafts}</h2>
          <>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={e => { readFile(e.target.files?.[0]); e.target.value = '' }} />
            <button className="btn small ghost" onClick={() => fileRef.current?.click()}>{t.home.import}</button>
          </>
        </div>
        {real.length === 0 ? <p className="muted">{t.home.noDrafts}</p> : (
          <ul>
            {real.map(d => (
              <li key={d.id}>
                <div>
                  <strong>{d.personal.fullName || d.name || t.home.untitled}</strong>
                  <small>{d.name} · {t.home.updated} {date(d.updatedAt)}</small>
                </div>
                <div className="row">
                  <button className="btn small" onClick={() => onOpen(d.id)}>{t.home.open}</button>
                  <button className="btn small ghost danger" onClick={() => { if (confirm(t.home.confirmDelete)) onDelete(d.id) }}>{t.home.delete}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="privacy">🔒 {t.home.privacy}</p>
    </div>
  )
}
