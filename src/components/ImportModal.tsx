import { useRef, useState } from 'react'
import { useT } from '../i18n'
import { ImportResult, parseCV, readFileText } from '../importCV'

export function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: (r: ImportResult) => void }) {
  const t = useT()
  const L = t.import
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [over, setOver] = useState(false)

  const handle = async (file?: File) => {
    if (!file) return
    setError('')
    if (file.name.toLowerCase().endsWith('.doc')) { setError(L.oldDoc); return }
    setBusy(true)
    try {
      const text = await readFileText(file)
      if (text.replace(/\s/g, '').length < 30) { setError(L.errorEmpty); return }
      onImported(parseCV(text, file.name))
    } catch (e) {
      setError((e as Error).message === 'unsupported' ? L.errorType : L.errorRead)
    } finally { setBusy(false) }
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={L.title} onClick={onClose}>
      <div className="modal-card wide" onClick={e => e.stopPropagation()}>
        <div className="drafts-head"><h2>{L.title}</h2><button className="icon-btn" aria-label={L.dismiss} onClick={onClose}>✕</button></div>
        <p className="muted">{L.sub}</p>
        <input ref={ref} type="file" hidden accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={e => { handle(e.target.files?.[0]); e.target.value = '' }} />
        <button type="button" className={`dropzone ${over ? 'over' : ''}`} disabled={busy}
          onClick={() => ref.current?.click()}
          onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
          onDrop={e => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files?.[0]) }}>
          <span className="dz-icon" aria-hidden="true">{busy ? '⏳' : '📄'}</span>
          <strong>{busy ? L.reading : L.drop}</strong>
          <small>{L.types}</small>
        </button>
        {error && <p className="notice warn" role="alert">{error}</p>}
        <p className="field-hint">🔒 {L.privacy}</p>
      </div>
    </div>
  )
}
