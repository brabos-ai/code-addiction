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
  home: {},
  docs: {},
};
