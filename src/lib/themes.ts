/**
 * Single source of truth for the color-theme catalog.
 *
 * The CSS variables themselves live in `src/app/globals.css` under
 * `html[data-theme="..."]` blocks — that file is the one we paste
 * theme tokens into. This module only carries the metadata the UI
 * (settings picker, no-flash boot script) needs.
 *
 * Adding a new theme is a two-step change:
 *   1. Append the new `html[data-theme="<id>"]` block in globals.css
 *      with every token from an existing theme (use violet as the
 *      shape reference).
 *   2. Add an entry below. The order here drives the picker grid.
 */

export const THEME_IDS = [
  "deversol",
  "cobalt",
  "emerald",
  "amber",
  "slate",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "deversol";

export const STORAGE_KEY = "wacrm.theme";

/**
 * MODE — the light/dark dimension, orthogonal to the accent theme.
 *
 * The CSS variables live in `src/app/globals.css` under
 * `html[data-mode="..."]` blocks (neutral surfaces only). Applied
 * at runtime via `document.documentElement.dataset.mode`. Dark is
 * the historical default and stays the app's identity; light is the
 * opt-in eye-strain-friendly alternative.
 *
 * Persisted under its own localStorage key so it composes freely
 * with the accent choice (you can run Deversol-light or Deversol-dark).
 */
export const MODES = ["light", "dark"] as const;

export type Mode = (typeof MODES)[number];

export const DEFAULT_MODE: Mode = "dark";

export const MODE_STORAGE_KEY = "wacrm.mode";

export function isMode(value: unknown): value is Mode {
  return (
    typeof value === "string" && (MODES as ReadonlyArray<string>).includes(value)
  );
}

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  tagline: string;
  /**
   * Static swatch color for the picker chip. Hard-coded so the boot
   * script / picker cards don't need a getComputedStyle round trip
   * before the page settles. Must mirror `--primary` of the same
   * theme in globals.css.
   */
  swatch: string;
}

export const THEMES: ReadonlyArray<ThemeMeta> = [
  {
    id: "deversol",
    name: "Deversol Navy",
    tagline: "The brand standard — authoritative, high-contrast B2B systems.",
    swatch: "oklch(0.24 0.05 240)",
  },
  {
    id: "cobalt",
    name: "Deep Cobalt",
    tagline: "Precision engineering blue — calm and analytical.",
    swatch: "oklch(0.48 0.16 250)",
  },
  {
    id: "emerald",
    name: "Systems Green",
    tagline: "Growth-coded — revenue operations and conversion pipeline.",
    swatch: "oklch(0.55 0.15 155)",
  },
  {
    id: "amber",
    name: "Audit Amber",
    tagline: "High-visibility diagnostic accent — alert & revenue audit.",
    swatch: "oklch(0.72 0.15 70)",
  },
  {
    id: "slate",
    name: "Architectural Slate",
    tagline: "Minimalist, restrained, editorial monochromatic.",
    swatch: "oklch(0.48 0.03 240)",
  },
];

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" &&
    (THEME_IDS as ReadonlyArray<string>).includes(value)
  );
}
