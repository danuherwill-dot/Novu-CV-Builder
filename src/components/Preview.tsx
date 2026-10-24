import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CVDocument } from './CVDocument'
import { paginate } from '../paginate'
import type { CV } from '../types'

const PAGE_MM = 297
const PX_PER_MM = 96 / 25.4

/** Scaled live A4 preview, plus an unscaled copy mounted in #print-root for PDF export. */
export function Preview({ cv, onFit }: { cv: CV; onFit: (fits: boolean) => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const doc = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.6)
  const [h, setH] = useState(PAGE_MM * PX_PER_MM)

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / (210 * PX_PER_MM))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = doc.current
    if (!el) return
    const measure = () => {
      setH(el.offsetHeight)
      onFit(el.offsetHeight <= PAGE_MM * PX_PER_MM + 2)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [onFit])

  useLayoutEffect(() => {
    const el = doc.current
    if (!el) return
    paginate(el)
    setH(el.offsetHeight)
    onFit(el.offsetHeight <= PAGE_MM * PX_PER_MM + 2)
  }, [cv, onFit])

  const pages = Math.max(1, Math.ceil((h - 2) / (PAGE_MM * PX_PER_MM)))
  const printRoot = document.getElementById('print-root')

  return (
    <div className="preview" ref={wrap}>
      <div className="paper" style={{ width: 210 * PX_PER_MM * scale, height: h * scale }}>
        <div className="paper-inner" style={{ transform: `scale(${scale})` }}>
          <CVDocument cv={cv} ref={doc} />
        </div>
        {pages > 1 && Array.from({ length: pages - 1 }, (_, i) => (
          <div key={i} className="page-break" style={{ top: (i + 1) * PAGE_MM * PX_PER_MM * scale }}><span>A4 · {i + 2}</span></div>
        ))}
      </div>
      {printRoot && createPortal(<CVDocument cv={cv} />, printRoot)}
    </div>
  )
}
