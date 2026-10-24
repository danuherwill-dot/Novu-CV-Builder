import { useCallback, useEffect, useRef, useState } from 'react'
import { CV, emptyCV, sampleCV, uid } from './types'

const KEY = 'primeirocv.v1'

interface Saved {
  currentId: string
  docs: Record<string, CV>
}

function load(): Saved {
  if (import.meta.env.DEV) {
    // dev-only: ?demo=classico loads the example CV in that template (used for PDF checks)
    const tpl = new URLSearchParams(location.search).get('demo')
    if (tpl) {
      const cv = sampleCV()
      cv.settings.template = tpl as CV['settings']['template']
      return { currentId: cv.id, docs: { [cv.id]: cv } }
    }
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as Saved
      if (s.docs && s.currentId && s.docs[s.currentId]) return s
    }
  } catch { /* private mode or corrupt data: start fresh */ }
  const cv = emptyCV()
  return { currentId: cv.id, docs: { [cv.id]: cv } }
}

export function hasContent(cv: CV) {
  return !!(cv.personal.fullName || cv.summary || cv.education.length || cv.experience.length || cv.skills.length)
}

export function useDrafts() {
  const [state, setState] = useState<Saved>(load)
  const [saved, setSaved] = useState<'saved' | 'error'>('saved')
  const timer = useRef<number>()

  useEffect(() => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state))
        setSaved('saved')
      } catch { setSaved('error') }
    }, 350)
    return () => window.clearTimeout(timer.current)
  }, [state])

  const cv = state.docs[state.currentId]

  const update = useCallback((fn: (cv: CV) => CV) => {
    setState(s => ({ ...s, docs: { ...s.docs, [s.currentId]: { ...fn(s.docs[s.currentId]), updatedAt: Date.now() } } }))
  }, [])

  const create = useCallback((base?: CV) => {
    const n = base ? { ...base, id: uid(), updatedAt: Date.now() } : emptyCV(`CV ${Object.keys(state.docs).length + 1}`)
    setState(s => ({ currentId: n.id, docs: { ...s.docs, [n.id]: n } }))
  }, [state.docs])

  const duplicate = useCallback(() => create({ ...cv, name: cv.name + ' (cópia)' }), [create, cv])

  const open = useCallback((id: string) => setState(s => (s.docs[id] ? { ...s, currentId: id } : s)), [])

  const remove = useCallback((id: string) => {
    setState(s => {
      const docs = { ...s.docs }
      delete docs[id]
      const ids = Object.keys(docs)
      if (!ids.length) { const n = emptyCV(); return { currentId: n.id, docs: { [n.id]: n } } }
      return { currentId: s.currentId === id ? ids[0] : s.currentId, docs }
    })
  }, [])

  const importDoc = useCallback((json: string) => {
    const parsed = JSON.parse(json) as CV
    if (!parsed || typeof parsed !== 'object' || !parsed.personal) throw new Error('invalid')
    const base = emptyCV()
    const n: CV = { ...base, ...parsed, personal: { ...base.personal, ...parsed.personal }, settings: { ...base.settings, ...parsed.settings }, id: uid(), updatedAt: Date.now() }
    setState(s => ({ currentId: n.id, docs: { ...s.docs, [n.id]: n } }))
  }, [])

  return { cv, docs: Object.values(state.docs).sort((a, b) => b.updatedAt - a.updatedAt), update, create, duplicate, open, remove, importDoc, saved }
}
