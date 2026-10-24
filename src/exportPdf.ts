/**
 * Direct PDF download, generated in the browser (no print dialog, works on phones).
 * The page is rendered at high resolution and an invisible text layer is added on top,
 * so the PDF can still be searched, selected and read by recruitment software (ATS).
 */
export async function downloadPdf(fileName: string, title: string): Promise<void> {
  const root = document.getElementById('print-root')
  const el = root?.querySelector<HTMLElement>('.cv')
  if (!root || !el) throw new Error('no cv')
  const previous = root.getAttribute('style')
  root.style.cssText = 'display:block;position:fixed;left:-10000px;top:0;width:210mm;'
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
    await new Promise(r => requestAnimationFrame(() => r(null)))
    const W = el.offsetWidth
    const H = el.offsetHeight
    const scale = H / W > 1.6 ? 2.2 : 3 // stay under mobile canvas size limits on 2-page CVs
    const canvas = await html2canvas(el, { scale, backgroundColor: '#ffffff', useCORS: true, logging: false, width: W, height: H, windowWidth: W })

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
    pdf.setProperties({ title })
    const pageH = (canvas.width * 297) / 210
    const pages = Math.max(1, Math.ceil((canvas.height - 4) / pageH))
    for (let i = 0; i < pages; i++) {
      const slice = document.createElement('canvas')
      slice.width = canvas.width
      slice.height = Math.round(pageH)
      const ctx = slice.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, slice.width, slice.height)
      ctx.drawImage(canvas, 0, i * pageH, canvas.width, Math.min(pageH, canvas.height - i * pageH), 0, 0, canvas.width, Math.min(pageH, canvas.height - i * pageH))
      if (i > 0) pdf.addPage()
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297, undefined, 'FAST')
    }

    // invisible text layer
    const base = el.getBoundingClientRect()
    const k = 210 / base.width
    const clean = (w: string) => w.replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^ -ÿ]/g, '')
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const range = document.createRange()
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const node = n as Text
      if (!node.data.trim()) continue
      for (const m of node.data.matchAll(/\S+/g)) {
        const word = clean(m[0])
        if (!word) continue
        range.setStart(node, m.index!)
        range.setEnd(node, m.index! + m[0].length)
        const r = range.getBoundingClientRect()
        if (!r.width || !r.height) continue
        const mid = ((r.top + r.bottom) / 2 - base.top) * k
        const page = Math.min(pages - 1, Math.max(0, Math.floor(mid / 297)))
        pdf.setPage(page + 1)
        pdf.setFontSize((r.height * k * 2.8346) / 1.15)
        pdf.text(word, (r.left - base.left) * k, (r.bottom - base.top) * k - page * 297 - r.height * k * 0.2, { renderingMode: 'invisible' })
      }
    }
    pdf.save(fileName)
  } finally {
    if (previous === null) root.removeAttribute('style')
    else root.setAttribute('style', previous)
  }
}
