// Brazilian Portuguese copy, served at /pt-br/ and /pt-br/docs/. Same leaves as en.ts: a missing,
// extra or empty key fails the web build (see index.ts). Written as natural Brazilian Portuguese,
// not a literal translation. Artefact names, commands and paths stay as in en.ts.
import type { Strings } from "./en";

export const ptBr: Strings = {
  common: {
    language: "Idioma",
    localeEn: "EN",
    localePtBr: "PT-BR",
    skipToContent: "Pular para o conteúdo",
    copy: "Copiar",
    copied: "Copiado",
    copiedStatus: "Copiado para a área de transferência",
    select: "Selecionar",
    selectStatus: "Selecionado. Pressione Ctrl+C para copiar",
  },
  layout: {
    htmlLang: "pt-BR",
    ogLocale: "pt_BR",
    ogLocaleAlternate: "en_US",
    description:
      "Um framework orientado a especificações para assistentes de código com IA. Fluxos estruturados da descoberta à entrega.",
  },
  home: {
    title: "Code Addiction — Framework de desenvolvimento com IA orientado a especificações",
    nav: {
      toggleMenu: "Abrir ou fechar o menu",
      howItWorks: "Como funciona",
      why: "Por quê",
      getStarted: "Começar",
      docs: "Docs",
      github: "GitHub",
    },
    hero: {
      eyebrow: "Framework orientado a especificações",
      tagline:
        'Fluxos estruturados da descoberta à entrega. <br class="hidden sm:block"/>\n        Instala em segundos. Vicia de usar.',
      viewOnGithub: "Ver no GitHub",
    },
    session: {
      eyebrow: "Uma sessão, resumida",
      heading: "Planeje e construa uma feature em dois comandos",
      discovery: "Descoberta: 3 perguntas feitas, 3 decisões registradas",
      planWritten: "Plano escrito: 4 tarefas, 2 testes de aceitação",
      task1: "Tarefa 1/4  schema e migration ......... feito",
      task2: "Tarefa 2/4  serviço de desconto ........ feito",
      task3: "Tarefa 3/4  endpoint da API ............ feito",
      task4: "Tarefa 4/4  formulário de checkout ..... feito",
      complete: "Build concluído: testes passando, pronto para /add-review",
    },
    trail: {
      eyebrow: "Como funciona",
      heading: "A Trilha de Desenvolvimento",
      intro: "Toda feature segue um caminho claro, da ideia à entrega. Escolha a trilha que combina com a sua tarefa.",
      viewFullSize: "Ver imagem em tamanho real",
      alt: "Fluxograma da Trilha de Desenvolvimento do Code Addiction",
      enlarge: "ampliar",
      dialogLabel: "Fluxograma da Trilha de Desenvolvimento, em tamanho real",
      close: "Fechar",
    },
    why: {
      eyebrow: "Por que as equipes viciam",
      heading: "Menos cerimônia. Mesma qualidade.",
      cards: [
        { title: "Sem curva de entrada", desc: "Quem chega entrega no primeiro dia, só seguindo o fluxo. Sem wiki para ler, sem guia de setup." },
        { title: "10x menos decisões", desc: "O framework já tomou as decisões chatas. Você foca no que importa." },
        { title: "Resultado consistente", desc: "Toda feature passa por descoberta, planejamento, revisão e docs. Automaticamente." },
        { title: "Funciona com a sua stack", desc: "NestJS, React, qualquer banco de dados. Claude, Codex, Antigravity, Cursor, OpenCode, ZCode." },
      ],
    },
    providers: {
      eyebrow: "Uma instalação, todos os providers",
      heading: "Roda em qualquer lugar",
    },
    start: {
      eyebrow: "Começar",
      heading: "A um comando de distância",
      lead: "Instale o Code Addiction em qualquer projeto. Sem configuração.",
      requires: "Exige Node.js 22.19.0 ou mais novo (Node 24 LTS recomendado) &mdash; não precisa de Bash, WSL nem Git-Bash.",
      installComment: "# instale no seu projeto",
      readDocs: "Ler a documentação",
    },
    footer: {
      by: "por brabos.ai",
      github: "GitHub",
      linkedin: "LinkedIn",
      npm: "npm",
    },
  },
  docs: {},
};
