import { forwardRef, memo } from 'react'
import { useT } from '../i18n'
import { fmtRange, lines, levelLabel, cleanUrl } from '../format'
import { CV, Experience, Education, PHOTO_TEMPLATES } from '../types'
import { accentVars } from '../accentVars'
import '../cv.css'

function Contacts({ cv, className }: { cv: CV; className?: string }) {
  const p = cv.personal
  const items = [p.email, p.phone, p.city, p.linkedin && cleanUrl(p.linkedin), p.website && cleanUrl(p.website)].filter(Boolean)
  return (
    <ul className={className ?? 'cv-contacts'}>
      {items.map(i => <li key={i}>{i}</li>)}
    </ul>
  )
}

function Photo({ cv }: { cv: CV }) {
  const has = cv.personal.showPhoto && cv.personal.photo
  if (has) return <img className="cv-photo" src={cv.personal.photo} alt="" />
  // photo-first templates keep their layout with a placeholder (hidden in the PDF)
  if (PHOTO_TEMPLATES.includes(cv.settings.template)) {
    return (
      <div className="cv-photo cv-photo-ph" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="55%" height="55%" fill="currentColor"><circle cx="12" cy="8" r="4.2" /><path d="M3.5 21c0-4.7 3.8-8 8.5-8s8.5 3.3 8.5 8z" /></svg>
      </div>
    )
  }
  return null
}

function Bullets({ text }: { text: string }) {
  const l = lines(text)
  if (!l.length) return null
  return <ul className="cv-bullets">{l.map((b, i) => <li key={i}>{b}</li>)}</ul>
}

function eduTitle(e: Education) {
  return [e.degree, e.field].filter(Boolean).join(' — ')
}

