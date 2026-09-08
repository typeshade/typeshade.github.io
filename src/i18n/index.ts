// Locales, and the two things every page needs from them: the copy and the path.
// English is the source text; every other locale is a translation of it, typed against it
// so a missing string is a build error.
import { en } from './en.ts'
import { ko } from './ko.ts'

export const locales = ['en', 'ko'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export type Copy = typeof en

export const copies: Record<Locale, Copy> = { en, ko }

export const copyFor = (locale: Locale): Copy => copies[locale]

/** The path of a locale-neutral route ('/', '/checks/') in a given locale. */
export function localePath(locale: Locale, path: string): string {
  // Pages end in a slash, which is the URL GitHub Pages serves them at; files keep their name.
  const p = path.endsWith('/') || /\.[a-z0-9]+$/i.test(path) ? path : `${path}/`
  return locale === defaultLocale ? p : `/${locale}${p}`
}

/** Absolute URL for hreflang and canonical links. */
export function localeUrl(site: URL, locale: Locale, path: string): string {
  return new URL(localePath(locale, path), site).toString()
}
