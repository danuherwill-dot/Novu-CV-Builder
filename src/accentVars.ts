/** Pre-computed accent tints so the CV never needs CSS color-mix() (html2canvas cannot parse it). */
const COMBOS: [number, string][] = [[10, 'fff'], [22, '0b1020'], [25, '0b1020'], [30, 'fff'], [55, '0ea5e9'], [55, 'fff'], [80, '000'], [82, '000'], [85, '000']]

const toRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const n = parseInt(f, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function accentVars(accent: string): Record<string, string> {
  const a = toRgb(accent)
  const out: Record<string, string> = { '--acc': accent }
  for (const [pct, other] of COMBOS) {
    const o = toRgb(other)
    const c = a.map((v, i) => Math.round((v * pct + o[i] * (100 - pct)) / 100))
    out[`--acc-${pct}-${other}`] = `rgb(${c.join(',')})`
  }
  return out
}
