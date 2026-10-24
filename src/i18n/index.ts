import { createContext, useContext } from 'react'
import { pt } from './pt'

export type Dict = typeof pt
export type Lang = 'pt' // add 'en' here once src/i18n/en.ts exists

export const dicts: Record<Lang, Dict> = { pt }
export const LangContext = createContext<Dict>(pt)
export const useT = () => useContext(LangContext)
