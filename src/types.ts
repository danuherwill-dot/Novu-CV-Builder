export type TemplateId = 'moderno' | 'retrato' | 'centrado' | 'lateral' | 'audaz' | 'minimal' | 'classico' | 'europass'
/** Templates designed around a photo: they show a placeholder until one is added. */
export const PHOTO_TEMPLATES: TemplateId[] = ['retrato', 'centrado']
export type DateFormat = 'short' | 'numeric'
export type ExperienceKind = 'job' | 'project' | 'volunteer' | 'club'
export type ExtraKind = 'certificate' | 'award' | 'interests' | 'licence' | 'other'

export interface Personal {
  fullName: string
  headline: string
  email: string
  phone: string
  city: string
  linkedin: string
  website: string
  photo: string // data URL, resized in the browser
  showPhoto: boolean
}

export interface Education {
  id: string
  school: string
  degree: string
  field: string
  start: string // '' | 'YYYY' | 'YYYY-MM'
  end: string
  current: boolean
  grade: string
  details: string
}

export interface Experience {
  id: string
  kind: ExperienceKind
  title: string
  org: string
  location: string
  start: string
  end: string
  current: boolean
  bullets: string // one achievement per line
}

export interface Language {
  id: string
  name: string
  level: string // A1..C2 | 'native'
}

export interface Extra {
  id: string
  kind: ExtraKind
  title: string
  detail: string
}

export interface Settings {
  template: TemplateId
  accent: string
  dateFormat: DateFormat
  compact: boolean
}

export interface CV {
  id: string
  name: string // draft name, not shown in the CV
  updatedAt: number
  personal: Personal
  summary: string
  education: Education[]
  experience: Experience[]
  skills: string[]
  languages: Language[]
  extras: Extra[]
  settings: Settings
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export const emptyCV = (name = 'O meu CV'): CV => ({
  id: uid(),
  name,
  updatedAt: Date.now(),
  personal: { fullName: '', headline: '', email: '', phone: '', city: '', linkedin: '', website: '', photo: '', showPhoto: false },
  summary: '',
  education: [],
  experience: [],
  skills: [],
  languages: [],
  extras: [],
  settings: { template: 'moderno', accent: '#2563eb', dateFormat: 'short', compact: false },
})

export const sampleCV = (): CV => ({
  ...emptyCV('CV de exemplo'),
  personal: {
    fullName: 'Inês Carvalho', headline: 'Estudante à procura do primeiro part-time em atendimento ao cliente',
    email: 'ines.carvalho@email.com', phone: '912 345 678', city: 'Porto',
    linkedin: 'linkedin.com/in/ines-carvalho', website: '', photo: '', showPhoto: false,
  },
  summary: 'Estudante do 12.º ano de Línguas e Humanidades, comunicativa e organizada, com experiência em voluntariado e projetos de equipa na escola. Procuro um part-time em atendimento ao cliente onde possa usar o meu inglês e aprender com uma equipa.',
  education: [{
    id: uid(), school: 'Escola Secundária Santa Maria Maior', degree: 'Ensino Secundário', field: 'Línguas e Humanidades',
    start: '2023-09', end: '2026-06', current: false, grade: 'Média atual: 16 valores',
    details: 'Destaque a Inglês (18) e Filosofia (17).',
  }],
  experience: [
    { id: uid(), kind: 'volunteer', title: 'Voluntária', org: 'Banco Alimentar', location: 'Porto', start: '2024-11', end: '', current: true,
      bullets: 'Organizei e embalei mais de 300 cabazes em duas campanhas de recolha\nApoiei a receção de cerca de 40 voluntários por campanha\nTrabalhei em equipa com ritmos exigentes e prazos curtos' },
    { id: uid(), kind: 'project', title: 'Coordenadora de equipa — Feira de Empreendedorismo', org: 'Escola Secundária Santa Maria Maior', location: '', start: '2025-01', end: '2025-05', current: false,
      bullets: 'Liderei uma equipa de 5 colegas na criação e venda de uma linha de marcadores de livros\nGeri um orçamento de 80 € e angariei 215 € em vendas\nApresentei o projeto a um júri de professores e empresários' },
    { id: uid(), kind: 'club', title: 'Membro', org: 'Clube de Teatro', location: '', start: '2023-10', end: '', current: true,
      bullets: 'Participei em 3 peças apresentadas à comunidade escolar\nMelhorei a minha confiança a falar em público' },
  ],
  skills: ['Microsoft Word', 'Microsoft Excel', 'Canva', 'Comunicação', 'Trabalho em equipa', 'Organização', 'Atendimento ao público'],
  languages: [
    { id: uid(), name: 'Português', level: 'native' },
    { id: uid(), name: 'Inglês', level: 'B2' },
    { id: uid(), name: 'Espanhol', level: 'A2' },
  ],
  extras: [
    { id: uid(), kind: 'certificate', title: 'Cambridge B2 First', detail: 'Preparação concluída em 2025' },
    { id: uid(), kind: 'licence', title: 'Carta de condução', detail: 'Categoria B (em preparação)' },
    { id: uid(), kind: 'interests', title: 'Interesses', detail: 'Teatro, leitura, corrida' },
  ],
})
