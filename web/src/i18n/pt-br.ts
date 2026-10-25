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
  docs: {
    title: "Docs — Code Addiction",
    nav: {
      toggleSidebar: "Abrir ou fechar a barra lateral",
      search: "Buscar",
      searchAria: "Buscar na documentação",
      home: "Início",
      github: "GitHub",
    },
    sidebar: {
      backToHome: "Voltar ao início",
      groups: {
        gettingStarted: "Primeiros passos",
        reference: "Referência",
        deepDive: "Aprofundando",
      },
      items: {
        about: "Sobre",
        install: "Instalação",
        quickstart: "Início rápido",
        setup: "Setup guiado",
        commands: "Comandos",
        graph: "Grafo",
        flows: "Fluxos",
        scenarios: "Cenários",
        skills: "Skills",
        features: "Features opcionais",
        agentMode: "Modo agent",
        plugins: "Plugins",
        providers: "Providers",
        structure: "Estrutura do projeto",
        ecosystem: "Mapa do ecossistema",
      },
    },
    about: {
      heading: 'O que é o Code<br/><span class="text-accent glow">Addiction</span>?',
      intro: "O Code Addiction é um framework spec-driven para assistentes de código com IA. Ele padroniza o caminho de uma feature, da ideia até a produção, com fluxos estruturados e repetíveis. Entra em qualquer projeto com um único comando.",
      coreDesc: "Núcleo compartilhado: commands, scripts, skills, templates",
      adaptersTitle: "Adaptadores de provider",
    },
    install: {
      heading: "Instalação",
      requirements: "Precisa do Node.js 22.19.0 ou mais novo (recomendamos o Node 24 LTS). Funciona no Windows, macOS e Linux &mdash; sem Bash, WSL ou Git-Bash.",
      commentInstall: "# instala no seu projeto",
      commentVersion: "# instala uma versão específica",
      commentBranch: "# instala de uma branch específica",
      commentExisting: "# já instalado? mostra Modify / Update / Reinstall / Cancel",
      whatInstalled: "O que é instalado",
      coreAlways: "núcleo (sempre)",
      scriptsNote: 'Os scripts do framework são entradas Node — <code class="font-mono text-xs">node .codeadd/scripts/&lt;entry&gt;.cjs</code> — então não precisa de Bash, WSL ou Git-Bash em nenhuma plataforma.',
    },
    quickstart: {
      heading: "Início rápido",
      intro: "Depois de instalar, use estes comandos da CLI para cuidar do seu setup:",
      items: [
        { name: "npx codeadd doctor", desc: "Confere a saúde do ambiente — Node, Git, estado da instalação" },
        { name: "npx codeadd validate", desc: "Valida a integridade dos arquivos com hashes SHA-256" },
        { name: "npx codeadd validate --repair", desc: "Restaura arquivos que sumiram ou foram alterados, a partir do release" },
        { name: "npx codeadd update", desc: "Atualiza para o último release, ou baixa de novo a branch atual" },
        { name: "npx codeadd uninstall", desc: "Remove todos os arquivos do Code Addiction (os seus arquivos ficam)" },
        { name: "npx codeadd uninstall --force", desc: "Pula a confirmação ao desinstalar" },
        { name: "npx codeadd features", desc: "Lista, liga ou desliga as features opcionais (tdd-pipeline, qa-pipeline, docs-pruning, board)" },
        { name: "npx codeadd plugins", desc: "Lista, liga ou desliga plugins (ex.: GitNexus, Playwright, Design). Se um plugin ligado não tem a ferramenta detectada, o nome dele aparece na saída do install/update" },
        { name: "npx codeadd providers", desc: 'Lista os providers, ou adiciona / remove um: <code class="text-foreground">providers list|add &lt;name&gt;|remove &lt;name&gt; [--force]</code>. Aceita <code class="text-foreground">--global</code> / <code class="text-foreground">--user</code>' },
        { name: "npx codeadd modify", desc: 'Tela interativa para editar providers, features e plugins de uma instalação existente num só lugar. Aceita <code class="text-foreground">--global</code> / <code class="text-foreground">--user</code>' },
        { name: "npx codeadd config show", desc: 'Mostra a configuração da instalação. Adicione <code class="text-foreground">--verbose</code> para checar se há atualização' },
      ],
    },
    setup: {
      heading: "Setup guiado",
      intro: '<code class="text-accent font-mono text-sm">/add-setup</code> é o onboarding guiado para uma instalação nova ou atualizada. Ele olha o seu projeto e depois oferece cada feature e <a href="#plugins" class="text-accent underline underline-offset-2 hover:text-accent-dim">plugin</a> com o benefício de cada um, numa <strong>única lista numerada</strong>, com uma resposta recomendada para cada item. Responda uma vez, por exemplo <code class="font-mono text-xs">1 sim, 2 não</code> ou <code class="font-mono text-xs">tudo recomendado</code>.',
      steps: [
        { title: "1 &mdash; Checar", desc: "Lê o projeto (código, frontend, wiki, setup de QA) e o que já está ligado. Não muda nada." },
        { title: "2 &mdash; Oferecer", desc: "Uma lista numerada. O que já está ligado, ou que você recusou antes, não é perguntado de novo." },
        { title: "3 &mdash; Executar", desc: 'Só os itens que você aceitar: instalação de ferramentas, um <code class="font-mono text-xs">codeadd modify</code>, <code class="font-mono text-xs">/add-qa-setup</code> e <code class="font-mono text-xs">/add-wiki</code>.' },
      ],
      rows: [
        { label: "Quando rodar", desc: 'Uma vez, depois de <code class="font-mono text-xs text-foreground">codeadd install</code> ou <code class="font-mono text-xs text-foreground">codeadd update</code>. Depois de um update, ele pergunta só dos itens que são novos naquela versão.' },
        { label: "Onde ficam as escolhas", desc: 'Cada decisão e o motivo dela ficam em <code class="font-mono text-xs text-foreground">.codeadd/settings.json</code>. Faça commit desse arquivo para o time e os próximos updates verem o que foi ligado e por quê.' },
        { label: "Projeto vazio", desc: 'Se ainda não há código, ele não oferece nada e te leva para o <code class="font-mono text-xs text-foreground">/add-brainstorm</code>. Rode de novo quando as fundações existirem.' },
      ],
    },
    commands: {
      heading: "Comandos",
      intro: "Todo comando é um slash command que você digita no seu assistente de código com IA. Eles cuidam da descoberta, do planejamento, da implementação e da entrega.",
      groups: [
        {
          title: "Descoberta",
          items: [
            { name: "/add-brainstorm", desc: "Explora ideias (só leitura); define as bases da stack num repositório vazio" },
            { name: "/add-new", desc: 'Descoberta de feature guiada por IA → <code class="text-foreground">about.md</code>' },
            { name: "/add-wiki", desc: "Gera uma wiki portátil do projeto (.codeadd/wiki/)" },
          ],
        },
        {
          title: "Planejamento",
          items: [
            { name: "/add-plan", desc: 'Orquestrador de planejamento técnico — aciona os agents de UX Design, Database, Backend e Frontend. Único que escreve o <code class="text-foreground">design.md</code> (STEP 8.1) em features com interface' },
          ],
        },
        {
          title: "Implementação",
          items: [
            { name: "/add-build", desc: "Especialista em execução do desenvolvimento — fecha cada unidade de entrega com o seu próprio Final Review" },
          ],
        },
        {
          title: "Qualidade",
          items: [
            { name: "/add-review", desc: 'Especialista em review de feature — code review só de leitura e auditoria de conformidade com a spec; com a feature <code class="text-foreground">qa-pipeline</code> ligada, também faz QA julgado por agents (painel de dois juízes sobre as evidências guardadas da execução). Roda uma checagem OWASP Top 10 junto do review da área quando o diff toca numa área sensível (auth, pagamento, upload, tratamento de entrada, sessão/token). Junta todos os achados numa tabela <code class="text-foreground">## Fix Routing</code> e escreve um <code class="text-foreground">review-NNN.md</code> versionado. Encaminha os achados, nunca aplica. Opcional — o <code class="text-foreground">/add-build</code> já roda o próprio Final Review, e o <code class="text-foreground">/add-done</code> aceita o veredito mais recente' },
            { name: "/add-audit", desc: "Análise completa da saúde do projeto" },
            { name: "/add-diagnose", desc: 'Triagem antes da decisão para sintomas ambíguos (só leitura); guarda o diagnóstico para o <code class="text-foreground">/add-hotfix</code> reaproveitar' },
            { name: "/add-qa-setup", desc: 'Bootstrap de QA verificado de ponta a ponta — verifica e instala o runner de QA, gera o qa-project, cria config/screens, ignora a evidência temporária de trabalho sob um setup contract, migra o QA existente e faz um smoke test do julgamento de QA via <code class="text-foreground">/add-review</code>' },
          ],
        },
        {
          title: "Entrega",
          items: [
            { name: "/add-done", desc: 'Fechamento da branch e merge - promove a evidência de QA revisada, finaliza changelog e documentação, e faz o merge. O fechamento de um hotfix exige um recibo de Review aprovado no <code class="text-foreground">about.md</code>. O deploy não faz parte da entrega - ele roda depois do <code class="text-foreground">/add-done</code>, pelo seu próprio processo de deploy' },
            { name: "/add-pull-request", desc: "PR idempotente - cria um PR novo ou acrescenta uma seção de atualização se já houver um aberto. Gera o changelog da feature em branches de feature" },
            { name: "/add-hotfix", desc: 'Correção de emergência com ID global (H[NNNN]) — reaproveita um <code class="text-foreground">/add-diagnose</code> aceito quando existe' },
          ],
        },
        {
          title: "Utilitários",
          items: [
            { name: "/add-help", desc: "Guia de ajuda — qual comando usar, features e plugins, modo bot, CLI" },
            { name: "/add-setup", desc: "Onboarding guiado — oferece cada feature e plugin com o seu benefício e configura os que você aceitar" },
            { name: "/add-ux", desc: "UX rápido — carrega o ux-design para dar contexto sem custo" },
          ],
        },
      ],
    },
  },
};
