// English copy: the default locale, served at / and /docs/. Values may hold inline markup
// (<code>, <a>, <strong>, <em>, <br>), rendered with set:html; a sentence is translated whole.
// Command, skill, agent, plugin and feature names, CLI commands and paths are never translated.
// Edited by /add-framework--sync together with pt-br.ts, in one run.
export const en = {
  common: {
    language: "Language",
    localeEn: "EN",
    localePtBr: "PT-BR",
    skipToContent: "Skip to content",
    copy: "Copy",
    copied: "Copied",
    copiedStatus: "Copied to clipboard",
    select: "Select",
    selectStatus: "Selected. Press Ctrl+C to copy",
  },
  layout: {
    htmlLang: "en",
    ogLocale: "en_US",
    ogLocaleAlternate: "pt_BR",
    description:
      "A spec-driven framework for AI coding assistants. Structured workflows from discovery to delivery.",
  },
  home: {
    title: "Code Addiction — Spec-driven AI development framework",
    nav: {
      toggleMenu: "Toggle menu",
      howItWorks: "How it works",
      why: "Why",
      getStarted: "Get started",
      docs: "Docs",
      github: "GitHub",
    },
    hero: {
      eyebrow: "Spec-driven framework",
      tagline:
        'Structured workflows from discovery to delivery. <br class="hidden sm:block"/>\n        Installed in seconds. Addictive to use.',
      viewOnGithub: "View on GitHub",
    },
    session: {
      eyebrow: "A session, shortened",
      heading: "Plan and build a feature in two commands",
      discovery: "Discovery: 3 questions asked, 3 decisions recorded",
      planWritten: "Plan written: 4 tasks, 2 acceptance tests",
      task1: "Task 1/4  schema and migration .......... done",
      task2: "Task 2/4  discount service ............... done",
      task3: "Task 3/4  API endpoint ................... done",
      task4: "Task 4/4  checkout form ................. done",
      complete: "Build complete: tests green, ready for /add-review",
    },
    trail: {
      eyebrow: "How it works",
      heading: "The Development Trail",
      intro: "Every feature follows a clear path from idea to delivery. Pick the trail that fits your task.",
      viewFullSize: "View full-size image",
      alt: "Code Addiction Development Trail Flowchart",
      enlarge: "enlarge",
      dialogLabel: "Development Trail flowchart, full size",
      close: "Close",
    },
    why: {
      eyebrow: "Why teams get addicted",
      heading: "Less ceremony. Same quality.",
      cards: [
        { title: "Zero ramp-up", desc: "New devs ship on day one by following the flow. No wikis to read, no setup guides." },
        { title: "10x fewer decisions", desc: "The framework already made the boring ones. You focus on what matters." },
        { title: "Consistent output", desc: "Every feature gets discovery, planning, review, and docs. Automatically." },
        { title: "Works with your stack", desc: "NestJS, React, any database. Claude, Codex, Antigravity, Cursor, OpenCode, ZCode." },
      ],
    },
    providers: {
      eyebrow: "One install, every provider",
      heading: "Runs everywhere",
    },
    start: {
      eyebrow: "Get started",
      heading: "One command away",
      lead: "Install Code Addiction in any project. No config needed.",
      requires: "Requires Node.js 22.19.0 or newer (Node 24 LTS recommended) &mdash; no Bash, WSL or Git-Bash needed.",
      installComment: "# install in your project",
      readDocs: "Read the docs",
    },
    footer: {
      by: "by brabos.ai",
      github: "GitHub",
      linkedin: "LinkedIn",
      npm: "npm",
    },
  },
  docs: {},
};

export type Strings = typeof en;
