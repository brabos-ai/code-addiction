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
  home: {},
  docs: {},
};

export type Strings = typeof en;
