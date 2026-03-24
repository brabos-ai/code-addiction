# Arquitetura Frontend -- Site Institucional + Blog (Vue 3 + Nuxt)

## Contexto Avaliado

| Criterio | Sua Situacao | Classificacao |
|----------|-------------|---------------|
| **Escala** | 6 paginas (home, sobre, servicos, contato, blog, post) | Small (1-10 paginas) |
| **Equipe** | Dev solo | Solo |
| **Reuso de componentes** | Portfolio clean, componentes de UI basicos | Minimal |
| **Complexidade de dominio** | Exibir conteudo, formulario de contato, listagem de blog | Light (display data, simple forms) |
| **Framework** | Vue 3 + Nuxt | Medium opinion -- Nuxt cuida de routing e auto-imports |

## Padrao Recomendado: Simple Component-Based

Para o seu cenario, **Simple Component-Based** e a escolha certa. Motivos:

- **6 paginas e dev solo** -- qualquer coisa alem disso seria over-engineering. Voce teria mais pastas do que arquivos dentro delas.
- **Complexidade light** -- nao ha fluxos multi-step, state complexo ou logica de negocio pesada. E um site de conteudo.
- **Nuxt ja resolve bastante** -- file-based routing, auto-imports, SSR/SSG. Voce nao precisa definir camadas extras que o Nuxt ja cobre.

**Por que NAO Feature-Based?** Com 6 paginas e ~15-20 componentes no maximo, criar pastas `features/blog/`, `features/contact/` etc. adicionaria cerimonia sem beneficio. Voce vai gastar mais tempo navegando a estrutura do que desenvolvendo. O sinal para migrar e quando `components/` ultrapassar 25-30 arquivos.

**Por que NAO Feature-Sliced Design?** FSD e para 30+ paginas com 6+ devs. No seu caso, seria como usar um caminhao para ir na padaria.

## Estrutura de Pastas Recomendada

```
├── pages/                         # Nuxt file-based routing (paginas finas)
│   ├── index.vue                  # Home
│   ├── sobre.vue                  # Sobre
│   ├── servicos.vue               # Servicos
│   ├── contato.vue                # Contato
│   ├── blog/
│   │   ├── index.vue              # Listagem do blog
│   │   └── [slug].vue             # Post individual
│
├── components/                    # Flat -- sem subpastas desnecessarias
│   ├── AppHeader.vue              # Header do site (nav, logo)
│   ├── AppFooter.vue              # Footer (links, copyright)
│   ├── HeroSection.vue            # Hero da home
│   ├── ServiceCard.vue            # Card de servico
│   ├── ProjectCard.vue            # Card de portfolio/projeto
│   ├── ContactForm.vue            # Formulario de contato
│   ├── BlogPostCard.vue           # Card de preview do post no blog
│   ├── BlogPostContent.vue        # Renderizacao do conteudo do post
│   ├── SectionTitle.vue           # Titulo de secao reutilizavel
│   └── SocialLinks.vue            # Links para redes sociais
│
├── composables/                   # Logica reutilizavel
│   ├── useContactForm.ts          # Logica do formulario (validacao, envio)
│   └── useBlogPosts.ts            # Fetch e filtragem dos posts
│
├── content/                       # Nuxt Content (se usar @nuxt/content)
│   └── blog/
│       ├── meu-primeiro-post.md
│       └── outro-post.md
│
├── lib/                           # Utilitarios
│   ├── api.ts                     # Cliente HTTP (se precisar de API externa)
│   └── format.ts                  # Formatacao de datas, texto
│
├── types/                         # Tipagens
│   ├── blog.ts                    # Post, Tag, Category
│   └── service.ts                 # Service, Project
│
├── assets/                        # Imagens, fontes, CSS global
│   ├── css/
│   │   └── main.css
│   └── images/
│
├── public/                        # Arquivos estaticos (favicon, robots.txt)
│
├── app.vue                        # Root component
├── nuxt.config.ts                 # Configuracao do Nuxt
└── package.json
```

## Regras da Estrutura

### Paginas sao finas
As paginas em `pages/` apenas compoem componentes. A logica fica nos composables.

```vue
<!-- pages/contato.vue -->
<template>
  <div>
    <SectionTitle title="Contato" subtitle="Vamos conversar" />
    <ContactForm />
  </div>
</template>
```

A pagina nao faz fetch, nao tem logica de validacao, nao gerencia estado. Ela so monta o layout.

### Components fica flat
Com ~10-15 componentes, uma pasta flat e perfeita. Voce abre `components/` e ve tudo de uma vez. O prefixo `App` diferencia componentes de layout (`AppHeader`, `AppFooter`) dos de conteudo (`ServiceCard`, `BlogPostCard`).

O Nuxt auto-importa tudo de `components/`, entao voce nem precisa de imports manuais.

### Composables para logica, nao Pinia
Para um site institucional, voce provavelmente nao precisa de Pinia. Composables resolvem:

```ts
// composables/useBlogPosts.ts
export function useBlogPosts() {
  // Com @nuxt/content
  const { data: posts } = await useAsyncData('blog-posts', () =>
    queryContent('blog').sort({ date: -1 }).find()
  )
  return { posts }
}
```

```ts
// composables/useContactForm.ts
export function useContactForm() {
  const form = reactive({ name: '', email: '', message: '' })
  const sending = ref(false)
  const sent = ref(false)

  async function submit() {
    sending.value = true
    // enviar para API ou servico (Formspree, Netlify Forms, etc.)
    sent.value = true
    sending.value = false
  }

  return { form, sending, sent, submit }
}
```

**Quando adicionar Pinia?** Somente se voce precisar de estado que sobrevive a troca de rota e e compartilhado em multiplas paginas (ex: theme toggle dark/light). Para esse projeto, provavelmente nao vai precisar.

### Blog com @nuxt/content
Para um blog integrado em site institucional, `@nuxt/content` e a escolha natural. Voce escreve posts em Markdown na pasta `content/blog/`, e o Nuxt cuida do parsing, query e renderizacao. Sem precisar de CMS externo nem API.

## Dica para o Blog com Nuxt Content

Configure `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/content'],
  content: {
    highlight: {
      theme: 'github-dark'  // syntax highlighting nos posts
    }
  }
})
```

A pagina `pages/blog/[slug].vue` usa o componente `<ContentDoc />` do Nuxt Content para renderizar o post automaticamente.

## Quando Migrar para Feature-Based

Sinais de que voce precisa repensar a estrutura:

- `components/` passou de 25-30 arquivos
- Voce adicionou area de admin, dashboard de clientes, ou outra "area" do site
- `composables/` mistura concerns (auth + blog + analytics na mesma pasta)
- Voce contratou outro dev e ele nao sabe onde colocar coisas

Nesse ponto, migre para Feature-Based: agrupe componentes, composables e types por dominio (`features/blog/`, `features/portfolio/`, `features/admin/`).

## Resumo

| Decisao | Escolha | Motivo |
|---------|---------|--------|
| Padrao | Simple Component-Based | 6 paginas, dev solo, complexidade light |
| Routing | Nuxt file-based routing | Ja vem de graca com Nuxt |
| Blog | @nuxt/content com Markdown | Sem backend, sem CMS, simple |
| Estado | Composables (sem Pinia) | Nao ha estado global complexo |
| Componentes | Flat em `components/`, prefixo `App` para layout | ~15 componentes, facil de navegar |
| Styling | A sua escolha (Tailwind, UnoCSS, ou CSS puro) | Nao impacta a arquitetura |
