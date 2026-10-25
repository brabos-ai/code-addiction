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
  docs: {
    title: "Docs — Code Addiction",
    nav: {
      toggleSidebar: "Toggle sidebar",
      search: "Search",
      searchAria: "Search the docs",
      home: "Home",
      github: "GitHub",
    },
    sidebar: {
      backToHome: "Back to Home",
      groups: {
        gettingStarted: "Getting Started",
        reference: "Reference",
        deepDive: "Deep Dive",
      },
      items: {
        about: "About",
        install: "Installation",
        quickstart: "Quickstart",
        setup: "Guided Setup",
        commands: "Commands",
        graph: "Graph",
        flows: "Flows",
        scenarios: "Scenarios",
        skills: "Skills",
        features: "Optional Features",
        agentMode: "Agent Mode",
        plugins: "Plugins",
        providers: "Providers",
        structure: "Project Structure",
        ecosystem: "Ecosystem Map",
      },
    },
    about: {
      heading: 'What is Code<br/><span class="text-accent glow">Addiction</span>?',
      intro: "Code Addiction is a spec-driven framework for AI coding assistants. It standardizes how features go from idea to production through structured, repeatable workflows — installed in any project with a single command.",
      coreDesc: "Shared core: commands, scripts, skills, templates",
      adaptersTitle: "Provider adapters",
    },
    install: {
      heading: "Installation",
      requirements: "Requires Node.js 22.19.0 or newer (Node 24 LTS recommended). Works on Windows, macOS and Linux &mdash; no Bash, WSL or Git-Bash needed.",
      commentInstall: "# install in your project",
      commentVersion: "# install specific version",
      commentBranch: "# install from a specific branch",
      commentExisting: "# already installed? shows Modify / Update / Reinstall / Cancel",
      whatInstalled: "What gets installed",
      coreAlways: "core (always)",
      scriptsNote: 'Framework scripts are Node entries — <code class="font-mono text-xs">node .codeadd/scripts/&lt;entry&gt;.cjs</code> — so no Bash, WSL or Git-Bash is required on any platform.',
    },
    quickstart: {
      heading: "Quickstart",
      intro: "After installing, use these CLI commands to manage your setup:",
      items: [
        { name: "npx codeadd doctor", desc: "Check environment health — Node, Git, installation status" },
        { name: "npx codeadd validate", desc: "Validate file integrity via SHA-256 hashes" },
        { name: "npx codeadd validate --repair", desc: "Restore missing or modified files from the release" },
        { name: "npx codeadd update", desc: "Update to latest release, or re-pull current branch" },
        { name: "npx codeadd uninstall", desc: "Clean removal of all Code Addiction files (user files are kept)" },
        { name: "npx codeadd uninstall --force", desc: "Skip confirmation prompt during uninstall" },
        { name: "npx codeadd features", desc: "List, enable, or disable optional features (tdd-pipeline, qa-pipeline, docs-pruning, board)" },
        { name: "npx codeadd plugins", desc: "List, enable, or disable plugins (e.g. GitNexus, Playwright, Design). An enabled plugin whose tool is not detected is named in install/update output" },
        { name: "npx codeadd providers", desc: 'List providers, or add / remove one: <code class="text-foreground">providers list|add &lt;name&gt;|remove &lt;name&gt; [--force]</code>. Accepts <code class="text-foreground">--global</code> / <code class="text-foreground">--user</code>' },
        { name: "npx codeadd modify", desc: 'Interactive screen to edit providers, features and plugins of an existing installation in one place. Accepts <code class="text-foreground">--global</code> / <code class="text-foreground">--user</code>' },
        { name: "npx codeadd config show", desc: 'Display installation configuration. Add <code class="text-foreground">--verbose</code> to check for updates' },
      ],
    },
    setup: {
      heading: "Guided Setup",
      intro: '<code class="text-accent font-mono text-sm">/add-setup</code> is the guided onboarding for a fresh or updated install. It checks your project, then offers every feature and <a href="#plugins" class="text-accent underline underline-offset-2 hover:text-accent-dim">plugin</a> with its benefit in <strong>one numbered list</strong>, with a recommended answer for each. Reply once, for example <code class="font-mono text-xs">1 yes, 2 no</code> or <code class="font-mono text-xs">all recommended</code>.',
      steps: [
        { title: "1 &mdash; Check", desc: "Reads the project (code, frontend, wiki, QA setup) and what is already on. Changes nothing." },
        { title: "2 &mdash; Offer", desc: "One numbered list. Items already on, or declined before, are not asked again." },
        { title: "3 &mdash; Run", desc: 'Only the items you accept: tool installs, one <code class="font-mono text-xs">codeadd modify</code>, <code class="font-mono text-xs">/add-qa-setup</code> and <code class="font-mono text-xs">/add-wiki</code>.' },
      ],
      rows: [
        { label: "When to run", desc: 'Once after <code class="font-mono text-xs text-foreground">codeadd install</code> or <code class="font-mono text-xs text-foreground">codeadd update</code>. After an update it asks only about items that are new in that version.' },
        { label: "Where choices live", desc: 'Every decision and its reason is recorded in <code class="font-mono text-xs text-foreground">.codeadd/settings.json</code>. Commit this file so teammates and future updates see what was enabled and why.' },
        { label: "Empty project", desc: 'With no code yet, it offers nothing and points you to <code class="font-mono text-xs text-foreground">/add-brainstorm</code>. Run it again once the foundations exist.' },
      ],
    },
    commands: {
      heading: "Commands",
      intro: "Every command is a slash command you type in your AI coding assistant. They orchestrate discovery, planning, implementation, and delivery.",
      groups: [
        {
          title: "Discovery",
          items: [
            { name: "/add-brainstorm", desc: "Explore ideas (read-only); decides stack foundations on an empty repo" },
            { name: "/add-new", desc: 'AI-guided feature discovery → <code class="text-foreground">about.md</code>' },
            { name: "/add-wiki", desc: "Generate a portable project wiki (.codeadd/wiki/)" },
          ],
        },
        {
          title: "Planning",
          items: [
            { name: "/add-plan", desc: 'Technical Planning Orchestrator — dispatches UX Design, Database, Backend and Frontend agents. Sole writer of <code class="text-foreground">design.md</code> (STEP 8.1) for UI-touching features' },
          ],
        },
        {
          title: "Implementation",
          items: [
            { name: "/add-build", desc: "Development Execution Specialist — closes each delivery unit with its own Final Review" },
          ],
        },
        {
          title: "Quality",
          items: [
            { name: "/add-review", desc: 'Feature review specialist — read-only code review and spec-compliance audit; with the <code class="text-foreground">qa-pipeline</code> feature enabled, also agent-judged QA (dual-judge panel over persisted run evidence). Dispatches an OWASP Top 10 pass alongside the area review when the diff touches a sensitive area (auth, payment, upload, input handling, session/token). Consolidates every finding into one <code class="text-foreground">## Fix Routing</code> table and writes a versioned <code class="text-foreground">review-NNN.md</code>. Routes findings, never applies them. Optional — <code class="text-foreground">/add-build</code> runs its own Final Review, and <code class="text-foreground">/add-done</code> accepts whichever verdict is most recent' },
            { name: "/add-audit", desc: "Full project health analysis" },
            { name: "/add-diagnose", desc: 'Pre-decision triage for ambiguous symptoms (read-only); persists the diagnosis for <code class="text-foreground">/add-hotfix</code> to reuse' },
            { name: "/add-qa-setup", desc: 'End-to-end-verified QA bootstrap — verifies + installs the QA runner, generates qa-project, scaffolds config/screens, ignores ephemeral working evidence under a setup contract, migrates existing QA, and smoke-tests the QA judgement via <code class="text-foreground">/add-review</code>' },
          ],
        },
        {
          title: "Delivery",
          items: [
            { name: "/add-done", desc: 'Branch completion and merge - promotes reviewed QA evidence, finalizes changelog and documentation, then merges. Hotfix close-out requires a passed Review receipt in <code class="text-foreground">about.md</code>. Deploy is not part of a delivery - it runs after <code class="text-foreground">/add-done</code>, through your own deploy process' },
            { name: "/add-pull-request", desc: "Idempotent PR - creates new PR or appends update section if one is already open. Generates feature changelog on feature branches" },
            { name: "/add-hotfix", desc: 'Emergency fix with global ID (H[NNNN]) — reuses an accepted <code class="text-foreground">/add-diagnose</code> when available' },
          ],
        },
        {
          title: "Utilities",
          items: [
            { name: "/add-help", desc: "Help guide — which command, features and plugins, bot mode, CLI" },
            { name: "/add-setup", desc: "Guided onboarding — offers each feature and plugin with its benefit, sets up the ones you accept" },
            { name: "/add-ux", desc: "Quick UX — loads ux-design for free context" },
          ],
        },
      ],
    },
  },
};

export type Strings = typeof en;
