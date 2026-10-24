import { useState, KeyboardEvent, ReactNode, useId } from 'react'
import { useT } from '../i18n'

export function Field({ label, children, hint, className = '' }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function Text({ label, value, onChange, placeholder, type = 'text', className, autoComplete }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string; autoComplete?: string
}) {
  return (
    <Field label={label} className={className}>
      <input type={type} value={value} placeholder={placeholder} autoComplete={autoComplete} onChange={e => onChange(e.target.value)} />
    </Field>
  )
}

export function Area({ label, value, onChange, placeholder, rows = 4, max, hint, areaRef }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; max?: number; hint?: string
  areaRef?: React.Ref<HTMLTextAreaElement>
}) {
  const t = useT()
  return (
    <Field label={label} hint={hint}>
      <textarea ref={areaRef} rows={rows} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
      {max ? <span className={`counter ${value.length > max ? 'over' : ''}`}>{value.length} / {max} {t.fields.chars}</span> : null}
    </Field>
  )
}

/** Month + year pair. Value is '', 'YYYY' or 'YYYY-MM'. */
export function MonthYear({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const t = useT()
  const [y = '', m = ''] = value.split('-')
  const set = (ny: string, nm: string) => onChange(!ny ? '' : nm ? `${ny}-${nm}` : ny)
  const id = useId()
  return (
    <fieldset className="field monthyear" disabled={disabled}>
      <legend className="field-label">{label}</legend>
      <div className="my-row">
        <select aria-label={`${label} — ${t.fields.month}`} id={id} value={m} onChange={e => set(y, e.target.value)}>
          <option value="">{t.fields.month}</option>
          {t.months.map((n, i) => <option key={n} value={String(i + 1).padStart(2, '0')}>{n}</option>)}
        </select>
        <input aria-label={`${label} — ${t.fields.year}`} inputMode="numeric" maxLength={4} placeholder={t.fields.year} value={y}
          onChange={e => set(e.target.value.replace(/\D/g, '').slice(0, 4), m)} />
      </div>
    </fieldset>
  )
}

export function Chips({ items, onRemove }: { items: string[]; onRemove: (i: number) => void }) {
  const t = useT()
  return (
    <ul className="chips">
      {items.map((s, i) => (
        <li key={s + i} className="chip">
          {s}
          <button type="button" aria-label={`${t.actions.remove}: ${s}`} onClick={() => onRemove(i)}>×</button>
        </li>
      ))}
    </ul>
  )
}

export function TagInput({ onAdd, placeholder }: { onAdd: (v: string) => void; placeholder: string }) {
  const [v, setV] = useState('')
  const t = useT()
  const commit = () => { const s = v.trim().replace(/,$/, ''); if (s) onAdd(s); setV('') }
  const key = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() } }
  return (
    <div className="taginput">
      <input value={v} placeholder={placeholder} onChange={e => setV(e.target.value)} onKeyDown={key} onBlur={commit} />
      <button type="button" className="btn small" onClick={commit}>{t.actions.add}</button>
    </div>
  )
}

export function ItemCard({ title, onRemove, onUp, onDown, children }: { title: string; onRemove: () => void; onUp?: () => void; onDown?: () => void; children: ReactNode }) {
  const t = useT()
  return (
    <div className="item-card">
      <div className="item-head">
        <strong>{title}</strong>
        <div className="item-actions">
          {onUp && <button type="button" className="icon-btn" aria-label={t.actions.up} onClick={onUp}>↑</button>}
          {onDown && <button type="button" className="icon-btn" aria-label={t.actions.down} onClick={onDown}>↓</button>}
          <button type="button" className="icon-btn danger" aria-label={t.actions.remove} onClick={onRemove}>✕</button>
        </div>
      </div>
      <div className="grid2">{children}</div>
    </div>
  )
}

export function move<T>(arr: T[], i: number, d: number): T[] {
  const j = i + d
  if (j < 0 || j >= arr.length) return arr
  const c = arr.slice()
  ;[c[i], c[j]] = [c[j], c[i]]
  return c
}

/** Novu wordmark: the square logo cropped to its centre band. */
export function Logo({ size = 32 }: { size?: number }) {
  return <span className="logo" role="img" aria-label="Novu" style={{ height: size, width: size * 3.2 }} />
}
