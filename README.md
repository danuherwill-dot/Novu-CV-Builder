# Novu

Web app (pt-PT) que ajuda estudantes a criar o **primeiro CV**, com dicas em cada passo.
Sem contas, sem servidor: tudo corre no navegador e os rascunhos ficam guardados no próprio dispositivo (localStorage).

## O que faz
- Guia em 8 passos: dados pessoais, perfil, formação, experiência (trabalho, projetos, voluntariado, clubes), competências, idiomas, extras, finalizar.
- Dicas, exemplos "fraco vs melhor", listas de verificação e verbos de ação em cada passo, mais um "Guia rápido".
- Pré-visualização A4 em direto; 8 modelos, 2 deles feitos para foto (Retrato, Centrado) (Moderno, Lateral, Audaz, Minimalista, Clássico, estilo Europass); cores e formato de datas à escolha; foto opcional.
- Exportação para PDF A4 com texto selecionável (compatível com ATS) através da impressão do navegador.
- Importar um CV existente (PDF, Word ou texto): lê-se no navegador, preenche os campos e podes escolher um modelo e editar. É uma leitura por padrões (sem IA), por isso o utilizador deve rever cada passo; PDFs digitalizados (imagem) não são lidos.
- Vários rascunhos, cópia de segurança/importação em `.json`.

## Correr localmente
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera a pasta dist/
npm run preview  # testa o build
```
Requer Node 18+.

## Publicar (site estático)
O build é só HTML/JS/CSS (`dist/`), com caminhos relativos (`base: './'`), por isso funciona em qualquer alojamento estático.

**Netlify (mais fácil):** em app.netlify.com → *Add new site → Deploy manually* e arrasta a pasta `dist/`. Ou liga o repositório com *Build command* `npm run build` e *Publish directory* `dist`.

**Vercel:** importa o repositório; a Vercel deteta Vite sozinha (`npm run build`, `dist`).

**GitHub Pages:** cria um repositório, faz push, e em *Settings → Pages* escolhe *GitHub Actions* com este ficheiro em `.github/workflows/pages.yml`:
```yaml
name: Deploy
on: { push: { branches: [main] } }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages }
    steps:
      - uses: actions/deploy-pages@v4
```

## Adicionar inglês
Todo o texto (interface, dicas, rótulos do CV) vive em `src/i18n/pt.ts`. Copia para `src/i18n/en.ts`, traduz os valores (mantém as chaves), regista `en` em `src/i18n/index.ts` (`Lang` e `dicts`) e liga um seletor de idioma em `App.tsx`.

## Estrutura
```
src/
  i18n/pt.ts          textos e dicas
  components/         Steps (formulários), CVDocument (modelos), Preview, TipsCard, Home
  cv.css              estilos do CV (mm/pt, iguais no ecrã e no PDF)
  checks.ts           verificações / pontuação do CV
  store.ts            rascunhos em localStorage
```

## Notas
- O PDF sai da impressão do navegador (`@page` A4, margem 0). Na janela de impressão escolhe "Guardar como PDF" e desativa "Cabeçalhos e rodapés".
- Os modelos foram pensados para **uma página**; a app avisa quando passa disso.
- Privacidade: nada é enviado para lado nenhum. Limpar os dados do navegador apaga os rascunhos, por isso há a cópia `.json`.
