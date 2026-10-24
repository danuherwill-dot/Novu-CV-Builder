import { useT } from '../i18n'
import type { TipBlock } from '../i18n/pt'
import type { Check } from '../checks'

export function TipsCard({ tip, checks }: { tip: TipBlock; checks: Check[] }) {
  const t = useT()
  const L = t.tipsLabel
  return (
    <aside className="tips" aria-label={L.tip}>
      <div className="tips-head"><span className="bulb" aria-hidden="true">💡</span><strong>{tip.title}</strong></div>
      <p className="tips-intro">{tip.intro}</p>

      {checks.length > 0 && (
        <div className="checklist">
          <div className="mini-title">{L.checklist}</div>
          <ul>
            {checks.map(c => (
              <li key={c.id} className={c.ok ? 'ok' : ''}>
                <span className="tick" aria-hidden="true">{c.ok ? '✓' : ''}</span>
                <span>{(t.checks as Record<string, string>)[c.id]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tip.examples.length > 0 && (
        <details className="tips-det">
          <summary>{L.examples}</summary>
          {tip.examples.map((ex, i) => (
            <div className="example" key={i}>
              {ex.bad && <div className="ex bad"><span>{L.bad}</span><p>{ex.bad}</p></div>}
              <div className="ex good"><span>{L.good}</span><p>{ex.good}</p></div>
              {ex.why && <p className="why">{ex.why}</p>}
            </div>
          ))}
        </details>
      )}

      <details className="tips-det">
        <summary>{L.dos}</summary>
        <ul className="dolist yes">{tip.dos.map(d => <li key={d}>{d}</li>)}</ul>
      </details>
      <details className="tips-det">
        <summary>{L.donts}</summary>
        <ul className="dolist no">{tip.donts.map(d => <li key={d}>{d}</li>)}</ul>
      </details>
    </aside>
  )
}