export const CVDocument = memo(forwardRef<HTMLDivElement, { cv: CV }>(function CVDocument({ cv }, ref) {
  const t = useT()
  const s = cv.settings
  const p = cv.personal
  const range = (a: string, b: string, c: boolean) => fmtRange(a, b, c, s.dateFormat, t)
  const name = p.fullName || t.cv.placeholderName
  const empty = !p.fullName && !cv.summary && !cv.education.length && !cv.experience.length && !cv.skills.length

  const Exp = ({ e }: { e: Experience }) => (
    <div className="cv-entry">
      <div className="cv-entry-head">
        <div><strong>{e.title}</strong>{e.title && e.org ? ' · ' : ''}{e.org}{e.location ? `, ${e.location}` : ''}</div>
        <span className="cv-date">{range(e.start, e.end, e.current)}</span>
      </div>
      <Bullets text={e.bullets} />
    </div>
  )
  const Edu = ({ e }: { e: Education }) => (
    <div className="cv-entry">
      <div className="cv-entry-head">
        <div><strong>{eduTitle(e)}</strong>{e.school ? <><br />{e.school}</> : null}</div>
        <span className="cv-date">{range(e.start, e.end, e.current)}</span>
      </div>
      {e.grade && <div className="cv-note">{e.grade}</div>}
      {e.details && <div className="cv-note">{e.details}</div>}
    </div>
  )

  const skills = cv.skills.length > 0 && <ul className="cv-chips">{cv.skills.map(k => <li key={k}>{k}</li>)}</ul>
  const langs = cv.languages.length > 0 && (
    <ul className="cv-langs">
      {cv.languages.map(l => <li key={l.id}><strong>{l.name}</strong><span>{levelLabel(l.level, t)}</span></li>)}
    </ul>
  )
  const extras = cv.extras.length > 0 && (
    <ul className="cv-extras">
      {cv.extras.map(x => <li key={x.id}>{x.kind === 'interests' ? <><strong>{x.title || t.fields.extraKinds.interests}:</strong> {x.detail}</> : <><strong>{x.title}</strong>{x.detail ? ` — ${x.detail}` : ''}</>}</li>)}
    </ul>
  )

  const Section = ({ title, children, show = true }: { title: string; children: React.ReactNode; show?: boolean }) =>
    show ? <section className="cv-section"><h2>{title}</h2>{children}</section> : null

  const cls = `cv cv-${s.template}${s.compact ? ' compact' : ''}`
  const style = accentVars(s.accent) as React.CSSProperties

  let body: React.ReactNode
  if (s.template === 'moderno') {
    body = (
      <>
        <header className="cv-head">
          <Photo cv={cv} />
          <div>
            <h1>{name}</h1>
            {p.headline && <p className="cv-headline">{p.headline}</p>}
            <Contacts cv={cv} />
          </div>
        </header>
        <div className="cv-cols">
          <main>
            <Section title={t.cv.profile} show={!!cv.summary}><p>{cv.summary}</p></Section>
            <Section title={t.cv.education} show={cv.education.length > 0}>{cv.education.map(e => <Edu key={e.id} e={e} />)}</Section>
            <Section title={t.cv.experience} show={cv.experience.length > 0}>{cv.experience.map(e => <Exp key={e.id} e={e} />)}</Section>
          </main>
          <aside>
            <Section title={t.cv.skills} show={cv.skills.length > 0}>{skills}</Section>
            <Section title={t.cv.languages} show={cv.languages.length > 0}>{langs}</Section>
            <Section title={t.cv.extras} show={cv.extras.length > 0}>{extras}</Section>
          </aside>
        </div>
      </>
    )
  } else if (s.template === 'retrato') {
    body = (
      <>
        <header className="cv-head">
          <Photo cv={cv} />
          <div>
            <h1>{name}</h1>
            {p.headline && <p className="cv-headline">{p.headline}</p>}
            <Contacts cv={cv} />
          </div>
        </header>
        <div className="cv-body">
          <Section title={t.cv.profile} show={!!cv.summary}><p>{cv.summary}</p></Section>
          <Section title={t.cv.education} show={cv.education.length > 0}>{cv.education.map(e => <Edu key={e.id} e={e} />)}</Section>
          <Section title={t.cv.experience} show={cv.experience.length > 0}>{cv.experience.map(e => <Exp key={e.id} e={e} />)}</Section>
          <div className="cv-trio">
            <Section title={t.cv.skills} show={cv.skills.length > 0}>{skills}</Section>
            <div>
              <Section title={t.cv.languages} show={cv.languages.length > 0}>{langs}</Section>
              <Section title={t.cv.extras} show={cv.extras.length > 0}>{extras}</Section>
            </div>
          </div>
        </div>
      </>
    )
  } else if (s.template === 'centrado') {
    body = (
      <>
        <div className="cv-banner" />
        <header className="cv-head">
          <Photo cv={cv} />
          <h1>{name}</h1>
          {p.headline && <p className="cv-headline">{p.headline}</p>}
          <Contacts cv={cv} />
        </header>
        <div className="cv-cols">
          <main>
            <Section title={t.cv.profile} show={!!cv.summary}><p>{cv.summary}</p></Section>
            <Section title={t.cv.education} show={cv.education.length > 0}>{cv.education.map(e => <Edu key={e.id} e={e} />)}</Section>
            <Section title={t.cv.experience} show={cv.experience.length > 0}>{cv.experience.map(e => <Exp key={e.id} e={e} />)}</Section>
          </main>
          <aside>
            <Section title={t.cv.skills} show={cv.skills.length > 0}>{skills}</Section>
            <Section title={t.cv.languages} show={cv.languages.length > 0}>{langs}</Section>
            <Section title={t.cv.extras} show={cv.extras.length > 0}>{extras}</Section>
          </aside>
        </div>
      </>
    )
  } else if (s.template === 'lateral') {
    body = (
      <div className="cv-side">
        <aside>
          <Photo cv={cv} />
          <section className="cv-section"><h2>{t.cv.contact}</h2><Contacts cv={cv} /></section>
          <Section title={t.cv.skills} show={cv.skills.length > 0}>{skills}</Section>
          <Section title={t.cv.languages} show={cv.languages.length > 0}>{langs}</Section>
          <Section title={t.cv.extras} show={cv.extras.length > 0}>{extras}</Section>
        </aside>
        <main>
          <header className="cv-head">
            <h1>{name}</h1>
            {p.headline && <p className="cv-headline">{p.headline}</p>}
          </header>
          <Section title={t.cv.profile} show={!!cv.summary}><p>{cv.summary}</p></Section>
          <Section title={t.cv.education} show={cv.education.length > 0}>{cv.education.map(e => <Edu key={e.id} e={e} />)}</Section>
          <Section title={t.cv.experience} show={cv.experience.length > 0}>{cv.experience.map(e => <Exp key={e.id} e={e} />)}</Section>
        </main>
      </div>
    )
  } else if (s.template === 'audaz') {
    body = (
      <>
        <header className="cv-head">
          <div>
            <h1>{name}</h1>
            {p.headline && <p className="cv-headline">{p.headline}</p>}
          </div>
          <Photo cv={cv} />
        </header>
        <Contacts cv={cv} className="cv-contacts cv-strip" />
        <div className="cv-body">
          <Section title={t.cv.profile} show={!!cv.summary}><p>{cv.summary}</p></Section>
          <Section title={t.cv.education} show={cv.education.length > 0}>{cv.education.map(e => <Edu key={e.id} e={e} />)}</Section>
          <Section title={t.cv.experience} show={cv.experience.length > 0}>{cv.experience.map(e => <Exp key={e.id} e={e} />)}</Section>
          <Section title={t.cv.skills} show={cv.skills.length > 0}>{skills}</Section>
          <Section title={t.cv.languages} show={cv.languages.length > 0}>{langs}</Section>
          <Section title={t.cv.extras} show={cv.extras.length > 0}>{extras}</Section>
        </div>
      </>
    )
  } else if (s.template === 'minimal') {
    body = (
      <>
        <header className="cv-head">
          <div>
            <h1>{name}</h1>
            {p.headline && <p className="cv-headline">{p.headline}</p>}
            <Contacts cv={cv} />
          </div>
          <Photo cv={cv} />
        </header>
        <Section title={t.cv.profile} show={!!cv.summary}><p>{cv.summary}</p></Section>
        <Section title={t.cv.education} show={cv.education.length > 0}>{cv.education.map(e => <Edu key={e.id} e={e} />)}</Section>
        <Section title={t.cv.experience} show={cv.experience.length > 0}>{cv.experience.map(e => <Exp key={e.id} e={e} />)}</Section>
        <Section title={t.cv.skills} show={cv.skills.length > 0}><p>{cv.skills.join(' · ')}</p></Section>
        <Section title={t.cv.languages} show={cv.languages.length > 0}>
          <p>{cv.languages.map(l => `${l.name}${l.level ? ` (${l.level === 'native' ? t.cv.native : l.level})` : ''}`).join(' · ')}</p>
        </Section>
        <Section title={t.cv.extras} show={cv.extras.length > 0}>{extras}</Section>
      </>
    )
  } else if (s.template === 'classico') {
    body = (
      <>
        <header className="cv-head">
          <Photo cv={cv} />
          <h1>{name}</h1>
          {p.headline && <p className="cv-headline">{p.headline}</p>}
          <Contacts cv={cv} />
        </header>
        <Section title={t.cv.profile} show={!!cv.summary}><p>{cv.summary}</p></Section>
        <Section title={t.cv.education} show={cv.education.length > 0}>{cv.education.map(e => <Edu key={e.id} e={e} />)}</Section>
        <Section title={t.cv.experience} show={cv.experience.length > 0}>{cv.experience.map(e => <Exp key={e.id} e={e} />)}</Section>
        <Section title={t.cv.skills} show={cv.skills.length > 0}><p>{cv.skills.join(' · ')}</p></Section>
        <Section title={t.cv.languages} show={cv.languages.length > 0}>
          <p>{cv.languages.map(l => `${l.name}${l.level ? ` (${l.level === 'native' ? t.cv.native : l.level})` : ''}`).join(' · ')}</p>
        </Section>
        <Section title={t.cv.extras} show={cv.extras.length > 0}>{extras}</Section>
      </>
    )
  } else {
    // europass-style: dates/labels in a left column
    const Row = ({ left, children }: { left: React.ReactNode; children: React.ReactNode }) => (
      <div className="cv-row"><div className="cv-row-l">{left}</div><div className="cv-row-r">{children}</div></div>
    )
    body = (
      <>
        <header className="cv-head">
          <div>
            <h1>{name}</h1>
            {p.headline && <p className="cv-headline">{p.headline}</p>}
            <Contacts cv={cv} />
          </div>
          <Photo cv={cv} />
        </header>
        <Section title={t.cv.profile} show={!!cv.summary}><Row left=""><p>{cv.summary}</p></Row></Section>
        <Section title={t.cv.education} show={cv.education.length > 0}>
          {cv.education.map(e => <Row key={e.id} left={range(e.start, e.end, e.current)}><Edu e={{ ...e, start: '', end: '', current: false }} /></Row>)}
        </Section>
        <Section title={t.cv.experience} show={cv.experience.length > 0}>
          {cv.experience.map(e => <Row key={e.id} left={range(e.start, e.end, e.current)}><Exp e={{ ...e, start: '', end: '', current: false }} /></Row>)}
        </Section>
        <Section title={t.cv.skills} show={cv.skills.length > 0}><Row left="">{skills}</Row></Section>
        <Section title={t.cv.languages} show={cv.languages.length > 0}><Row left="">{langs}</Row></Section>
        <Section title={t.cv.extras} show={cv.extras.length > 0}><Row left="">{extras}</Row></Section>
      </>
    )
  }

  return (
    <div className={cls} style={style} ref={ref}>
      {empty ? <p className="cv-empty">{t.cv.empty}</p> : null}
      {body}
    </div>
  )
}))
