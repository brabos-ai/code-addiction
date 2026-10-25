// Strings lookup for the site. The guards below run when this module loads, so a bad pt-br.ts
// fails `astro build` (the build does not type-check). `Strings` in pt-br.ts only helps the editor.
import { getRelativeLocaleUrl } from "astro:i18n";
import { en } from "./en";
import { ptBr } from "./pt-br";

export type Locale = "en" | "pt-br";

const TREES: Record<Locale, unknown> = { en, "pt-br": ptBr };

// PT values allowed to equal their EN value: brand words, artefact names, words Portuguese borrows
// as is. Exact dotted path; `*` stands for one index segment (docs.skills.items.*.desc).
export const SAME_IN_BOTH: string[] = [
  "common.localeEn",
  "common.localePtBr",
];

// Top-level sections the same-value guard skips while their copy is still being moved.
export const UNMIGRATED: string[] = ["home", "docs"];

function leaves(node: unknown, prefix: string, out: Map<string, string>): Map<string, string> {
  if (typeof node === "string") {
    out.set(prefix, node);
  } else if (Array.isArray(node)) {
    node.forEach((child, i) => leaves(child, prefix ? `${prefix}.${i}` : String(i), out));
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) leaves(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

const EN_LEAVES = leaves(en, "", new Map());
const PT_LEAVES = leaves(ptBr, "", new Map());

function lookup(tree: unknown, key: string): unknown {
  let node: any = tree;
  for (const part of key.split(".")) {
    if (node === null || node === undefined || typeof node !== "object" || !(part in node)) {
      throw new Error(`i18n: unknown key "${key}"`);
    }
    node = node[part];
  }
  return node;
}

function arrayLengths(node: unknown, prefix: string, out: Map<string, number>) {
  if (Array.isArray(node)) {
    out.set(prefix, node.length);
    node.forEach((child, i) => arrayLengths(child, `${prefix}.${i}`, out));
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) arrayLengths(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

// Missing, extra or empty leaf; arrays of a different length; a translated `name`. Never staged.
function assertParity() {
  for (const k of EN_LEAVES.keys()) {
    if (!PT_LEAVES.has(k)) throw new Error(`i18n: pt-br.ts is missing the key "${k}"`);
  }
  for (const k of PT_LEAVES.keys()) {
    if (!EN_LEAVES.has(k)) throw new Error(`i18n: pt-br.ts has the extra key "${k}"`);
  }
  for (const [k, v] of PT_LEAVES) {
    if (v.trim() === "") throw new Error(`i18n: pt-br.ts has an empty value for "${k}"`);
  }
  const enLens = arrayLengths(en, "", new Map());
  const ptLens = arrayLengths(ptBr, "", new Map());
  for (const [k, n] of enLens) {
    if (ptLens.get(k) !== n) throw new Error(`i18n: array "${k}" has ${n} entries in en.ts and ${ptLens.get(k)} in pt-br.ts`);
  }
  for (const [k, v] of PT_LEAVES) {
    if (k.split(".").pop() === "name" && v !== EN_LEAVES.get(k)) {
      throw new Error(`i18n: "${k}" is a name and must equal its en.ts value`);
    }
  }
}

function allowedSame(key: string): boolean {
  return SAME_IN_BOTH.some((pattern) => {
    const p = pattern.split(".");
    const parts = key.split(".");
    return p.length === parts.length && p.every((seg, i) => seg === "*" ? /^\d+$/.test(parts[i]) : seg === parts[i]);
  });
}

// A PT value equal to its EN value is English left behind, unless the key is declared.
function assertTranslated() {
  for (const [k, v] of PT_LEAVES) {
    if (UNMIGRATED.includes(k.split(".")[0])) continue;
    if (k.split(".").pop() === "name") continue;
    if (v === EN_LEAVES.get(k) && !allowedSame(k)) {
      throw new Error(`i18n: "${k}" is the same in pt-br.ts as in en.ts and is not in SAME_IN_BOTH`);
    }
  }
}

assertParity();
assertTranslated();

export type NamedEntry = { name: string; desc: string };

export function useT(locale: string | undefined) {
  const tree = TREES[locale === "pt-br" ? "pt-br" : "en"];
  function t(key: string): string;
  function t<T = unknown>(key: string): T;
  function t(key: string): unknown {
    return lookup(tree, key);
  }
  return t;
}

const trailing = (path: string) => (path.endsWith("/") ? path : path + "/");

/** Site-relative URL of `path` in `locale`, always with a trailing slash ("/", "/docs/", "/pt-br/"). */
export function localeHref(locale: string | undefined, path = ""): string {
  const [pathname, hash] = path.split("#");
  const href = trailing(getRelativeLocaleUrl(locale === "pt-br" ? "pt-br" : "en", pathname.replace(/^\//, "")));
  return hash ? `${href}#${hash}` : href;
}

/** Absolute EN and PT-BR URLs of the page at `url`, for the hreflang links and the toggle. */
export function alternateUrls(url: URL): { en: string; ptBr: string } {
  const origin = import.meta.env.SITE ? new URL(import.meta.env.SITE).origin : url.origin;
  const rest = url.pathname.replace(/^\/pt-br(?=\/|$)/, "") || "/";
  const base = trailing(rest);
  return {
    en: new URL(base, origin).href,
    ptBr: new URL(trailing("/pt-br" + (base === "/" ? "" : base)), origin).href,
  };
}
